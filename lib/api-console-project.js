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
const winston = require('winston');

// function dumpFile() {
//   var stream = through.obj(function(file, enc, cb) {
//     console.log(file);
//     // console.log(String(file.contents));
//     this.push(file);
//     cb();
//   });
//   return stream;
// }

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
}

exports.ApiConsoleProject = ApiConsoleProject;
