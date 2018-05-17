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
    return this._prepareBuild()
    .then(() => this._performBuild())
    .then(() => this._postBuild())
    .then(() => this.clearDebugFile())
    .catch((cause) => {
      if (this.outputInterval) {
        clearInterval(this.outputInterval);
      }

      this.logger.error('');
      this.logger.error(colors.red(cause.message));
      this.logger.error(colors.red(cause.stack));
      this.logger.error('');

      // return this.sourceControl.cleanup(this.workingDir)
      // .then(() => {
      //   process.exit(1);
      // });
    });
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
    // .then(() => this._prebuildTemplates()) TODO: Template for standalone app.
    .then(() => this._setApi());
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
      'advanced-rest-client/raml-aware#^2.0.0',
      'PolymerElements/iron-flex-layout#^2.0.0',
      // oauth popup is always copied
      'advanced-rest-client/oauth-authorization#^2.0.0'
    ];
    const standalone = this.opts.embedded === true ? false : true;
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
      const sources = this.consoleSources;
      if (standalone) {
        return sources.moveConsoleToBower(dir);
      }
    });
  }
}
exports.ApiConsoleProject5 = ApiConsoleProject5;
