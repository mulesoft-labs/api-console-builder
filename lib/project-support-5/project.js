'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const {SourceControl} = require('../source-control');
const {ApiConsoleSources} = require('api-console-sources-resolver');
const {ApiConsoleTransport} = require('api-console-github-resolver');
const {ApiConsoleGithubResolver} = require('api-console-github-resolver');
const consoleDependencies = require('api-console-dependency-manager');
const colors = require('colors/safe');
const {AmfSource} = require('./amf-source');
const {AttributesProcessor} = require('../attributes');
const fs = require('fs-extra');
/**
 * Main class to buils API console version 4.
 * It parses and validates passed options, is responsible for logging and
 * controlling a flow of the build process.
 */
class ApiConsoleProject5 {
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
      if (typeof this.opts.tagVersion !== 'undefined') {
        opts.tagName = this.opts.tagVersion;
      } else if (typeof this.opts.tagName !== 'undefined') {
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
   * @constructor
   * @param {Object} opts User configuration options.
   */
  constructor(opts) {
    this.opts = opts;
    this.logger = opts.logger;
    // Working dir from which the command was executed.
    this.startDir = process.cwd();
    this.workingBuildOutput = 'build';
  }

  /**
   * Builds the API console.
   * @return {Promise}
   */
  build() {
    this._setup();
    return this._prepareBuild()
    .then(() => this._performBuild())
    .then(() => this._postBuild())
    .then(() => this.clearDebugFile())
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
   * Sets up variables used in the build process so it is not computed
   * all over again.
   */
  _setup() {
    this._setupBuildType();
    this._setupApiDataModelFile();
    this._setUpAppMainFile();
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
   * Sets up the name of the main file.
   * For embedded console the main file is `api-console.html` and it
   * is downloaded console's main file.
   *
   * The standalone build uses predefined template (from
   * api-console-builder-templates module) that produces `index.html` file.
   */
  _setUpAppMainFile() {
    if (!this.opts.embedded) {
      this.appMainFile = 'index.html';
    } else {
      this.appMainFile = 'api-console.html';
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
    .then(() => this._manageDependencies())
    .then(() => this._setApi())
    .then(() => this._prebuildTemplates());
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
    let dependencies = [
      // oauth popup is always copied
      'advanced-rest-client/oauth-authorization#^2.0.0'
    ];
    const standalone = !this.opts.embedded;
    let opts = {
      verbose: this.opts.verbose,
      app: standalone,
      isV4: false
    };
    if (standalone || !this.opts.noCryptoJs) {
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
    opts.optionalDependencies = dependencies;
    const dir = this.workingDir;
    return consoleDependencies.installDependencies(dir, opts, this.logger)
    .then(() => {
      if (standalone) {
        let msg = 'Moving console sources to a bower_components';
        msg += ' for standalone build';
        this.logger.log(msg);
        return this.consoleSources.moveConsoleToBower(dir);
      }
    });
  }

  /**
   * Copies templates to the working directory and updates path to bower
   * components if needed.
   *
   * @return {Promise}
   */
  _prebuildTemplates() {
    if (this.opts.embedded) {
      return Promise.resolve();
    }
    const {ApiConsoleTemplatesProcessor} =
      require('api-console-builder-templates');
    const processor = new ApiConsoleTemplatesProcessor(
      this.workingDir,
      this.logger,
      {
        isV5: true,
        api: this.opts.api,
        embedded: this.opts.embedded,
        buildType: this.buildType
      }
    );
    return processor.copyV5()
    .then(() => {
      const vars = {
        apiTitle: this._getApiTitle(),
        apiFile: this.apiDataFile
      };
      return processor.processV5Template(vars);
    });
  }
  /**
   * Reads the API data if needed.
   *
   * @return {Promise}
   */
  _setApi() {
    if (this.opts.withAmf || this.opts.embedded) {
      return Promise.resolve();
    }
    const processor = new AmfSource();
    return processor.getModel(this.opts.api, this.opts.apiType)
    .then((model) => {
      this.apiModel = model;
      if (!this.opts.withAmf) {
        return processor.saveModel(model, this.workingDir, this.apiDataFile);
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
    if (!this.opts.embedded) {
      if (!this.opts.attributes) {
        this.opts.attributes = [];
      }
      if (this.opts.attributes.indexOf('app') === -1) {
        this.logger.info('Adding "app" sttribute for the standalone build.');
        this.opts.attributes.push('app');
      }
    }
    const opts = Object.assign({}, this.opts);
    opts.mainFile = this.appMainFile;
    const processor = new AttributesProcessor(opts, this.logger,
      this.workingDir);
    const {ApiConsoleBuilder} = require('./builder');
    const builder = new ApiConsoleBuilder(
      this.opts,
      this.logger,
      this.workingDir,
      this.workingBuildOutput,
      this.appMainFile
    );
    return processor.setAttributes()
    .then(() => builder.build())
    .then(() => this.sourceControl.copyOutput(this.workingDir,
      this.workingBuildOutput));
  }

  /**
   * Action to perform after the build is complete.
   * @return {Promise}
   */
  _postBuild() {
    return this.sourceControl.cleanup(this.workingDir);
  }

  /**
   * Removes debug file.
   * @return {Promise}
   */
  clearDebugFile() {
    return fs.remove('api-console-debug.log');
  }
}
exports.ApiConsoleProject5 = ApiConsoleProject5;
