/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs-extra';
import path from 'path';

const pExec = util.promisify(exec);

export class Bundler {
  /**
   * @param {String} workingDir
   * @param {Object} logger
   */
  constructor(workingDir, logger) {
    this.workingDir = workingDir;
    this.logger = logger;
  }

  get dest() {
    const { workingDir } = this;
    return path.join(workingDir, 'dist');
  }

  /**
   * Creates API Console bundles.
   * @return {Promise<void>}
   */
  async bundle() {
    await this.cleanOutput();
    await this.runBundler();
  }

  /**
   * Removes build destination output directory.
   * @return {Promise<void>}
   */
  async cleanOutput() {
    const { dest, logger } = this;
    logger.debug('Cleaning build output directory...');
    await fs.remove(dest);
  }

  async runBundler() {
    const { logger } = this;
    logger.info('Bundling API Console...');
    let command = '.\\node_modules\\.bin\\rollup';
    if (process.platform === 'win32') {
      command += '.cmd';
    }
    command += ' -c rollup.config.js';
    await this._runCmd(command);
    logger.info('API Console ready.');
  }

  /**
   * Runs command in a separated process.
   * @param {String} command The command to execute.
   * @return {Promise<void>}
   */
  async _runCmd(command) {
    const { workingDir, logger } = this;
    const options = {
      cwd: workingDir,
    };
    const { stdout, stderr } = await pExec(command, options);
    if (stdout) {
      logger.debug(stdout);
    }
    if (stderr) {
      logger.error(stderr);
    }
  }
}
