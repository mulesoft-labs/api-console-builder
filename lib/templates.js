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
class TemplatesProcessor {
  /**
   * Constructs the processor.
   *
   * @param {BuilderOptions} opts Options passed to the module
   * @param {Winston} logger Logger to use to log debug output
   * @param {String} workingDir Path to a working directory
   * instance.
   */
  constructor(opts, logger, workingDir) {
    if (!workingDir) {
      throw new Error('Required workingDir attribute is not set.');
    }
    /**
     * @type {BuilderOptions}
     */
    this.opts = opts;
    this.logger = logger;
    /**
     * A directory where all operations will be performed
     *
     * @type {String}
     */
    this.workingDir = workingDir;
    /**
     * A flag determining if templates were used with this build.
     * It will be set when the `setTemplates()` function is called.
     *
     * @type {Boolean}
     */
    this.templateUsed = undefined;
  }

  /**
   * Sets the template files to use to build the console.
   * If the `mainFile` option is set then templates will not be used.
   * Otherwise it sets the `mainFile` option to the template that should be
   * used. Also, sets `templateUsed` flag to determine if template files should
   * be copied to the workingDir location.
   */
  setTemplates() {
    if (this.opts.mainFile) {
      this.logger.info('Will not use a template.');
      this.templateUsed = false;
      return;
    }

    this.templateUsed = true;
    var filename = this.opts.embedded ? 'embedded-' : 'standalone-';
    if (this.opts.useJson) {
      filename += 'json';
      if (this.opts.inlineJson) {
        filename += '-inline';
      }
    } else if (this.opts.raml) {
      filename += 'raml';
    } else {
      filename += 'plain';
    }

    var exampleFile = this.opts.embedded ? filename + '-example.tpl' : undefined;
    filename += '.tpl';
    this.logger.info('Template to use: ', filename);

    this.templateFile = filename;
    this.exampleFile = exampleFile;
  }
  /**
   * Copies template files from module's templates directory.
   *
   * @return {Promise} Resolved promise when the templates are copied.
   */
  copyTemplateFiles() {
    if (this.templateUsed === undefined) {
      return Promise.reject(new Error(
        'Trying to copy templates before calling setTemplates().'
      ));
    }
    if (!this.templateUsed) {
      return Promise.resolve();
    }
    return this._copyMainTemplate()
    .then(() => this._copyExampleTemplate());
  }

  _copyMainTemplate() {
    this.logger.info('Copying the template file to the working directory...');

    this.opts.mainFile = this.opts.embedded ? 'import.html' : 'index.html';
    const src = path.join(__dirname, '..', 'templates', this.templateFile);
    const dest = path.join(this.workingDir, this.opts.mainFile);
    return fs.copy(src, dest);
  }

  _copyExampleTemplate() {
    if (!this.exampleFile) {
      return Promise.resolve();
    }
    this.logger.info('Copying the example file to the working directory...');
    const src = path.join(__dirname, '..', 'templates', this.exampleFile);
    const dest = path.join(this.workingDir, 'example.html');
    return fs.copy(src, dest);
  }
  /**
   * Updates variables in the template file.
   * It only perform any task is the templates were used with this build.
   *
   * @param {Object} raml Parsed and enhanced RAML.
   * @return {Promise} Resolved pomise whem the template variables are updated.
   */
  updateTemplateVars(raml) {
    if (!this.templateUsed || !raml) {
      return Promise.resolve();
    }
    return this._setMainVars(raml)
    .then(() => this._setExampleVars(raml));
  }
  /**
   * It processes variables in the main file.
   *
   * @param {Object} raml Downloaded raml definition.
   * @return {Promise} Promise resolved when the content has been saved to the
   * file.
   */
  _setMainVars(raml) {
    this.logger.info('Updating main file template variables...');
    return this._processFileTemplates(this.opts.mainFile, raml);
  }
  /**
   * If current build is not `embedded` then it processes variables in the
   * `example.html` file.
   *
   * @param {Object} raml Downloaded raml definition.
   * @return {Promise} Promise resolved when the content has been saved to the
   * file.
   */
  _setExampleVars(raml) {
    if (!this.opts.embedded) {
      return;
    }
    this.logger.info('Updating example file template variables...');
    return this._processFileTemplates('example.html', raml);
  }
  /**
   * Reads files contents and calls a function to update variables.
   *
   * @param {String} file Name of the file to readFile
   * @param {Object} raml Downloaded raml definition.
   * @return {Promise} Promise resolved when the content has been saved to the
   * file.
   */
  _processFileTemplates(file, raml) {
    const filePath = path.join(this.workingDir, file);
    return fs.readFile(filePath, 'utf8')
    .then((data) => {
      data = this._processVars(data, raml);
      return data;
    })
    .then((data) => fs.writeFile(filePath, data, 'utf8'));
  }
  /**
   * Updates variables in the `content` with RAML data.
   *
   * @param {String} content File content to update
   * @param {Object} raml Parsed and enhanced JSON from the RAML file.
   * @return {String} Updated file content.
   */
  _processVars(content, raml) {
    content = content.replace('[[API-TITLE]]', raml.title);

    if (this.opts.useJson && this.opts.inlineJson) {
      let jsonData = JSON.stringify(raml);
      content = content.replace('[[API-DATA]]', jsonData);
    }

    if (!this.opts.useJson && this.opts.raml) {
      content = content.replace('[[API-FILE-URL]]', this.opts.raml);
    }

    return content;
  }
}
exports.TemplatesProcessor = TemplatesProcessor;