'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */

const gulp = require('gulp');
const gulpif = require('gulp-if');
const mergeStream = require('merge-stream');
const polymerBuild = require('polymer-build');
const stripComments = require('gulp-strip-comments');
const htmlMinifier = require('gulp-html-minifier');
const through = require('through2');
const path = require('path');
const fs = require('fs-extra');
const {ApiConsoleSourceControl} = require('./api-console-source-control');
const {ApiConsoleBuilderOptions} = require('./api-console-builder-options');
const {RamlJsonGenerator} = require('raml-json-enhance-node');
const colors = require('colors/safe');
const compiler = require('./CompilerTransformer');
const cssSlam = require('css-slam').gulp;

// function dumpFile() {
//   var stream = through.obj(function(file, enc, cb) {
//     console.log(file);
//     console.log(String(file.contents));
//     this.push(file);
//     cb();
//   });
//   return stream;
// }

class ApiConsoleBuilder {

  constructor(opts) {
    if (!(opts instanceof ApiConsoleBuilderOptions)) {
      opts = new ApiConsoleBuilderOptions(opts);
    }
    this.opts = opts;
    this.sourceControl = new ApiConsoleSourceControl(opts);
    // Working dir from which the command was executed.
    this.startDir = process.cwd();
    // List of dependencies included into build, they can be removed from `bower_components`
    this.dependencyFiles = new Set();
    // Build output in the temp location.
    this.tempOutput = 'build';
  }

  // Prints arguments to the console.
  log() {
    if (this.opts.verbose) {
      console.log.apply(console, arguments);
    }
  }

  /**
   * Waits for the given ReadableStream
   */
  waitFor(stream) {
    return new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }

  build() {
    this.log('Starting the build.');
    this._setOptymisationConditions();
    return fs.remove(this.opts.dest)
    .then(() => this.sourceControl.createConsoleDir())
    .then(() => this.prepareRaml())
    .then(() => this.updateTemplateVars())
    .then(() => this.sourceControl.processMainFile())
    .then(() => this.switchDirectory(this.sourceControl.tmpDir))
    .then(() => this.initializeBuilder())
    .then(() => this.buildPolymer())
    .then(() => this.removeCompiledFiles())
    .then(() => this.switchDirectory(this.startDir))
    .then(() => this.copyOutput())
    .then(() => this.sourceControl.cleanup())
    .catch((cause) => {
      return this.sourceControl.cleanup()
      .then(() => {
        throw new Error(cause.message);
      });
    });
  }
  /**
   * Sets up conditions for guil-if for optimisation process.
   */
  _setOptymisationConditions() {
    const htmlRe = /\.html$/;
    const jsRe = /\.js$/;
    const cssRe = /\.css$/;
    const optEnabled = !this.opts.noOptimisation;
    const stripCommentsCondition = optEnabled && !this.opts.noHtmlOptimisation && htmlRe;
    const htmlMinifierCondition =  optEnabled && !this.opts.noHtmlOptimisation && htmlRe;
    const jsCompileCondition = optEnabled && !this.opts.noJsOptimisation && jsRe;
    const cssSlamCssConfition = optEnabled && !this.opts.noCssOptimisation && cssRe;
    const cssSlamHtmlConfition = optEnabled && !this.opts.noCssOptimisation && htmlRe;

    this._optConditions = {
      htmlRe: htmlRe,
      jsRe: jsRe,
      commenets: stripCommentsCondition,
      html: htmlMinifierCondition,
      js: jsCompileCondition,
      css: cssSlamCssConfition,
      styles: cssSlamHtmlConfition
    };
  }

  /**
   * Parses and enhances RAML if needed.
   */
  prepareRaml() {
    var ramlSrc = this.opts.raml;
    if (!ramlSrc) {
      this.log('No RAML source. Skipping parser.');
      return Promise.resolve();
    }
    this.log('Getting the RAML data...');
    var output;
    this.apiJsonFile = path.join(this.sourceControl.tmpDir, 'api.json');
    if (this.opts.useJson && !this.opts.inlineJson) {
      output = this.apiJsonFile;
    }
    const enhancer = new RamlJsonGenerator(this.opts.raml, {
      output: output
    });
    return enhancer.generate()
    .then((json) => {
      this.log('RAML data ready');
      this.raml = json;
    });
  }
  /**
   * If template is set then processes template variables from the RAML.
   */
  updateTemplateVars() {
    if (!this.raml) {
      return Promise.resolve();
    }
    return this.sourceControl.updateTemplateVars(this.raml);
  }

  initializeBuilder() {
    this.log('Initializing builder...');
    const main = path.join(process.cwd(), this.opts.mainFile);
    this.log('Building api console from ', main);
    var options = {
      entrypoint: main,
      shell: main,
      fragments: [],
      extraDependencies: [
        // This are API console known dependencies that has to be added to the
        // build's bower_components.
        'bower_components/webcomponentsjs/webcomponents-lite.min.js',
        'bower_components/codemirror/mode/javascript/**.js',
        'bower_components/oauth-authorization/oauth-popup.html',
        'bower_components/response-body-view/html-preview.html',
        'bower_components/response-body-view/html-preview.js',
        'bower_components/prism-highlight/workers/**.js',
        'bower_components/prism/*',
        'bower_components/prism/**'
      ]
    };
    this.polymerProject = new polymerBuild.PolymerProject(options);
  }

  buildPolymer() {
    this.log('Building app with Polymer build...');

    let sourcesStreamSplitter = new polymerBuild.HtmlSplitter();
    let dependenciesStreamSplitter = new polymerBuild.HtmlSplitter();

    this.log('Analyzing sources...');
    const errorThrow = (err) => {
      throw new Error(err.message);
    };
    const errorFn = (stream, err) => {
      if (err.message && err.message.indexOf('Parse Error') === 0) {
        errorThrow(err);
      }
      console.log(colors.bgYellow('Warning:'), colors.red(err.message));
      stream.resume();
    };

    // Without code optimisation: 4.4 MB
    // With strip comments: 4.0 MB
    // With htmlMinifier (and previous): 4.0 MB
    // With closure compiler, WHITESPACE_ONLY (and previous): 3.2 MB
    // With closure compiler, SIMPLE (and previous):  3.1 MB
    // With css-slam (and SIMPLE): 3.0 MB

    const htmlMinifierOptions = {
      collapseWhitespace: true
    };

    const closureCompilerOptions = {
      compilationLevel: this.opts.jsCompilationLevel
    };

    let sourcesStream = this.polymerProject.sources();
    sourcesStream = sourcesStream.pipe(sourcesStreamSplitter.split())
    .on('error', errorThrow)
    .pipe(gulpif(this._optConditions.jsRe, this.fixJsMinification()))
    .pipe(gulpif(this._optConditions.js, compiler(closureCompilerOptions)))
    .on('error', errorFn.bind(this, sourcesStream))
    .pipe(gulpif(this._optConditions.htmlRe, this.setElementPaths()))
    .on('error', errorFn.bind(this, sourcesStream))
    .pipe(gulpif(this._optConditions.commenets, stripComments.html()))
    .on('error', errorFn.bind(this, sourcesStream))
    .pipe(gulpif(this._optConditions.html, htmlMinifier(htmlMinifierOptions)))
    .on('error', errorFn.bind(this, sourcesStream))
    .pipe(sourcesStreamSplitter.rejoin());

    let dependenciesStream = this.polymerProject.dependencies();
    dependenciesStream = dependenciesStream.pipe(gulpif(/\.html$/, this.addDependecyFile()))
    .pipe(dependenciesStreamSplitter.split())
    .on('error', errorFn.bind(this, dependenciesStream))
    .pipe(gulpif(this._optConditions.jsRe, this.fixJsMinification()))
    .on('error', errorFn.bind(this, dependenciesStream))
    .pipe(gulpif(this._optConditions.js, compiler(closureCompilerOptions)))
    .on('error', errorFn.bind(this, dependenciesStream))
    .pipe(gulpif(this._optConditions.htmlRe, this.setElementPaths()))
    .on('error', errorFn.bind(this, dependenciesStream))
    .pipe(gulpif(this._optConditions.commenets, stripComments.html()))
    .on('error', errorFn.bind(this, dependenciesStream))
    .pipe(gulpif(this._optConditions.html, htmlMinifier(htmlMinifierOptions)))
    .on('error', errorFn.bind(this, dependenciesStream))
    .pipe(gulpif(this._optConditions.css, cssSlam()))
    .pipe(gulpif(this._optConditions.styles, cssSlam()))
    .on('error', errorFn.bind(this, dependenciesStream))
    .pipe(dependenciesStreamSplitter.rejoin());

    let buildStream = mergeStream(sourcesStream, dependenciesStream)
    .on('error', errorThrow)
    .once('data', () => {
      this.log('Analyzing build dependencies...');
    });

    buildStream = buildStream.pipe(this.polymerProject.bundler());
    buildStream = buildStream.pipe(gulp.dest(this.tempOutput));

    return this.waitFor(buildStream)
    .then(() => {
      this.log('Polymer build complete.');
    });
  }

  addDependecyFile() {
    var context = this;
    var stream = through.obj(function(file, enc, cb) {
      if (file.isBuffer()) {
        var fpath = file.history[0].replace(context.sourceControl.tmpDir, './');
        fpath = path.join(context.tempOutput, fpath);

        var cwd = path.join(fpath, '../');
        context.dependencyFiles.add({
          file: fpath,
          cwd: cwd
        });
      }
      this.push(file);
      cb();
    });
    return stream;
  }
  /**
   * Removes files that has been concatenated in main build file
   * and removes empty directories from bower_components.
   */
  removeCompiledFiles() {
    this.log('Removing files included in build.');
    var p = [];
    for (let file of this.dependencyFiles) {
      p.push(this.processIncludedFile(file));
    }
    return Promise.all(p);
  }

  processIncludedFile(file) {
    return fs.remove(file.file)
    .then(() => this.removeDirIfEmpty(file.cwd));
  }

  removeDirIfEmpty(dir) {
    return new Promise((resolve) => {
      fs.readdir(dir, (err, files) => {
        if (err) {
          resolve();
          return;
        }
        if (files && files.length) {
          resolve();
          return;
        }
        fs.rmdir(dir, () => {
          // this.log('Removed empty dir.', dir);
          resolve();
        });
      });
    });
  }

  /**
   * Vulcanizer replaces all `-->` into `\x3e0` which cause JS error.
   * Need to find `-->` and replace it with `-- >`.
   *
   * This should be done for JS files only.
   *
   * https://github.com/Polymer/polymer-bundler/issues/304
   */
  fixJsMinification() {
    var stream = through.obj(function(file, enc, cb) {
      if (file.isBuffer()) {
        file.contents = new Buffer(String(file.contents).replace(/-->/gm, '-- >'));
      }
      this.push(file);
      cb();
    });
    return stream;
  }
  /**
   * For some elements that uses the `import-location` property
   * need to set up it manually in the source code because script will not recognize paths
   * in the right way.
   */
  setElementPaths() {
    this.log('Setting up import locations for the components.');
    var stream = through.obj(function(file, enc, cb) {
      if (file.isBuffer()) {
        let html = String(file.contents);
        // Code mirror
        html = html.replace(/<code-mirror/gm,
          '<code-mirror import-location="/bower_components/codemirror/"');
        file.contents = new Buffer(html);
      }
      this.push(file);
      cb();
    });
    return stream;
  }

  switchDirectory(path) {
    this.log('Changing working dir to %s', path);
    try {
      process.chdir(path);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(new Error('chdir error' + err));
    }
  }
  /**
   * Copy generated files from the temp's build folder to
   * the right place defined in `ApiConsoleBuilderOptions.dest`
   */
  copyOutput() {
    this.log('Copying generated files to the build folder');
    var source = path.join(this.sourceControl.tmpDir, this.tempOutput);
    var dest = this.opts.dest;
    return fs.copy(source, dest)
    .then(() => {
      if (this.opts.useJson && !this.opts.inlineJson) {
        this.log('Copying api.json file.');
        source = path.join(this.sourceControl.tmpDir, 'api.json');
        dest = path.join(this.opts.dest, 'api.json');
        return fs.copy(source, dest)
        .then(() => this.log('api.json file copied'));
      }
    })
    .then(() => {
      if (this.opts.embedded) {
        this.log('Copying example file.');
        source = path.join(this.sourceControl.tmpDir, 'example.html');
        dest = path.join(this.opts.dest, 'example.html');
        return fs.copy(source, dest)
        .then(() => this.log('example.html file copied'));
      }
    })
    .then(() => this.log('All files copied'));
  }
}

exports.ApiConsoleBuilder = ApiConsoleBuilder;
