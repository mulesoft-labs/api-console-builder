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
const {GithubResolver} = require('./github-resolver');
const {ApiConsoleSources} = require('./api-console-sources');
const {DependencyProcessor} = require('./dependency');
const {TemplatesProcessor} = require('./templates');
const {AttributesProcessor} = require('./attributes');
const winston = require('winston');
const colors = require('colors/safe');

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
    this.logger = this.__setupLogger();
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
  __setupLogger() {
    var level = this.opts.verbose ? 'debug' : 'error';
    return new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({level: level}),
        new (winston.transports.File)({
          filename: 'api-console-debug.log',
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
   * Returns a reference to a GithubResolver.
   * It is better to have it here since it is holding cached information
   * about ramaining limits of calls so they won't reset when creating an
   * instance elsewhere.
   *
   * @return {GithubResolver}
   */
  get githubResolver() {
    if (!this.__githubResolver) {
      this.__githubResolver = new GithubResolver(this.opts, this.logger);
    }
    return this.__githubResolver;
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
      this.__templatesProcessor = new TemplatesProcessor(this.opts,
        this.logger, this.workingDir);
      this.__templatesProcessor.setTemplates();
    }
    return this.__templatesProcessor;
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
    .catch((cause) => {
      if (this.outputInterval) {
        clearInterval(this.outputInterval);
      }

      this.logger.error(colors.red('General error:'));
      this.logger.error(colors.red(cause.message));
      this.logger.error(colors.red(cause.stack));

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
    return this.sourceControl.clearOutputDir()
    .then(() => this.sourceControl.createWorkingDir())
    .then((workingDir) => {
      this.workingDir = workingDir;
    })
    .then(() => {
      const sources = new ApiConsoleSources(this.opts, this.logger,
        this.githubResolver);
      return sources.sourcesTo(this.workingDir);
    })
    .then(() => {
      return this.ramlSource.getRamlJson(this.opts.raml, this.workingDir);
    })
    .then((raml) => {
      this.raml = raml;
    })

    .then(() => {
      const processor = new DependencyProcessor(this.opts, this.logger,
        this.workingDir);
      return processor.installDependencies();
    })
    .then(() => this.templatesProcessor.copyTemplateFiles());
  }
  /**
   * Performs a build of the API Console.
   *
   * @return {Promise} Promise resolved when all operations finish.
   */
  _performBuild() {
    this.outputInterval = setInterval(this.outputTimeout.bind(this), 180000);
    return this.templatesProcessor.updateTemplateVars()
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
}

exports.ApiConsoleProject = ApiConsoleProject;
