/**
 * Copyright (C) MuleSoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
import fs from 'fs-extra';
import path from 'path';

/** @typedef {import('winston').Logger} Winston */

/**
 * A class that handles module's templates, copy them to working directory
 * and processes variables in the templates.
 */
export class TemplateManager {
  /**
   * Constructs the processor.
   *
   * @param {string} workingDir Path to the working directory with API console
   * build.
   * @param {Winston} logger Logger to use to log debug output. Can be any object
   * with the interface compatible platform's console object.
   */
  constructor(workingDir, logger) {
    /**
     * Logger object. Any object with interface compatible with platform's
     * console object
     * @type {Winston}
     */
    this.logger = logger;
    /**
     * A directory where all operations will be performed
     *
     * @type {string}
     */
    this.workingDir = workingDir;
  }

  /**
   * Copies version 6 template to the working directory.
   *
   * @return {Promise<void>}
   */
  async copyTemplate() {
    const { workingDir, logger } = this;
    logger.debug('Copying template files to the working directory...');
    const files = [
      'apic-import.js',
      'index.html',
      'styles.css',
      'rollup.config.js',
      '_package.json',
    ];
    for (let i = 0, len = files.length; i < len; i++) {
      const file = files[i];
      const src = path.join(__dirname, '..', 'templates', file);
      const dest = path.join(workingDir, file.replace('_', ''));
      await fs.copy(src, dest);
    }
    logger.debug('Template files ready..');
  }
}
