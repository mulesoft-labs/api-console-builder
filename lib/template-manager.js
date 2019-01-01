'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const fs = require('fs-extra');
const path = require('path');
/**
 * A class that handles module's templates, copy them to working directory
 * and processes variables in the templates.
 */
class TemplateManager {
  /**
   * Constructs the processor.
   *
   * @param {String} workingDir Path to the working directory with API console
   * build.
   * @param {Object} opts Options passed to the module
   * @param {Object} logger Logger to use to log debug output. Can be any object
   * with the interface compatible platform's console object.
   */
  constructor(workingDir, opts, logger) {
    /**
     * @type {Object}
     */
    this.opts = opts;
    /**
     * Logger object. Any object with interface compatible with platform's
     * console object
     * @type {Object}
     */
    this.logger = logger;
    /**
     * A directory where all operations will be performed
     *
     * @type {String}
     */
    this.workingDir = workingDir;
  }

  /**
   * Copies version 5 templates to working directory.
   *
   * @return {Promise}
   */
  copyTemplate() {
    const promises = [this._copyImport()];
    if (!this.opts.embedded) {
      promises[promises.length] = this._copyTemplateFile();
    }
    return Promise.all(promises);
  }
  /**
   * Copies corresponding template file from templates.
   * @return {Promise}
   */
  _copyTemplateFile() {
    let tpl = 'apic-' + this.opts.buildType + '.tpl';
    this.logger.debug(`Copying template file ${tpl} as index.html`);
    const src = path.join(__dirname, '..', 'templates', tpl);
    const dest = path.join(this.workingDir, 'build', 'index.html');
    return fs.copy(src, dest);
  }
  /**
   * Copies import script.
   * @return {Promise}
   */
  _copyImport() {
    this.logger.debug(`Copying import script for the template.`);
    const src = path.join(__dirname, '..', 'templates', 'apic-import.js');
    const dest = path.join(this.workingDir, 'build', 'apic-import.js');
    return fs.copy(src, dest);
  }
  /**
   * @param {Object} vars A list of variables to update the template file:
   * - apiFile {String} - location of the RAML, OAS or json/ld file.
   * - apiTitle {String} - a title of the API
   * @return {Promise}
   */
  processTemplate(vars) {
    if (this.opts.embedded) {
      return Promise.resolve();
    }
    this.logger.debug('Processing API variables in the main file.');
    const filePath = path.join(this.workingDir, 'build', 'index.html');
    return fs.readFile(filePath, 'utf8')
    .then((data) => {
      const title = vars.apiTitle || 'API console';
      data = data.replace('[[API-TITLE]]', title);
      if (vars.apiFile) {
        data = data.replace('[[AMF-API-FILE]]', vars.apiFile);
      }
      return data;
    })
    .then((data) => fs.writeFile(filePath, data, 'utf8'));
  }
}
exports.TemplateManager = TemplateManager;
