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

// function dumpFile() {
//   var stream = through.obj(function(file, enc, cb) {
//     console.log(file);
//     console.log(String(file.contents));
//     this.push(file);
//     cb();
//   });
//   return stream;
// }

class ACBuilder {

  constructor(opts) {
    opts = this._setDefaultOptions(opts);
    /**
     * Source directory of the application
     * Defaults to current directory
     */
    this.appSource = opts.src;
    /**
     * Source index file, an entry point to the application.
     * Defaults to `index.html`
     */
    this.mainFile = opts.mainFile;
    /**
     * Output directory.
     *
     * Defaults to `build`
     */
    this.buildDir = opts.dest;

    this._initializeBuilder();

    var currentDir = process.cwd();

    this.workingDir = path.join(currentDir, opts.src);

    this.dependencyFiles = new Set();
  }

  _setDefaultOptions(opts) {
    opts = opts || {};
    if (!('src' in opts)) {
      opts.src = './';
    }
    if (!('dest' in opts)) {
      opts.dest = 'build';
    }
    if (!('mainFile' in opts)) {
      opts.mainFile = 'index.html';
    }
    return opts;
  }

  _initializeBuilder() {
    var options = {
      entrypoint: path.join(this.appSource, this.mainFile),
      shell: path.join(this.appSource, this.mainFile),
      fragments: [],
      extraDependencies: [
        // This are API console known dependencies that has to be added to the
        // build's bower_components.
        path.join(this.appSource, 'bower_components/webcomponentsjs/webcomponents-lite.min.js'),
        path.join(this.appSource, 'bower_components/codemirror/mode/javascript/**.js '),
        path.join(this.appSource, 'bower_components/oauth-authorization/oauth-popup.html'),
        path.join(this.appSource, 'bower_components/response-body-view/html-preview.html'),
        path.join(this.appSource, 'bower_components/response-body-view/html-preview.js'),
        path.join(this.appSource, 'bower_components/prism-highlight/workers/**.js'),
        path.join(this.appSource, 'bower_components/prism/*'),
        path.join(this.appSource, 'bower_components/prism/**')
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
    return new Promise((resolve) => {

      let sourcesStreamSplitter = new polymerBuild.HtmlSplitter();
      let dependenciesStreamSplitter = new polymerBuild.HtmlSplitter();
      console.log(`Deleting ${this.buildDir} directory...`);
      del([this.buildDir])
      .then(() => {
        console.log(`Analyzing...`);

        const errorFn = (err) => {
          console.log('Warning:', err.message);
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
        .on('error', function(err) {
          console.log('Some error', err);
        })
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
          console.log('Some error', err);
        })
        .once('data', () => {
          console.log('Analyzing build dependencies...');
        });

        buildStream = buildStream.pipe(this.polymerProject.bundler());
        buildStream = buildStream.pipe(gulp.dest(this.buildDir));

        return this.waitFor(buildStream);
      })
      .then(() => {
        var p = [];
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

  addDependecyFile() {
    var context = this;
    var stream = through.obj(function(file, enc, cb) {
      if (file.isBuffer()) {
        var fpath = file.history[0].replace(context.workingDir, './');
        fpath = path.join(context.buildDir, fpath);

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
      fs.readdir(dir, function(err, files) {
        if (err) {
          resolve();
          return;
        }
        if (files && files.length) {
          resolve();
          return;
        }
        fs.rmdir(dir, function() {
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
}

exports.ACBuilder = ACBuilder;
