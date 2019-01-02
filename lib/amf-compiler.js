const browserify = require('browserify');
const ClosureCompiler = require('google-closure-compiler').compiler;
const fs = require('fs-extra');
const path = require('path');
const tmp = require('tmp');
/**
 * A class responsible for AMF library compilation to browser version.
 */
class AmfCompiler {
  /**
   * @param {String} outputDir Folder where to place the build.
   * @param {Object} logger
   */
  constructor(outputDir, logger) {
    this.logger = logger;
    this.outputDir = outputDir;
  }
  /**
   * Broswerify, compile, and copy the build to the application folder.
   * @return {Promise}
   */
  buildAmfLibrary() {
    try {
      this._createTempFiles();
    } catch (error) {
      return Promise.reject(new Error('Unable to create temporaty files. ' + error.message));
    }
    return this._prepareBrowser()
    .then(() => this._buildLibrary())
    .then(() => this._copyLibrary())
    .then(() => this._clearFiles())
    .catch((cause) => {
      this._clearFiles();
      throw cause;
    });
  }
  /**
   * Creates temporary files for browserify and for compiler output.
   */
  _createTempFiles() {
    this._browserTmpObj = tmp.fileSync();
    this._amfTmpObj = tmp.fileSync();
  }
  /**
   * Runs broswerify on AMF export file and outputs the result into temporary
   * object.
   * @return {Promise}
   */
  _prepareBrowser() {
    this.logger.debug('Preparing AMF browser\'s version...');
    const b = browserify();
    b.add(path.join(__dirname, 'babel-export.js'));
    this._browserTmpObj = tmp.fileSync();
    return new Promise((resolve, reject) => {
      const time = Date.now();
      b.bundle((err, buff) => {
        if (err) {
          this._browserTmpObj.removeCallback();
          reject(err);
          return;
        }
        this.logger.debug('AMF bundling completed in ' + (Date.now() - time) + 'ms');
        fs.outputFile(this._browserTmpObj.name, buff.toString())
        .then(() => resolve())
        .catch((cause) => reject(cause));
      });
    });
  }
  /**
   * Compiles AMF library to using Google Closure compiler.
   * @return {Promise}
   */
  _buildLibrary() {
    this.logger.debug('Compiling AMF library with closure compiler...');
    const closureCompiler = new ClosureCompiler({
      js: this._browserTmpObj.name,
      compilation_level: 'SIMPLE',
      warning_level: 'QUIET'
    });
    return new Promise((resolve, reject) => {
      const time = Date.now();
      closureCompiler.run((exitCode, stdOut, stdErr) => {
        if (stdErr) {
          this.logger.error(stdErr);
        }
        this.logger.debug('Compiling completed in ' + (Date.now() - time) + 'ms');
        if (!(exitCode === 0 || exitCode === '0')) {
          this.logger.error('Complication process exit code is ' + exitCode);
          reject(new Error('Unable to compile AMF library.'));
          return;
        }
        fs.outputFile(this._amfTmpObj.name, stdOut)
        .then(() => resolve())
        .catch((cause) => reject(cause));
      });
    });
  }
  /**
   * Copies compiled library to the final destination.
   * @return {Promise}
   */
  _copyLibrary() {
    this.logger.debug('Copying AMF library to the build location.');
    const dest = path.join(this.outputDir, 'amf.js');
    return fs.copy(this._amfTmpObj.name, dest);
  }
  /**
   * Clears temporary files when ready.
   */
  _clearFiles() {
    if (this._browserTmpObj) {
      this._browserTmpObj.removeCallback();
    }
    if (this._amfTmpObj) {
      this._amfTmpObj.removeCallback();
    }
  }
}
exports.AmfCompiler = AmfCompiler;
