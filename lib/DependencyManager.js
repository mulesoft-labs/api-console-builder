/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
import { exec } from 'child_process';
import util from 'util';

const pExec = util.promisify(exec);
/**
 * Installs dependencies in the working directory
 */
export class DependencyManager {
  /**
   * @param {String} workingDir Build directory location
   * @param {Object} logger Logger object
   * @param {String?} tagName specific tag name to install
   */
  constructor(workingDir, logger, tagName) {
    this.workingDir = workingDir;
    this.logger = logger;
    this.tagName = tagName;
  }
  /**
   * Installs dependencies and specified version of API Console.
   * @return {Promise<void>}
   */
  async install() {
    await this.installNpm();
    await this.installConsole();
  }
  /**
   * Installs dependencies from `package.json` file.
   * @return {Promise<void>}
   */
  async installNpm() {
    const { logger } = this;
    logger.info('Installing dependencies...');
    const command = 'npm i';
    await this._runCmd(command);
    logger.info('Dependencies ready.');
  }
  /**
   * Installs API Console from specified in `tagName` or otherwise latest version.
   * @return {Promise<void>}
   */
  async installConsole() {
    const { logger, tagName } = this;
    logger.info('Installing APIC Console...');
    let command = 'npm i @anypoint-web-components/api-console';
    if (tagName) {
      command += `@${tagName}`;
    }
    await this._runCmd(command);
    logger.info('API console ready.');
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
    const { stderr } = await pExec(command, options);
    // if (stdout) {
    //   logger.debug(stdout);
    // }
    if (stderr) {
      logger.warn(stderr);
    }
  }
}
