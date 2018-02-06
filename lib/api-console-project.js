'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const {SourceControl} = require('./source-control');
const {BuilderOptions} = require('./builder-options');
const {ApiConsoleBuilder} = require('./builder');
const {RamlSource} = require('./raml-source');
const {ApiConsoleSources} = require('api-console-sources-resolver');
const {ApiConsoleTransport} = require('api-console-github-resolver');
const {ApiConsoleGithubResolver} = require('api-console-github-resolver');
const {ApiConsoleTemplatesProcessor} = require('api-console-builder-templates');
const consoleDependencies = require('api-console-dependency-manager');
const {AttributesProcessor} = require('./attributes');
const winston = require('winston');
const colors = require('colors/safe');
const fs = require('fs-extra');
const path = require('path');

/**
 * Main class in the builder.
 * It parses and validates passed options, is responsible for logging and controlling a flow
 * of the build process.
 */
class ApiConsoleProject {
  constructor(opts) {
    if (!(opts instanceof BuilderOptions)) {
      opts = new BuilderOptions(opts);
    }
    this.opts = opts;
    this.logger = this.__setupLogger(opts);
    if (!this.opts.isValid) {
      this.printValidationErrors();
      this.printValidationWarnings();
      throw new Error('Options did not passes validation.');
    }
    this.printValidationWarnings();

    // Working dir from which the command was executed.
    this.startDir = process.cwd();

    this.workingBuildOutput = 'build';
  }
  /**
   * Creates a logger object to log debug output.
   */
  __setupLogger(opts) {
    if (opts.logger) {
      return opts.logger;
    }
    var level = this.opts.verbose ? 'debug' : 'error';
    return new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({level: level}),
        new (winston.transports.File)({
          filename:  path.join(process.cwd(), 'api-console-debug.log'),
          level: 'error'
        })
      ]
    });
  }

  /**
   * The builder that performs the build task.
   *
   * @return {ApiConsoleBuilder}
   */
  get builder() {
    if (!this.__builder) {
      this.__builder = new ApiConsoleBuilder(this.opts, this.logger,
        this.workingDir, this.workingBuildOutput);
    }
    return this.__builder;
  }
  /**
   * A class that manages API Console sources
   *
   * @return {SourceControl}
   */
  get sourceControl() {
    if (!this.__sourceControl) {
      this.__sourceControl = new SourceControl(this.opts, this.logger,
        this.workingBuildOutput);
    }
    return this.__sourceControl;
  }
  /**
   * A class that generates a JSON from raml.
   *
   * @return {RamlSource}
   */
  get ramlSource() {
    if (!this.__ramlSource) {
      this.__ramlSource = new RamlSource(this.opts, this.logger);
    }
    return this.__ramlSource;
  }
  /**
   * Returns a reference to a TemplatesProcessor.
   * This getter shouldn't be called before working dir has been created or it
   * will be instantialized with undefined working location.
   *
   * @return {TemplatesProcessor}
   */
  get templatesProcessor() {
    if (!this.__templatesProcessor) {
      // Manager's options are compatible with `this.opts`.
      this.__templatesProcessor = new ApiConsoleTemplatesProcessor(this.workingDir,
        this.logger, this.opts);
      this.__templatesProcessor.setTemplates();
    }
    return this.__templatesProcessor;
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
      const opts = this._getApiConsoleSourcesOptions();
      const sources = new ApiConsoleSources(opts, resolver, transport, this.logger);
      this.__consoleSources = sources;
    }
    return this.__consoleSources;
  }

  _getApiConsoleSourcesOptions() {
    var opts = {};
    if (typeof this.opts.tagVersion !== 'undefined') {
      opts.tagVersion = this.opts.tagVersion;
    }
    if (typeof this.opts.src !== 'undefined') {
      opts.src = this.opts.src;
    }
    if (typeof this.opts.sourceIsZip !== 'undefined') {
      opts.sourceIsZip = this.opts.sourceIsZip;
    }
    return opts;
  }

  printValidationErrors() {
    this.opts.validationErrors.forEach((error) => {
      this.logger.error(error);
    });
  }

  printValidationWarnings() {
    var warnings = this.opts.validationWarnings;
    if (!warnings || !warnings.length) {
      return;
    }
    warnings.forEach((warning) => {
      this.logger.warn(warning);
    });
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

      return this.sourceControl.cleanup(this.workingDir)
      .then(() => {
        process.exit(1);
      });
    });
  }
  /**
   * Contains all the tasks that have to be executed before running the builder.
   * After this function is finished sources are download to a temporary
   * location (`this.workingDir`), the `raml` property is set (if RAML was
   * specified in the options) and console's dependencies has been installed.
   *
   * @return {Promise} Resolved promise when all pre-build work has been
   * completed.
   */
  _prepareBuild() {
    this.logger.info('Preparing sources before build...');
    return this._sourcesToWorkingDirectory()
    .then(() => this._manageDependencies())
    .then(() => this._prebuildTemplates())
    .then(() => this._setRaml());
  }
  /**
   * Performs a build of the API Console.
   *
   * @return {Promise} Promise resolved when all operations finish.
   */
  _performBuild() {
    this.outputInterval = setInterval(this.outputTimeout.bind(this), 180000);
    return this.templatesProcessor.updateTemplateVars(this.raml)
    .then(() => {
      const processor = new AttributesProcessor(this.opts, this.logger,
        this.workingDir);
      return processor.setAttributes();
    })
    .then(() => this.switchDirectory(this.workingDir))
    .then(() => this.builder.build())
    .then(() => this.switchDirectory(this.startDir))
    .then(() => this.sourceControl.copyOutput(this.workingDir,
      this.workingBuildOutput));
  }

  _postBuild() {
    if (this.outputInterval) {
      clearInterval(this.outputInterval);
      this.outputInterval = undefined;
    }
    return this.sourceControl.cleanup(this.workingDir);
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
    })
    .then(() => {
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
    let opts = this._createDepenencyManagerOptions();
    return consoleDependencies.installDependencies(this.workingDir, this.logger, opts)
    .then(() => {
      const sources = this.consoleSources;
      if (sources.isGithubRelease || !this.opts.mainFile) {
        return this.consoleSources.moveConsoleToBower(this.workingDir);
      }
    });
  }
  /**
   * Copies templates to the working dire and updates path to bower components
   * if needed.
   * @return {Promise}
   */
  _prebuildTemplates() {
    return this.templatesProcessor.copyTemplateFiles()
    .then((mainFile) => {
      var hasMain = this.opts.mainFile;
      if (mainFile) {
        this.opts.mainFile = mainFile;
      }
      if (this.consoleSources.isGithubRelease || !hasMain) {
        return this.templatesProcessor.rewriteBowerPaths();
      }
    });
  }

  /**
   * Reads the RAML data, transforms them to JavaScript object, enhances for
   * the console and sets `this.raml` property.
   */
  _setRaml() {
    return this.ramlSource.getRamlJson(this.opts.raml, this.workingDir)
    .then(raml => this.raml = raml);
  }
  /**
   * Changes working directory with Promises.
   *
   * @param {String} path A directory path
   * @return {Promise} Promise resolved when the directory has been changed.
   */
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
   * Travis will kill the process when it takes more than 10 minutes without
   * any output. Because Closure Compiler may take more time to finish and
   * during this time there's no output, this function will be called
   * periodically to print a dummy output to the console.
   */
  outputTimeout() {
    console.log('Still working...');
  }

  clearDebugFile() {
    return fs.remove('api-console-debug.log');
  }
  /**
   * Creates an options object for the dependency manager module from current
   * options.
   */
  _createDepenencyManagerOptions() {
    var opts = {};
    if (this.opts.verbose) {
      opts.verbose = this.opts.verbose;
    }
    if (!this.opts.useJson && this.opts.raml) {
      opts.pareser = true;
    }
    if (!this.opts.embedded) {
      opts.app = true;
    }
    return opts;
  }
}

exports.ApiConsoleProject = ApiConsoleProject;
