const {BuilderOptions} = require('./builder-options');
const winston = require('winston');
const path = require('path');
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
    if (opts.majorRelease === 4) {
      const {ApiConsoleProject4} = require('./project-support-4/project');
      this.proxy = new ApiConsoleProject4(opts);
    } else {
      const {ApiConsoleProject5} = require('./project-support-5/project');
      this.proxy = new ApiConsoleProject5(opts);
    }
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
    const level = this.opts.verbose ? 'debug' : 'error';
    return new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({level: level}),
        new (winston.transports.File)({
          filename: path.join(process.cwd(), 'api-console-debug.log'),
          level: 'error'
        })
      ]
    });
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
   * Builds the API console.
   * @return {Promise}
   */
  build() {
    return this.proxy.build();
  }
}
exports.ApiConsoleProject = ApiConsoleProject;
