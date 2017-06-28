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
const {BuilderOptions} = require('./builder-options');
const {RamlJsonGenerator} = require('raml-json-enhance-node');
const colors = require('colors/safe');
const compiler = require('./CompilerTransformer');
const cssSlam = require('css-slam').gulp;

class ApiConsoleBuilder {
  /**
   * Constructs a builder.
   *
   * @param {BuilderOptions} opts Options passed to the module
   * @param {SourceControl} sourceControl The SourceControl Object
   * @param {Winston} logger Logger to use to log debug output
   */
  constructor(opts, sourceControl, logger) {
    if (!(opts instanceof BuilderOptions)) {
      opts = new BuilderOptions(opts);
    }
    /**
     * @type {BuilderOptions}
     */
    this.opts = opts;
    this.sourceControl = sourceControl;
    this.logger = logger;
    // Points to current task performed.
    this.state = 0;
    // Working dir from which the command was executed.
    this.startDir = process.cwd();
    // Build output in the temporary location.
    this.tempOutput = 'build';
    this.bowerDependencies = [
      'bower_components/codemirror/mode/javascript/**.js',
      'bower_components/oauth-authorization/oauth-popup.html',
      'bower_components/prism-highlight/workers/**.js',
      'bower_components/prism/*',
      'bower_components/prism/**'
    ];
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
  /**
   * Travis will kill the process when it takes more than 10 minutes without any output.
   * Because Closure Compiler may take more timeto finish and during this time there's no output,
   * this function will be called periodically to print a dummy output to the console.
   */
  outputTimeout() {
    var place;
    switch (this.state) {
      case 1: place = 'Beginning'; break;
      case 2: place = 'Preparing RAML'; break;
      case 3: place = 'Updating template vars'; break;
      case 4: place = 'Building polymer'; break;
      case 5: place = 'Compiling JS dependencies'; break;
      case 6: place = 'Setting dependencies paths'; break;
      case 7: place = 'Stripping comments from dependencies'; break;
      case 8: place = 'Minifing html in dependencies'; break;
      case 9: place = 'Cleaning CSS from dependencies'; break;
      case 10: place = 'Saving build'; break;
      case 11: place = 'Removing redundant files.'; break;
      case 12: place = 'Finished'; break;
    }
    this.logger.info('Still working.', place);
  }

  build() {
    const outputInterval = setInterval(this.outputTimeout.bind(this), 180000);
    this.logger.info('Starting the build.');
    this.state = 1;
    this._setOptymisationConditions();
    return fs.remove(this.opts.dest)
    .then(() => this.sourceControl.createConsoleDir())
    .then(() => this.prepareRaml())
    .then(() => this.updateTemplateVars())
    .then(() => this.sourceControl.processMainFile())
    .then(() => this.switchDirectory(this.sourceControl.tmpDir))
    .then(() => this.initializeBuilder())
    .then(() => this.buildPolymer())
    .then(() => this.copyDependencies())
    .then(() => this.switchDirectory(this.startDir))
    .then(() => this.copyOutput())
    .then(() => this.sourceControl.cleanup())
    .then(() => {
      clearInterval(outputInterval);
    })
    .catch((cause) => {
      clearInterval(outputInterval);
      return this.sourceControl.cleanup()
      .then(() => {
        if (this.opts.verbose) {
          this.logger.error(colors.red('ERROR:'));
          this.logger.error(colors.red(cause.message));
          this.logger.error(colors.red(cause.stack));
        }
        throw new Error(cause.message);
      });
    });
  }

  /**
   * Sets up conditions for guil-if for optimization process.
   */
  _setOptymisationConditions() {
    const htmlRe = /\.html$/;
    const jsRe = /\.js$/;
    const cssRe = /\.css$/;
    const optEnabled = !this.opts.noOptimization;
    const stripCommentsCondition = optEnabled && !this.opts.noHtmlOptimization && htmlRe;
    const htmlMinifierCondition =  optEnabled && !this.opts.noHtmlOptimization && htmlRe;
    const jsCompileCondition = optEnabled && !this.opts.noJsOptimization && jsRe;
    const cssSlamCssConfition = optEnabled && !this.opts.noCssOptimization && cssRe;
    const cssSlamHtmlConfition = optEnabled && !this.opts.noCssOptimization && htmlRe;

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
      this.logger.info('No RAML source. Skipping parser.');
      return Promise.resolve();
    }
    this.state = 2;
    this.logger.info('Getting the RAML data...');
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
      this.logger.info('RAML data ready');
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
    this.state = 3;
    return this.sourceControl.updateTemplateVars(this.raml);
  }

  initializeBuilder() {
    this.logger.info('Initializing builder...');
    const main = path.join(process.cwd(), this.opts.mainFile);
    this.logger.info('Building api console from ', main);
    var options = {
      entrypoint: main,
      shell: main,
      fragments: []
    };
    this.polymerProject = new polymerBuild.PolymerProject(options);
  }

  buildPolymer() {
    this.logger.info('Building app with Polymer build...');
    this.state = 4;

    let sourcesStreamSplitter = new polymerBuild.HtmlSplitter();
    let dependenciesStreamSplitter = new polymerBuild.HtmlSplitter();

    this.logger.info('Analyzing sources...');
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

    // Without code optimization: 4.4 MB
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
    .on('error', errorThrow)
    .pipe(gulpif(this._optConditions.js, compiler(closureCompilerOptions)))
    .on('error', errorFn.bind(this, sourcesStream))
    .pipe(gulpif(this._optConditions.htmlRe, this.setElementPaths()))
    .on('error', errorThrow)
    .pipe(gulpif(this._optConditions.commenets, stripComments.html()))
    .on('error', errorFn.bind(this, sourcesStream))
    .pipe(gulpif(this._optConditions.html, htmlMinifier(htmlMinifierOptions)))
    .on('error', errorFn.bind(this, sourcesStream))
    .pipe(sourcesStreamSplitter.rejoin());

    let dependenciesStream = this.polymerProject.dependencies();
    dependenciesStream = dependenciesStream
    .pipe(dependenciesStreamSplitter.split())
    // .pipe(dumpFile())
    .on('error', errorFn.bind(this, dependenciesStream))
    .pipe(gulpif(this._optConditions.jsRe, this.fixJsMinification()))
    .on('error', errorThrow)
    .on('end', () => {
      this.state = 5;
    })
    .pipe(gulpif(this._optConditions.js, compiler(closureCompilerOptions)))
    .on('error', errorFn.bind(this, dependenciesStream))
    .on('end', () => {
      this.state = 6;
    })
    .pipe(gulpif(this._optConditions.htmlRe, this.setElementPaths()))
    .on('error', errorThrow)
    .on('end', () => {
      this.state = 7;
    })
    .pipe(gulpif(this._optConditions.commenets, stripComments.html()))
    .on('error', errorFn.bind(this, dependenciesStream))
    .on('end', () => {
      this.state = 8;
    })
    .pipe(gulpif(this._optConditions.html, htmlMinifier(htmlMinifierOptions)))
    .on('error', errorFn.bind(this, dependenciesStream))
    .on('end', () => {
      this.state = 9;
    })
    .pipe(gulpif(this._optConditions.css, cssSlam()))
    .pipe(gulpif(this._optConditions.styles, cssSlam()))
    .on('error', errorFn.bind(this, dependenciesStream))
    .on('end', () => {
      this.state = 10;
    })
    .pipe(dependenciesStreamSplitter.rejoin())
    .on('error', errorThrow);

    let buildStream = mergeStream(sourcesStream, dependenciesStream)
    .on('error', errorThrow)
    .once('data', () => {
      this.logger.info('Analyzing build dependencies...');
    });

    buildStream = buildStream.pipe(this.polymerProject.bundler());
    buildStream = buildStream.pipe(gulp.dest(this.tempOutput));

    this.logger.info('Storing build in the ' + this.tempOutput + ' folder');

    return this.waitFor(buildStream)
    .then(() => {
      this.logger.info('Polymer build complete.');
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
    this.logger.info('Setting up import locations for the components.');
    var stream = through.obj(function(file, enc, cb) {
      if (file.isBuffer()) {
        let html = String(file.contents);
        // Code mirror
        html = html.replace(/<code-mirror/gm,
          '<code-mirror import-location="/bower_components/codemirror/"');
        html = html.replace(/<(response-body-view|prism-highlight)\s/gm,
          '<$1 import-location="/bower_components/$1/"');
        file.contents = new Buffer(html);
      }
      this.push(file);
      cb();
    });
    return stream;
  }
  /**
   * Removes bower_components folder from build output.
   */
  clearBuildFiles() {
    var folder = path.join(this.sourceControl.tmpDir, this.tempOutput, 'bower_components');
    var files = [
      path.join(this.sourceControl.tmpDir, this.tempOutput, 'api-console.html'),
      path.join(this.sourceControl.tmpDir, this.tempOutput, 'api-console-request.html'),
      path.join(this.sourceControl.tmpDir, this.tempOutput, 'api-console-styles.html')
    ];
    return fs.remove(folder)
    .then(() => {
      return Promise.all(files.map((file) => fs.remove(file)));
    });
  }

  /**
   * Copy files defined in the `bowerDependencies` list into `bower_components` folder.
   */
  copyDependencies() {
    var tmpDir = this.sourceControl.tmpDir;
    var prismBase = path.join(tmpDir, 'bower_components/prism/');

    // if building the embedded console the webcomponents-lite.min.js file will be needed
    this.bowerDependencies.push('bower_components/webcomponentsjs/webcomponents-lite.min.js');
    return this.clearBuildFiles()
    .then(() => {
      const copyStream = gulp.src(this.bowerDependencies)
      .pipe(gulp.dest((file) => {
        let output;
        if (file.base === prismBase) {
          output = 'build/bower_components/prism/';
        } else {
          let fpath = file.path.replace(tmpDir, '');
          output = path.dirname(path.join(this.tempOutput, fpath));
        }
        return output;
      }));
      return copyStream;
    })
    .then((copyStream) => this.waitFor(copyStream))
    .then(() => {
      this.logger.info('Dependency files copied.');
    });
  }

  switchDirectory(path) {
    this.logger.info('Changing working dir to %s', path);
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
    this.state = 14;
    this.logger.info('Copying generated files to the build folder');
    var source = path.join(this.sourceControl.tmpDir, this.tempOutput);
    var dest = this.opts.dest;
    return fs.copy(source, dest)
    .then(() => {
      if (this.opts.useJson && !this.opts.inlineJson) {
        this.logger.info('Copying api.json file.');
        source = path.join(this.sourceControl.tmpDir, 'api.json');
        dest = path.join(this.opts.dest, 'api.json');
        return fs.copy(source, dest)
        .then(() => this.logger.info('api.json file copied'));
      }
    })
    .then(() => {
      if (this.opts.embedded) {
        this.logger.info('Copying example file.');
        source = path.join(this.sourceControl.tmpDir, 'example.html');
        dest = path.join(this.opts.dest, 'example.html');
        return fs.copy(source, dest)
        .then(() => this.logger.info('example.html file copied'));
      }
    })
    .then(() => this.logger.info('All files copied'));
  }
}
exports.ApiConsoleBuilder = ApiConsoleBuilder;
