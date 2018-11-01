'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const {PolymerProject, HtmlSplitter, forkStream, getOptimizeStreams} =
  require('polymer-build');
const path = require('path');
const mergeStream = require('merge-stream');
const {dest} = require('vinyl-fs');
const fs = require('fs-extra');
const {ApiDependencyManager} = require('./api-dependency-manager');
/**
 * A class that performs the build.
 */
class ApiConsoleBuilder {
  /**
   * Constructs a builder.
   *
   * @param {BuilderOptions} opts Options passed to the module
   * @param {Winston} logger Logger to use to log debug output
   * @param {String} workingDir Path to a working directory instance.
   * @param {String} workingOutput A directory where the console build will be
   * placed in the working dir. This location contains all generated files.
   * @param {String} appMainFile Name of the application main file in build
   * directory
   */
  constructor(opts, logger, workingDir, workingOutput, appMainFile) {
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
    this.appMainFile = appMainFile;
  }

  /**
   * List of "extraDependencies" as an entry in Polymer configuration file.
   * This lists all files that should be in bower_components directory after
   * the build.
   */
  get defaultExtraDepenedencies() {
    return [
      'bower_components/webcomponentsjs/**.js',
      'bower_components/codemirror/mode/javascript/**.js',
      'bower_components/oauth-authorization/oauth-popup.html',
      'bower_components/prism-highlight/workers/**.js',
      'bower_components/prism/plugins/autolinker/prism-autolinker.min.js',
      'bower_components/prism/prism.js',
      'bower_components/prism/themes/prism.css',
      'bower_components/prism/components/**.js',
      'bower_components/xml-viewer/workers/**.js',
      'bower_components/codemirror/mode/**/**.js'
    ];
  }
  /**
   * Configuration for default builds for Polymer.
   */
  get defaultBuilds() {
    return [
      {
        'name': 'es5-bundle',
        'preset': 'es5-bundled',
        'addServiceWorker': false,
        'addPushManifest': false,
        'insertPrefetchLinks': false,
        'excludes': [
          // 'bower_components/paper-styles/default-theme.html'
        ],
        'stripComments': true
      },
      {
        'name': 'es6-bundle',
        'preset': 'es6-bundled',
        'addServiceWorker': false,
        'addPushManifest': false,
        'insertPrefetchLinks': false,
        'excludes': [
          // 'bower_components/paper-styles/default-theme.html',
          // 'bower_components/arc-polyfills/arc-polyfills.html',
          // 'bower_components/arc-polyfills/polyfills.js',
          'bower_components/url-polyfill/url.js'
        ],
        'stripComments': true
      }
    ];
  }
  /**
   * Builds the API Console with Polymer builder
   * and copies dependencies to the build folder.
   *
   * @return {Promise} A promise resolved when build complete.
   */
  build() {
    this.startDir = process.cwd();
    this.logger.debug('Starting the build.');

    return this.manageImports()
    .then(() => this.manageTheme())
    .then(() => this.switchDirectory(this.workingDir))
    .then(() => this.runBundlers())
    .then(() => this.copyMissing())
    .then(() => this.switchDirectory(this.startDir))
    .catch((casue) => {
      return this.switchDirectory(this.startDir)
      .then(() => Promise.reject(casue));
    });
  }
  /**
   * Changes working directory with Promises.
   *
   * @param {String} path A directory path
   * @return {Promise} Promise resolved when the directory has been changed.
   */
  switchDirectory(path) {
    this.logger.debug('Changing working dir to ' + path);
    try {
      process.chdir(path);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(new Error('chdir error' + err));
    }
  }
  /**
   * Runs build systems.
   * @return {Promise}
   */
  runBundlers() {
    const polymerProject = this.initializeBuilder();
    this.logger.debug('Building app with Polymer build...');
    const size = polymerProject.config.builds.length;
    this.logger.info(`Found ${size} build configurations.`);
    const promises = polymerProject.config.builds.map((conf) =>
      this.buildBundle(polymerProject, conf));
    return Promise.all(promises);
  }
  /**
   * Initializes the PolymerProject from polymerBuild package.
   *
   * @return {PolymerProject}
   */
  initializeBuilder() {
    this.logger.debug('Initializing Polymer builder...');
    const main = path.join(this.workingDir, this.appMainFile);
    this.logger.debug('Building api console from ' + main);
    let sources;
    if (!this.opts.embedded) {
      sources = [
        // 'bower_components/shadycss/apply-shim.html',
        'bower_components/polymer/lib/elements/custom-style.html',
        'bower_components/app-route/app-location.html',
        'api-console.html'
      ];
    }
    const options = {
      entrypoint: main,
      shell: main,
      fragments: [],
      sources,
      extraDependencies: this.defaultExtraDepenedencies,
      builds: this.defaultBuilds,
      lint: {
        rules: ['polymer-2']
      }
    };
    this.logger.debug(`"${this.workingDir}": Building with options:`, options);
    return new PolymerProject(options);
  }
  /**
   * Waits for the given ReadableStream
   * @param {ReadableStream} stream
   * @return {Promise}
   */
  waitFor(stream) {
    return new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }
  /**
   * Pipes streams together
   * @param {Array<ReadableStream>} streams
   * @return {ReadableStream}
   */
  pipeStreams(streams) {
    return Array.prototype.concat.apply([], streams)
    .reduce((a, b) => a.pipe(b));
  }
  /**
   * Performs the build.
   *
   * @param {Object} polymerProject A PolymerProject instance.
   * @param {Object} bundle Polymer bundler configuration
   * @return {Promise}
   */
  buildBundle(polymerProject, bundle) {
    const buildName = bundle.name;
    const startTime = Date.now();
    const sourcesStream = forkStream(polymerProject.sources());
    const depsStream = forkStream(polymerProject.dependencies());
    let buildStream = mergeStream(sourcesStream, depsStream);
    if (buildName === 'es5-bundle') {
      buildStream = buildStream.pipe(polymerProject.addCustomElementsEs5Adapter());
    }
    const bundlerOptions = {
      rewriteUrlsInTemplates: false
    };
    Object.assign(bundlerOptions, bundle);
    buildStream = buildStream.pipe(polymerProject.bundler(bundlerOptions));
    const htmlSplitter = new HtmlSplitter();
    buildStream = this.pipeStreams([
      buildStream,
      htmlSplitter.split(),
      getOptimizeStreams({
        html: bundle.html,
        css: bundle.css,
        js: Object.assign({
          moduleResolution: polymerProject.config.moduleResolution,
        }, bundle.js),
        entrypointPath: polymerProject.config.entrypoint,
        rootDir: polymerProject.config.root,
      }),
      htmlSplitter.rejoin()
    ]);
    buildStream.once('data', () => {
      this.logger.info(`(${buildName}) Building...`);
    });
    if (bundle.basePath) {
      let basePath = bundle.basePath === true ? buildName : bundle.basePath;
      if (!basePath.startsWith('/')) {
        basePath = '/' + basePath;
      }
      if (!basePath.endsWith('/')) {
        basePath = basePath + '/';
      }
      buildStream = buildStream.pipe(polymerProject.updateBaseTag(basePath));
    }
    if (bundle.addPushManifest) {
      buildStream = buildStream.pipe(polymerProject.addPushManifest());
    }
    const bundleDestination = path.join(this.workingBuildOutput, buildName);
    buildStream = buildStream.pipe(dest(bundleDestination));
    return this.waitFor(buildStream)
    .then(() => {
      const time = (Date.now() - startTime) / 1000;
      this.logger.info(`(${buildName}) Build complete in ${time} seconds`);
    });
  }
  /**
   * Manages theme options for the console.
   * If `themeFile` option is defined then it replaces console's original theme
   * file.
   *
   * This function is called before switching directory to build the sources.
   * @return {Promise}
   */
  manageTheme() {
    if (!this.opts.themeFile) {
      return Promise.resolve();
    }
    return fs.realpath(this.opts.themeFile)
    .then((filePath) => {
      const {ThemeManager} = require('./theme-manager');
      const mgr = new ThemeManager(
        filePath,
        this.workingDir,
        'api-console.html',
        this.logger
      );
      return mgr.updateTheme();
    })
    .catch((cause) => {
      this.logger.warn('Unable to process theme file.');
      this.logger.error(cause);
    });
  }
  /**
   * Updates list of imports in the main file depending on the build type.
   * @return {Promise}
   */
  manageImports() {
    const mgr = new ApiDependencyManager(
      this.opts,
      this.workingDir,
      'api-console.html',
      this.logger
    );
    return mgr.updateImports();
  }
  /**
   * Compies missing libraries from the build.
   * Polymer build does not copy prism.js library (probably because it compiles
   * it to an empty file). It has to be done manually.
   *
   * @return {Promise}
   */
  copyMissing() {
    const buildPath = path.join(this.workingDir, 'build');
    return this.getFolders(buildPath)
    .then((buildFolders) => {
      const libs = [];
      buildFolders.forEach((item) => {
        libs.push([
          path.join(this.workingDir, 'bower_components', 'prism', 'prism.js'),
          path.join(item, 'bower_components', 'prism', 'prism.js')
        ]);
      });
      return libs.map((data) => fs.copy(data[0], data[1]));
    });
  }
  /**
   * Returns a list of folders in a given location
   * @param {String} location Location to search for folders.
   * @return {Promise} Promise resolved to a listy of directories.
   */
  getFolders(location) {
    return fs.readdir(location)
    .then((objects) => {
      const p = objects.map((object) =>
        this.pathIfDir(path.join(location, object)));
      return Promise.all(p);
    })
    .then((dirs) => dirs.filter((item) => !!item));
  }
  /**
   * @param {String} location Location to a file or directory
   * @return {Promise} Passed location if the location is directory or
   * `undefined` if the location does not exists or is not a directory.
   */
  pathIfDir(location) {
    return fs.stat(location)
    .then((stat) => stat && stat.isDirectory())
    .then((isDir) => isDir ? location : undefined)
    .catch(() => {});
  }
}
exports.ApiConsoleBuilder = ApiConsoleBuilder;
