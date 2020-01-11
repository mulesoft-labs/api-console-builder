/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
import tmp from 'tmp';
import fs from 'fs-extra';
import path from 'path';
/**
 * A class responsible for performing basic operations on a source files
 * and build locations.
 */
export class SourceControl {
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
  async clearOutputDir() {
    return await fs.remove(this.opts.destination || 'build');
  }

  /**
   * Creates a working directory where the files will be processed.
   *
   * @return {Promise<String>} Resolved promise when the tmp dire was created
   * with path to the working
   * directory.
   */
  async createWorkingDir() {
    const path = await this.createTempDir();
    return fs.realpath(path);
  }
  /**
   * Cleans up the temporaty directory.
   *
   * @param {String} dir Path to the temporaty directory.
   * @return {Promise}
   */
  async cleanup(dir) {
    if (!dir) {
      return;
    }
    this.logger.debug('Cleaning up temporaty dir...');
    const exists = await fs.pathExists(dir);
    if (exists) {
      this.logger.debug('Removing ' + dir);
      await fs.remove(dir);
    }
  }
  /**
   * Creates a temp working dir for the console.
   * @return {Promise}
   */
  createTempDir() {
    this.logger.debug('Creating working directory...');
    return new Promise((resolve, reject) => {
      tmp.dir((err, _path) => {
        if (err) {
          reject(new Error('Unable to create a temp dir: ' + err.message));
          return;
        }
        this.logger.debug('Working directory created: ' + _path);
        resolve(_path);
      });
    });
  }

  /**
   * Copy generated files from the temp build folder to
   * the right place defined in `opts.dest`.
   *
   * @param {String} from A folder containing build files.
   * @param {String} buildDir
   * @return {Promise}
   */
  async copyOutput(from, buildDir) {
    this.logger.debug('Copying generated files to the output folder');

    const source = path.join(from, buildDir);
    const dest = this.opts.destination;

    await fs.copy(source, dest);
    this.logger.debug('All files copied');
  }
}
