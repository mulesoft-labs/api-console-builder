'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const Transform = require('stream').Transform;
const compile = require('google-closure-compiler-js').compile;
/**
 * Model for error message
 */
class PluginError {
  /**
   * @constructor
   * @param {String} message Error message
   */
  constructor(message) {
    this.message = message;
  }
}
/**
 * A transformer for Polymer build.
 */
class CompilationStream extends Transform {
  /**
   * @constructor
   * @param {Object} compilationOptions
   */
  constructor(compilationOptions) {
    super({objectMode: true});

    this.compilationOptions_ = compilationOptions;
  }
  /**
   * @param {Object} file Vinyl file
   * @param {String} enc
   * @param {Function} cb
   */
  _transform(file, enc, cb) {
    if (file.isNull()) {
      // Ignore empty files.
    } else if (file.isStream()) {
      this.emit('error', new PluginError('Streaming not supported'));
    } else {
      if (this._fileAllowed(file.path)) {
        // console.log('Transforming file', file.path);
        file = this._processFile(file);
      }
    }
    this.push(file);
    cb();
  }
  /**
   * Checks if file is allowed to process.
   * @param {String} path File path
   * @return {Boolean}
   */
  _fileAllowed(path) {
    if (!path) {
      return true;
    }
    if (path.indexOf('raml-1-parser.js') !== -1) {
      return false;
    }
    if (path.indexOf('min.js') !== -1) {
      return false;
    }

    return true;
  }
  /**
   * Compiles sources.
   * @param {Object} file Vinyl file
   * @return {Object} Vinyl file
   */
  _processFile(file) {
    const options = Object.assign({}, this.compilationOptions_);
    options.jsCode = [{
      path: file.path,
      src: file.contents.toString()
    }];

    const output = compile(options);
    if (output.errors.length > 0) {
      const message = `Compilation error, ${output.errors.length} errors`;
      this.emit('error', new PluginError(message));
    } else {
      file.contents = new Buffer(output.compiledCode);
    }
    return file;
  }
}

/**
 * @param {Object} compilationOptions
 * @return {function(Object<string>=):Object}
 */
module.exports = function(compilationOptions) {
  return new CompilationStream(compilationOptions || {});
};
