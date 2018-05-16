'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */

/**
 * A base class with common methods for options classes.
 */
class BaseOptions {
  /**
   * @constructor
   */
  constructor() {
    this.validationErrors = [];
    this.validationWarnings = [];
  }
  /**
   * @return {Boolean} True if there's no error messages.
   */
  get isValid() {
    return this.validationErrors.length === 0;
  }
  /**
   * @return {Object} Map of options with data types
   */
  get validOptions() {
    return {};
  }
  /**
   * Validates passed user options for data type and names.
   * @param {Object} userOpts
   */
  _validateOptionsList(userOpts) {
    const keys = Object.keys(userOpts);
    const known = this.validOptions;
    const knownKeys = Object.keys(known);
    const unknown = [];
    const typeMissmatch = [];
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      if (knownKeys.indexOf(key) === -1) {
        unknown.push(key);
        continue;
      }
      const expectedType = known[key].name.toLowerCase();
      const userValue = userOpts[key];
      const userType = typeof userValue;
      if ((expectedType === 'array' && !(userValue instanceof Array)) ||
        (userType !== expectedType)) {
        typeMissmatch.push({
          key,
          expectedType,
          userType
        });
      }
    }
    if (unknown.length) {
      let message = 'Unknown option';
      if (unknown.length > 1) {
        message += 's';
      }
      message += ': ' + unknown.join(', ');
      this.validationErrors.push(message);
    }
    if (typeMissmatch.length) {
      typeMissmatch.forEach((error) => {
        let msg = `Property ${error.key} expected to be ${error.expectedType}`;
        msg += ` but found ${error.userType}.`;
        this.validationErrors.push(msg);
      });
    }
  }
  /**
   * Validates user option for the `logger` property.
   *
   * @param {Object} userOpts Passed user options.
   */
  _validateLogger(userOpts) {
    if (!userOpts.logger) {
      return;
    }
    const logger = userOpts.logger;
    if (!logger.log || !logger.info || !logger.warning || !logger.error) {
      this.validationWarnings.push(
        'Invalid logger passed as an option. Will use own logger.'
      );
      delete userOpts.logger;
    }
  }
}
exports.BaseOptions = BaseOptions;
