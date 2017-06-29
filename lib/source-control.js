'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const tmp = require('tmp');
const fs = require('fs-extra');
const path = require('path');
/**
 * A class responsible for performing basic operations on a source files
 * and build locations.
 */
class SourceControl {
  /**
   * Constructs the processor.
   *
   * @param {BuilderOptions} opts Options passed to the module
   * @param {Winston} logger Logger to use to log debug output
   */
  constructor(opts, logger) {
    /**
     * @type {BuilderOptions}
     */
    this.opts = opts;
    /**
     * Logger to use to print output.
     *
     * @type {Object}
     */
    this.logger = logger;
  }

  /**
   * Clears the directory where the bundled console will be copied.
   * @return {Promise}
   */
  clearOutputDir() {
    return fs.remove(this.opts.dest || 'build');
  }

  /**
   * Creates a working directory where the files will be processed.
   *
   * @return {Promise} Resolved promise when the tmp dire was created with path to the working
   * directory.
   */
  createWorkingDir() {
    return this.createTempDir()
    .then((path) => fs.realpath(path));
  }
  /**
   * Cleans up the temporaty directory.
   *
   * @param {String} dir Path to the temporaty directory.
   */
  cleanup(dir) {
    if (!dir) {
      return Promise.resolve();
    }
    this.logger.info('Cleaning up temporaty dir...');
    return fs.pathExists(dir)
    .then((exists) => {
      if (exists) {
        this.logger.info('Removing ', dir);
        return fs.remove(dir);
      }
    });
  }
  /**
   * Creates a temp working dir for the console.
   */
  createTempDir() {
    this.logger.info('Creating working directory...');
    return new Promise((resolve, reject) => {
      tmp.dir((err, _path) => {
        if (err) {
          reject(new Error('Unable to create a temp dir: ' + err.message));
          return;
        }
        this.logger.info('Working directory created: ', _path);
        resolve(_path);
      });
    });
  }

  /**
   * Copy generated files from the temp build folder to
   * the right place defined in `opts.dest`.
   *
   * @param {String} from A folder containing build files.
   */
  copyOutput(from, buildDir) {
    this.logger.info('Copying generated files to the output folder');

    var source = path.join(from, buildDir);
    var dest = this.opts.dest;

    return fs.copy(source, dest)
    .then(() => {
      if (this.opts.useJson && !this.opts.inlineJson) {
        let jsonFileAttribute = this.opts.findAttribute('json-file');
        if (!jsonFileAttribute) {
          this.logger.warn(
            'json-file attribute not fond. will not copy json file to the ' +
            'final destination.'
          );
          return;
        }
        const jsonFile = jsonFileAttribute.value;
        this.logger.info(`Copying ${jsonFile} file...`);

        source = path.join(from, jsonFile);
        dest = path.join(this.opts.dest, jsonFile);

        return fs.copy(source, dest)
        .then(() => {
          this.logger.info(jsonFile + ' file copied');
        });
      }
    })
    .then(() => {
      if (this.opts.embedded) {
        this.logger.info('Copying example file...');
        source = path.join(from, 'example.html');
        dest = path.join(this.opts.dest, 'example.html');
        return fs.copy(source, dest)
        .then(() => {
          this.logger.info('example.html file copied');
        });
      }
    })
    .then(() => {
      this.logger.info('All files copied');
    });
  }
}

exports.SourceControl = SourceControl;
