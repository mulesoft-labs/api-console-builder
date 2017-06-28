'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const {BuilderOptions} = require('./builder-options');
const fs = require('fs-extra');
const path = require('path');
const unzip = require('unzip');
/**
 * A class responsible for getting the API Console correct sources
 * and copy it to desired location.
 */
class ApiConsoleSources {
  /**
   * Constructs a builder.
   *
   * @param {BuilderOptions} opts Options passed to the module
   * @param {Winston} logger Logger to use to log debug output
   */
  constructor(opts, logger) {
    if (!(opts instanceof BuilderOptions)) {
      opts = new BuilderOptions(opts);
    }
    /**
     * @type {BuilderOptions}
     */
    this.opts = opts;
    this.logger = logger;
  }

  /**
   * Gets a console from source described in module passed options to a location described in
   * `destination` attribute.
   *
   * Console can be downloaded from mulesoft main repository as a latest release or tagged release.
   * It can be copied from a local path or downloaded from a zip file. This can be controlled
   * by the options.
   *
   * @param {String} destination A place where to copy the console.
   * @return {Promise}
   */
  sourcesTo(destination) {
    // define a flow.
    var tag = this.opts.tagVersion;
    var src = this.opts.src;
    if (!tag && !src) {
      return this._downloadLatest(destination);
    }
    if (tag) {
      return this._downloadTagged(tag, destination);
    }
    var download = src.indexOf('http') === 0;
    if (download) {
      return this._downloadAny(src, destination);
    }

    return this._copyLocal(src, destination);
  }

  _copyLocal(from, to) {
    this.logger.info('Copying local API Console files to the working dir.');

    return fs.stat(from)
    .then((stats) => {
      if (stats.isFile()) {
        if (this.opts.sourceIsZip) {
          return this._openZipFile(from, to)
          .then((fd) => this._processZip(fd, to));
        }
        let message = 'Source is a file but sourceIsZip option is not set. ';
        message += 'Please, set this option to determine how to handle the source file.';
        throw new Error(message);
      }

      let src = path.resolve(process.cwd(), from);
      this.logger.info('Copying files from ', src);
      return fs.copy(src + '/', to);
    });
  }

  _downloadLatest(to) {
    this.logger.info('Downloading latest release of API Console.');
  }

  _downloadTagged(tag, to) {
    this.logger.info('Downloading ' + tag + ' release of API Console.');
  }

  _downloadAny(from, to) {
    this.logger.info('Downloading API Console sources from ', from);
  }
  /**
   * Opens the zip file to read.
   * @param {String} source A path to a file.
   * @return {Promise} Resolved to a file descriptor.
   */
  _openZipFile(source) {
    this.logger.info('Opening local zip file of the console.');

    return fs.open(source, 'r');
  }
  /**
   * Unzips files from the zip file and copy them to the destination folder.
   *
   * @param {Number} fd File descriptor of opened zip file.
   * @param {String} destination Folder where to put the files.
   * @return {Promise}
   */
  _processZip(fd, destination) {
    return new Promise((resolve, reject) => {
      fs.createReadStream(undefined, {
        fd: fd
      })
      .pipe(unzip.Extract({
        path: destination
      }))
      .on('close', () => {
        this.logger.info('Zip file has been extracted.');
        resolve(this._removeZipMainFolder(destination));
      })
      .on('error', function() {
        reject(new Error('Unable to unzip the API console sources'));
      });
    });
  }

  /**
   * GitHub's zip (and possibly others too) will have source files enclosed in a folder.
   * This will look for a folder in the root path and will copy sources from it.
   *
   * @param {String} destination A place where the zip sources has been extracted.
   * @return {Promise}
   */
  _removeZipMainFolder(destination) {
    return fs.readdir(destination)
    .then((files) => {
      if (files.length > 1) {
        return Promise.resolve();
      }
      const dirPath = path.join(destination, files[0]);
      return fs.stat(dirPath)
      .then((stats) => {
        if (stats.isDirectory()) {
          return fs.copy(dirPath, destination);
        }
      });
    });
  }
}

exports.ApiConsoleSources = ApiConsoleSources;
