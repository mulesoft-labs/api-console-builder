'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const {BuilderOptions} = require('../builder-options');
const {RamlJsonGenerator} = require('raml-json-enhance-node');
const path = require('path');
/**
 * A class to generate RAML data model for API console version 4.
 */
class RamlSource {
  /**
   * @constructor
   * @param {Object} opts
   * @param {Object} logger
   */
  constructor(opts, logger) {
    if (!(opts instanceof BuilderOptions)) {
      opts = new BuilderOptions(opts);
    }
    this.opts = opts;
    this.logger = logger;
    this.raml = undefined;
    this.apiFile = undefined;
  }
  /**
   * Gets a RAML definition from local or remote location and parses it
   * to JSON with RAML parser and `ram-json-enhance-node` module.
   *
   * @param {String} apiUrl Location of the RAML api file
   * @param {?String} outputDir A directory of where to put the `api.json`
   * file. Optional.
   * @return {Promise} Resolved promise with parsed JavaScript object.
   * Also sets `raml` property on this object with the same value.
   */
  getRamlJson(apiUrl, outputDir) {
    this.apiFile = undefined;
    this.raml = undefined;
    if (!apiUrl) {
      this.logger.info('No RAML source. Skipping api parser.');
      return Promise.resolve();
    }

    this.logger.info('Getting the RAML data...');

    this.apiFile = this.apiOutputPath(outputDir);
    const enhancer = new RamlJsonGenerator(apiUrl, {
      output: this.apiFile
    });

    return enhancer.generate()
    .then((json) => {
      this.logger.info('RAML data ready');
      this.raml = json;
      return json;
    });
  }
  /**
   * Creates a path of the `api.json` file. It depends on current options.
   * If the JSON is not enabled or if inline JSON option is set it will not
   * produce the `api.json` file so this function return `undefined`.
   *
   * @param {String} outputDir File location directory
   * @return {String|undefined} If current configuration allows creating
   * `api.json` file then the location of the file or undefined otherwise.
   */
  apiOutputPath(outputDir) {
    let apiJsonFile;
    if (this.opts.useJson && !this.opts.inlineJson) {
      let jsonFileAttribute = this.opts.findAttribute('json-file');
      if (!jsonFileAttribute) {
        this.logger.warn(
          'json-file attribute not fond. Will not generate json.'
        );
        return;
      }
      const jsonFile = jsonFileAttribute.value;
      apiJsonFile = path.join(outputDir, jsonFile);
    }
    return apiJsonFile;
  }
}

exports.RamlSource = RamlSource;
