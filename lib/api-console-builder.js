'use strict';

const del = require('del');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const mergeStream = require('merge-stream');
const polymerBuild = require('polymer-build');
const stripComments = require('gulp-strip-comments');
const htmlMinifier = require('gulp-html-minifier');
const through = require('through2');
const path = require('path');
const fs = require('fs');
const {ApiConsoleSourceControl} = require('./api-console-builder');
const {ApiConsoleBuilderOptions} = require('./api-console-builder-options');

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
    // Working dire from which the command was executed.
    this.startDir = process.cwd();
    //
    // this.workingDir = path.join(currentDir, opts.src);
    this.dependencyFiles = new Set();

    this._setTemplateFile();
  }
  /**
   * Part of the initialization process.
   * Will set the template filename to use depending on the options.
   */
  _setTemplateFile() {
    // Do not use templates.
    if (!this.opts.mainFile) {
      return;
    }
    var filename = this.opts.embedded ? 'embeded-' : 'standalone-';
    if (this.opts.useJson) {
      filename += 'json';
      if (this.opts.inlineJson) {
        filename += '-inline';
      }
    } else {
      filename += 'raml';
    }
    filename += '.tpl';

    this.template = filename;
  }

  // Prints arguments to the console.
  log() {
    if (this.verbose) {
      console.log.apply(console, arguments);
    }
  }

  _initializeBuilder() {
    // TODO: copy template, update variables if needed and then build the console.
    var options = {
      entrypoint: path.join(this.opts.src, this.opts.mainFile),
      shell: path.join(this.opts.src, this.opts.mainFile),
      fragments: [],
      extraDependencies: [
        // This are API console known dependencies that has to be added to the
        // build's bower_components.
        path.join(this.opts.src, 'bower_components/webcomponentsjs/webcomponents-lite.min.js'),
        path.join(this.opts.src, 'bower_components/codemirror/mode/javascript/**.js '),
        path.join(this.opts.src, 'bower_components/oauth-authorization/oauth-popup.html'),
        path.join(this.opts.src, 'bower_components/response-body-view/html-preview.html'),
        path.join(this.opts.src, 'bower_components/response-body-view/html-preview.js'),
        path.join(this.opts.src, 'bower_components/prism-highlight/workers/**.js'),
        path.join(this.opts.src, 'bower_components/prism/*'),
        path.join(this.opts.src, 'bower_components/prism/**')
      ]
    };
    this.polymerProject = new polymerBuild.PolymerProject(options);
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

    return this.sourceControl.createConsoleDir()
    .then(() => this._initializeBuilder())
    .then(() => this.switchDirectory(this.sourceControl.tmpDir))
    .then(() => this.buildPolymer())
    return new Promise((resolve) => {

      let sourcesStreamSplitter = new polymerBuild.HtmlSplitter();
      let dependenciesStreamSplitter = new polymerBuild.HtmlSplitter();
      this.log('Deleting %s directory...', this.opts.dest);
      del([this.opts.dest])
      .then(() => {
        this.log('Analyzing sources...');

        const errorFn = (err) => {
          this.log('Warning:', err.message);
        };

        let sourcesStream = this.polymerProject.sources()
        .pipe(sourcesStreamSplitter.split())
        .on('error', errorFn)
        .pipe(gulpif(/\.js$/, this.fixJsMinification()))
        .on('error', errorFn)
        .pipe(gulpif(/\.html$/, this.setElementPaths()))
        .on('error', errorFn)
        .pipe(gulpif(/\.js$/, stripComments()))
        .on('error', errorFn)
        .pipe(gulpif(/\.html$/, stripComments.html()))
        .on('error', errorFn)
        .pipe(gulpif(/\.html$/, htmlMinifier()))
        .on('error', errorFn)
        .pipe(sourcesStreamSplitter.rejoin());

        let dependenciesStream = this.polymerProject.dependencies()
        .pipe(gulpif(/\.html$/, this.addDependecyFile()))
        .on('error', errorFn)
        .pipe(dependenciesStreamSplitter.split())
        .pipe(gulpif(/\.js$/, this.fixJsMinification()))
        .on('error', errorFn)
        .pipe(gulpif(/\.html$/, this.setElementPaths()))
        .on('error', errorFn)
        .pipe(gulpif(/\.js$/, stripComments()))
        .on('error', errorFn)
        .pipe(gulpif(/\.html$/, stripComments.html()))
        .on('error', errorFn)
        .pipe(gulpif(/\.html$/, htmlMinifier()))
        .on('error', errorFn)
        .pipe(dependenciesStreamSplitter.rejoin());
        let buildStream = mergeStream(sourcesStream, dependenciesStream)
        .on('error', function(err) {
          this.log('Some error', err);
        })
        .once('data', () => {
          this.log('Analyzing build dependencies...');
        });

        buildStream = buildStream.pipe(this.polymerProject.bundler());
        buildStream = buildStream.pipe(gulp.dest(this.opts.dest));

        return this.waitFor(buildStream);
      })
      .then(() => {
        this.log('Sources build complete.');
        var p = [];
        this.log('Processing dependencies.');
        for (let file of this.dependencyFiles) {
          p.push(this.processIncludedFile(file));
        }
        return Promise.all(p);
      })
      .then(() => {
        console.log('Build complete!');
        resolve();
      });
    });
  }

  buildPolymer() {

  }

  addDependecyFile() {
    var context = this;
    var stream = through.obj(function(file, enc, cb) {
      if (file.isBuffer()) {
        var fpath = file.history[0].replace(context.workingDir, './');
        fpath = path.join(context.opts.dest, fpath);

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

  processIncludedFile(file) {
    return del([file.file])
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
          this.log('Removed empty dir.', dir);
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
        // import path for the enhancer
        html = html.replace(/import-location="\/components\/raml-json-enhance\/"/gm,
        'import-location="/bower_components/raml-json-enhance/"');
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
}

exports.ApiConsoleBuilder = ApiConsoleBuilder;
