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
const winston = require('winston');

/**
 * Main class in the builder.
 * It parses and validates passed options, is responsible for logging and controlling a flow
 * of the build process.
 */
class ApiConsoleProject {
  constructor(opts) {
    this.logger = this.__setupLogger();
    if (!(opts instanceof BuilderOptions)) {
      opts = new BuilderOptions(opts);
    }
    this.opts = opts;
    if (!this.opts.isValid) {
      this.printValidationErrors();
      this.printValidationWarnings();
      throw new Error('Options did not passes validation.');
    }
    this.printValidationWarnings();
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
      this.__builder = new ApiConsoleBuilder(this.opts, this.sourceControl,
        this.logger);
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
      this.__sourceControl = new SourceControl(this.opts, this.logger);
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

  }
  /**
   * Contains all the tasks that have to be executed before running the builder.
   * @return {[type]}
   */
  _prepareBuild() {
    this.sourceControl.setTemplates();
    this.builder.setOptymisationConditions();
    return this.sourceControl.clearOutputDir()
    .then(() => this.sourceControl.createWorkingDir())
    .then((workingDir) => {
      this.workingDir = workingDir;
      return this.ramlSource.getRamlJson(this.opts.raml, workingDir);
    })
    .then((raml) => {
      this.raml = raml;
    });
  }
}

exports.ApiConsoleProject = ApiConsoleProject;
