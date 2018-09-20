'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const winston = require('winston');
const path = require('path');
const {SourceControl} = require('./source-control');
const {ApiConsoleSources} = require('api-console-sources-resolver');
const {ApiConsoleTransport} = require('api-console-github-resolver');
const {ApiConsoleGithubResolver} = require('api-console-github-resolver');
const consoleDependencies = require('api-console-dependency-manager');
const colors = require('colors/safe');
const {AmfSource} = require('./amf-source');
const {AttributesProcessor} = require('./attributes');
const fs = require('fs-extra');
const {BuilderOptions} = require('./builder-options');
const {CacheBuild} = require('./cache-build');
/**
 * A class that manages the project build process.
 * It splits for project v4 and v5 depending on configuration.
 */
class ApiConsoleProject {
  /**
   * @constructor
   * @param {?Object} opts User configuration
   */
  constructor(opts) {
    if (!(opts instanceof BuilderOptions)) {
      opts = new BuilderOptions(opts);
    }
    this.opts = opts;
    this.logger = this.__setupLogger(opts);
    this.printValidationWarnings();
    if (!this.opts.isValid) {
      this.printValidationErrors();
      throw new Error('Options did not passes validation.');
    }
    opts.logger = this.logger;
    // Working dir from which the command was executed.
    this.startDir = process.cwd();
    this.workingBuildOutput = 'build';
    this.cache = new CacheBuild(opts, this.logger);
  }
  /**
   * Creates a logger object to log debug output.
   *
   * @param {Object} opts
   * @return {Object}
   */
  __setupLogger(opts) {
    if (opts.logger) {
      return opts.logger;
    }
    const level = this.opts.verbose ? 'debug' : 'warn';
    this.debugFile = path.join(process.cwd(), 'api-console-builder-debug.log');
    const format = winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    );
    const logger = winston.createLogger({
      level,
      format,
      exitOnError: false,
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: this.debugFile, level: 'error'})
      ]
    });
    return logger;
  }

  /**
   * Prints varning messages to the logger.
   */
  printValidationWarnings() {
    const warnings = this.opts.validationWarnings;
    if (!warnings || !warnings.length) {
      return;
    }
    warnings.forEach((warning) => {
      this.logger.warn(warning);
    });
  }

  /**
   * Prints error messages to the logger.
   */
  printValidationErrors() {
    this.opts.validationErrors.forEach((error) => {
      this.logger.error(error);
    });
  }
  /**
   * A class that manages API Console sources
   *
   * @return {SourceControl}
   */
  get sourceControl() {
    if (!this.__sourceControl) {
      this.__sourceControl = new SourceControl(this.opts, this.logger);
    }
    return this.__sourceControl;
  }
  /**
   * Returns a reference to an ApiConsoleSources.
   *
   * @return {ApiConsoleSources}
   */
  get consoleSources() {
    if (!this.__consoleSources) {
      const resolver = new ApiConsoleGithubResolver({
        token: process.env.GITHUB_TOKEN
      });
      const transport = new ApiConsoleTransport();
      const opts = {};
      if (typeof this.opts.tagName !== 'undefined') {
        opts.tagName = this.opts.tagName;
      }
      if (typeof this.opts.local !== 'undefined') {
        opts.src = this.opts.local;
      }
      const sources = new ApiConsoleSources(
        opts,
        resolver,
        transport,
        this.logger);
      this.__consoleSources = sources;
    }
    return this.__consoleSources;
  }
  /**
   * Builds the API console.
   * @return {Promise}
   */
  build() {
    this._setup();
    return this.cache.hasCache()
    .then((exists) => {
      if (exists) {
        return this.buildFromCache();
      } else {
        return this.buildFromSources();
      }
    })
    .then(() => {
      // No error so remove debug file.
      if (this.debugFile) {
        return fs.remove(this.debugFile);
      }
    })
    .then(() => this.sayGoodbye())
    .catch((cause) => {
      this.logger.error('');
      this.logger.error(colors.red(cause.message));
      this.logger.error(colors.red(cause.stack));
      this.logger.error('');
      return this.sourceControl.cleanup(this.workingDir)
      .then(() => {
        process.exit(1);
      });
    });
  }
  /**
   * Restores cached build and generates data model if nescesary.
   * @return {Promise}
   */
  buildFromCache() {
    this.logger.info('Reusing cached build.');
    return this.sourceControl.clearOutputDir()
    .then(() => this.cache.restore(this.opts.destination))
    .then(() => this._setApi(this.opts.destination))
    .catch((err) => {
      this.logger.warn('Unable to restore cache file');
      this.logger.log(err);
      this.logger.warn('Building from sources.');
      return this.buildFromSources();
    });
  }
  /**
   * Builds API console from sources.
   * This is called when cache file is not found.
   *
   * Call this function if you prefer not to check for cache.
   * @return {Promise}
   */
  buildFromSources() {
    return this._prepareBuild()
    .then(() => this._performBuild())
    .then(() => this._postBuild())
    .then(() => this.clearDebugFile());
  }
  /**
   * Sets up variables used in the build process so it is not computed
   * all over again.
   */
  _setup() {
    this._setupBuildType();
    this._setupApiDataModelFile();
  }
  /**
   * Sets up the `buildType` property.
   */
  _setupBuildType() {
    let buildType;
    if (this.opts.api && this.opts.withAmf) {
      buildType = 'api';
    } else if (this.opts.api && !this.opts.withAmf) {
      buildType = 'model';
    } else {
      buildType = 'plain';
    }
    this.buildType = buildType;
  }
  /**
   * Sets up `apiDataFile` property that describes API data source.
   * It is either a RAML/OAS file that is used by the AMF parser to render
   * the API dynamically or it is generated AMF json/ld data model file.
   */
  _setupApiDataModelFile() {
    if (this.opts.withAmf) {
      this.apiDataFile = this.opts.api;
    } else {
      this.apiDataFile = 'api-model.json';
    }
  }
  /**
   * Contains all the tasks that have to be executed before running the builder.
   * @return {Promise} Resolved promise when all pre-build work has been
   * completed.
   */
  _prepareBuild() {
    this.logger.info('Preparing build process...');
    return this._sourcesToWorkingDirectory()
    .then(() => this._manageDependencies());
  }

  /**
   * Creates a working directory and copies console's sources to it.
   * Also clears build dir.
   *
   * The function sets `this.workingDir` property when working directory is
   * created.
   *
   * @return {Promise} Resolved promise on success.
   */
  _sourcesToWorkingDirectory() {
    return this.sourceControl.clearOutputDir()
    .then(() => this.sourceControl.createWorkingDir())
    .then((workingDir) => {
      this.workingDir = workingDir;
      return this.consoleSources.sourcesTo(this.workingDir);
    });
  }
  /**
   * Installs console's dependencies and if needed copies console source
   * files to `bower_components` directory.
   *
   * @return {Promise}
   */
  _manageDependencies() {
    const standalone = !this.opts.embedded;
    let opts = {
      verbose: this.opts.verbose,
      app: standalone,
      isV4: false
    };
    opts.optionalDependencies = this._prepareDependenciesList(standalone);
    const dir = this.workingDir;
    return consoleDependencies.installDependencies(dir, opts, this.logger);
  }
  /**
   * Prepares a list of dependencies to be installed with this build.
   * @param {Boolean} standalone True if this is "standalone" build.
   * @return {Array<String>}
   */
  _prepareDependenciesList(standalone) {
    let dependencies = [
      // oauth popup is always copied
      'advanced-rest-client/oauth-authorization#^2.0.0'
    ];
    if (standalone || this.opts.noCryptoJs !== true) {
      dependencies.push('advanced-rest-client/cryptojs-lib');
    }
    if (standalone || !this.opts.noJsPolyfills) {
      dependencies.push('advanced-rest-client/arc-polyfills');
    }
    if (standalone || !this.opts.noXhr) {
      dependencies.push('advanced-rest-client/xhr-simple-request#^2.0.0');
    }
    if (standalone || !this.opts.noWebAnimations) {
      dependencies.push('web-animations/web-animations-js#^2.3');
    }
    if (!this.opts.themeFile) {
      const file = 'api-console-default-theme';
      dependencies.push(`advanced-rest-client/${file}#5.0.0-preview`);
    }
    return dependencies;
  }
  /**
   * Copies templates to the working directory and updates path to bower
   * components if needed.
   *
   * @return {Promise}
   */
  _prebuildTemplates() {
    const {TemplateManager} = require('./template-manager');
    const processor = new TemplateManager(
      this.workingDir,
      {
        embedded: this.opts.embedded,
        buildType: this.buildType
      },
      this.logger
    );
    return processor.copyTemplate()
    .then(() => {
      if (this.opts.embedded) {
        return;
      }
      const vars = {
        apiTitle: this._getApiTitle(),
        apiFile: this.apiDataFile
      };
      return processor.processTemplate(vars);
    });
  }
  /**
   * Reads the API data if needed.
   *
   * @param {String} buildRoot Location where to put model file.
   * @return {Promise}
   */
  _setApi(buildRoot) {
    if (this.opts.withAmf || !this.opts.api || !this.opts.apiType) {
      return Promise.resolve();
    }
    const processor = new AmfSource(this.logger);
    return processor.getModel(this.opts.api, this.opts.apiType)
    .then((model) => {
      this.apiModel = model;
      if (!this.opts.withAmf) {
        return fs.ensureDir(buildRoot)
        .then(() => processor.saveModel(
          model, path.join(buildRoot, this.apiDataFile)));
      }
    });
  }
  /**
   * Reads API title if available.
   * @return {String|undefined}
   */
  _getApiTitle() {
    let model = this.apiModel;
    if (!model) {
      return;
    }
    if (!model.encodes || !model.encodes.name || !model.encodes.name.value) {
      return;
    }
    return model.encodes.name.value();
  }
  /**
   * Runs Polymer build library to build the application.
   * @return {Promise}
   */
  _performBuild() {
    const {ApiConsoleBuilder} = require('./builder');
    const builder = new ApiConsoleBuilder(
      this.opts,
      this.logger,
      this.workingDir,
      this.workingBuildOutput,
      'api-console.html'
    );
    return builder.build()
    .then(() => this._setApi(path.join(this.workingDir, 'build')))
    .then(() => this._prebuildTemplates())
    .then(() => this._setAttributes())
    .then(() => this.sourceControl.copyOutput(this.workingDir,
      this.workingBuildOutput));
  }
  /**
   * Sets attributes to the `index.html` file for standalone build.
   *
   * @return {Promise}
   */
  _setAttributes() {
    if (this.opts.embedded) {
      return Promise.resolve();
    }
    if (!this.opts.attributes) {
      this.opts.attributes = [];
    }
    if (this.opts.attributes.indexOf('app') === -1) {
      this.logger.info('Adding "app" attribute for the standalone build.');
      this.opts.attributes.push('app');
    }
    const processor = new AttributesProcessor(this.opts, this.logger,
      path.join(this.workingDir, 'build', 'index.html'));
    return processor.setAttributes();
  }
  /**
   * Action to perform after the build is complete.
   * @return {Promise}
   */
  _postBuild() {
    return this.sourceControl.cleanup(this.workingDir)
    .then(() => {
      if (!this.opts.noCache) {
        return this.cache.cacheBuild(this.opts.destination);
      }
    });
  }

  /**
   * Removes debug file.
   * @return {Promise}
   */
  clearDebugFile() {
    return fs.remove('api-console-debug.log');
  }
  /**
   * Prints end message to the user.
   */
  sayGoodbye() {
    let message = '\nAPI console build ready.\n';
    message += 'Thanks for using our API tools!\n';
    console.log(message);
  }
}
exports.ApiConsoleProject = ApiConsoleProject;
