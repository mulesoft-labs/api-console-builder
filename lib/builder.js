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
const compiler = require('./CompilerTransformer');
const cssSlam = require('css-slam').gulp;

class ApiConsoleBuilder {
  /**
   * Constructs a builder.
   *
   * @param {BuilderOptions} opts Options passed to the module
   * @param {Winston} logger Logger to use to log debug output
   * @param {String} workingDir Path to a working directory instance.
   * @param {String} workingOutput A directory where the console build will be
   * placed in the working dir. This location contains all generated files.
   */
  constructor(opts, logger, workingDir, workingOutput) {
    if (!(opts instanceof BuilderOptions)) {
      opts = new BuilderOptions(opts);
    }
    /**
     * @type {BuilderOptions}
     */
    this.opts = opts;
    this.logger = logger;
    /**
     * A directory where all operations will be performed
     *
     * @type {String}
     */
    this.workingDir = workingDir;
    // Build output in the temporary location.
    this.workingBuildOutput = workingOutput;
  }

  /**
   * List of files that have to be copied to the `bower_components` folder
   * in the build location.
   *
   * @return {Array<String>} List of files to copy.
   */
  get bowerDependencies() {
    return [
      'bower_components/codemirror/mode/javascript/**.js',
      'bower_components/oauth-authorization/oauth-popup.html',
      'bower_components/prism-highlight/workers/**.js',
      'bower_components/prism/*',
      'bower_components/prism/**'
    ];
  }
  /**
   * Builds the API Console with Polymer builder
   * and copies dependencies to the build folder.
   *
   * @return {Promise} A promise resolved when build complete.
   */
  build() {
    this.logger.info('Starting the build.');

    this.setOptymisationConditions();
    this.initializeBuilder();

    return this.buildPolymer()
    .then(() => this.clearBuildFiles())
    .then(() => this.copyDependencies());
  }

  /**
   * Sets conditions for `guil-if` for optimization process.
   */
  setOptymisationConditions() {
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
   * Initializes the PolymerProject from polymerBuild package.
   */
  initializeBuilder() {
    this.logger.info('Initializing Polymer builder...');
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

    return new Promise((resolve, reject) => {
      let sourcesStreamSplitter = new polymerBuild.HtmlSplitter();
      let dependenciesStreamSplitter = new polymerBuild.HtmlSplitter();

      this.logger.info('Analyzing sources...');

      const errorThrow = (err) => {
        reject(new Error(err.message));
      };
      const errorFn = (stream, err) => {
        reject(new Error(err.message));
        // if (err.message && err.message.indexOf('Parse Error') === 0) {
        //   return errorThrow(err);
        // }
        // this.logger.warn(err.message);
        // stream.resume();
      };

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
      .on('error', errorFn.bind(this, dependenciesStream))
      .pipe(dependenciesStreamSplitter.split())
      .on('end', () => {
        this.logger.info('Fixing minification issues...');
      })
      .on('error', errorFn.bind(this, dependenciesStream))
      .pipe(gulpif(this._optConditions.jsRe, this.fixJsMinification()))
      .on('error', errorThrow)
      .on('end', () => {
        this.logger.info('Done.');
        this.logger.info('Compiling JavaScript...');
      })
      .pipe(gulpif(this._optConditions.js, compiler(closureCompilerOptions)))
      .on('error', errorFn.bind(this, dependenciesStream))
      .on('end', () => {
        this.logger.info('Done.');
        this.logger.info('Updating bower paths on the elements.');
      })
      .pipe(gulpif(this._optConditions.htmlRe, this.setElementPaths()))
      .on('error', errorThrow)
      .on('end', () => {
        this.logger.info('Done.');
        this.logger.info('Stripping comments...');
      })
      .pipe(gulpif(this._optConditions.commenets, stripComments.html()))
      .on('error', errorFn.bind(this, dependenciesStream))
      .on('end', () => {
        this.logger.info('Done.');
        this.logger.info('Minifing HTML...');
      })
      .pipe(gulpif(this._optConditions.html, htmlMinifier(htmlMinifierOptions)))
      .on('error', errorFn.bind(this, dependenciesStream))
      .on('end', () => {
        this.logger.info('Done.');
        this.logger.info('Minifing CSS...');
      })
      .pipe(gulpif(this._optConditions.css, cssSlam()))
      .pipe(gulpif(this._optConditions.styles, cssSlam()))
      .on('error', errorFn.bind(this, dependenciesStream))
      .on('end', () => {
        this.logger.info('Done.');
      })
      .pipe(dependenciesStreamSplitter.rejoin())
      .on('error', errorThrow);

      let buildStream = mergeStream(sourcesStream, dependenciesStream);

      // The bundler merges everything together.
      buildStream = buildStream.pipe(this.polymerProject.bundler());
      // This saves the build in the build location
      // It can use 'polymer-build'.forkStream and write differen version
      // of the same build.
      buildStream = buildStream.pipe(gulp.dest(this.workingBuildOutput));

      buildStream.on('end', () => {
        this.logger.info('Polymer build complete.');
        resolve();
      });
      buildStream.on('error', reject);
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
    var bowerLocationAttribute = this.opts.findAttribute('bower-location');
    var bowerLocation;
    if (bowerLocationAttribute) {
      bowerLocation = bowerLocationAttribute.value;
    } else {
      bowerLocation = '/bower_components/';
    }
    if (bowerLocation[bowerLocation.length - 1] !== '/') {
      bowerLocation += '/';
    }

    const cmLocation = bowerLocation + 'codemirror/';
    const regexpLocation = bowerLocation + '$1/';
    var stream = through.obj(function(file, enc, cb) {
      if (file.isBuffer()) {
        let html = String(file.contents);
        // Code mirror
        html = html.replace(/<code-mirror/gm,
          `<code-mirror import-location="${cmLocation}"`);
        html = html.replace(/<(response-body-view|prism-highlight)\s/gm,
          `<$1 import-location="${regexpLocation}"`);
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
    var folder = path.join(this.workingDir, this.workingBuildOutput, 'bower_components');
    var files = [
      path.join(this.workingDir, this.workingBuildOutput, 'api-console.html'),
      path.join(this.workingDir, this.workingBuildOutput, 'api-console-request.html'),
      path.join(this.workingDir, this.workingBuildOutput, 'api-console-styles.html')
    ];
    return fs.remove(folder)
    .then(() => {
      return Promise.all(files.map((file) => fs.remove(file)));
    });
  }
  /**
   * Copy files defined in the `bowerDependencies` list to `bower_components`
   * folder.
   */
  copyDependencies() {
    this.logger.info('Copying required dependencies to bower_components...');

    const prismBase = path.join(this.workingDir, 'bower_components/prism/');
    // if building the embedded console the webcomponents-lite.min.js file will
    // be needed
    const dependencies = this.bowerDependencies;
    dependencies.push(
      'bower_components/webcomponentsjs/webcomponents-lite.min.js'
    );

    return new Promise((resolve, reject) => {
      try {
        const copyStream = gulp.src(dependencies)
        .pipe(gulp.dest((file) => {
          let output;
          if (file.base === prismBase) {
            output = 'build/bower_components/prism/';
          } else {
            let fpath = file.path.replace(this.workingDir, '');
            output = path.dirname(path.join(this.workingBuildOutput, fpath));
          }
          return output;
        }));

        copyStream.on('end', () => {
          this.logger.info('Dependency files copied.');
          resolve();
        });
        copyStream.on('error', reject);
      } catch (e) {
        reject(e);
      }
    });
  }
}
exports.ApiConsoleBuilder = ApiConsoleBuilder;
