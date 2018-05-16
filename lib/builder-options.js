'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */

/**
 * An init options for the API console builder.
 *
 * It sets user settings and apply default settings if needed.
 */
class BuilderOptions {
  /**
   * @constructor
   * @param {?Object} opts User options
   */
  constructor(opts) {
    opts = opts || {};
    opts = Object.assign({}, opts);
    this.majorRelease = this._readMajorRelease(opts);
    let options;
    switch (this.majorRelease) {
      case 4:
        const {BuilderOptions4} = require('./options-support/options-v4');
        options = new BuilderOptions4(opts);
        break;
      case 5:
        const {BuilderOptions5} = require('./options-support/options-v5');
        options = new BuilderOptions5(opts);
        break;
      default:
        throw new Error('Unsupported major release version', this.majorRelease);
    }
    const optionsList = options.validOptions;
    this.supportClass = options;
    this._proxyOptions(optionsList);
  }
  /**
   * @return {Boolean} True if the underlying options support class is valid.
   */
  get isValid() {
    return this.supportClass.isValid;
  }
  /**
   * @return {Array<String>} List of error messages in underlying options
   * support class.
   */
  get validationErrors() {
    return this.supportClass.validationErrors;
  }
  /**
   * @return {Array<String>} List of warning messages in underlying options
   * support class.
   */
  get validationWarnings() {
    return this.supportClass.validationWarnings;
  }
  /**
   * Creates a getter proxy to an options depending on the options class.
   * @param {String} optionsList List of options names.
   */
  _proxyOptions(optionsList) {
    const keys = Object.keys(optionsList);
    keys.forEach((prop) => {
      Object.defineProperty(this, prop, {
        get() {
          return this.supportClass[prop];
        },
        set(value) {
          this.supportClass[prop] = value;
        },
        enumerable: true
      });
    });
  }
  /**
   * Reads information about release version from passed options or
   * returns default ones.
   * @param {Object} opts User options
   * @return {Number} Major release version.
   */
  _readMajorRelease(opts) {
    let tag;
    if (opts.tagName && typeof opts.tagName === 'string') {
      tag = opts.tagName;
    } else if (opts.tagVersion && typeof opts.tagVersion === 'string') {
      tag = opts.tagVersion;
    } else {
      tag = '5.0.0';
    }
    if (tag[0] === 'v') {
      tag = tag.substr(1);
    }
    let major = tag.substr(0, tag.indexOf('.'));
    if (isNaN(major)) {
      major = 5;
    } else {
      major = Number(major);
    }
    return major;
  }
}
exports.BuilderOptions = BuilderOptions;
