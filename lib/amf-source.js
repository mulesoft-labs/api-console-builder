'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const amf = require('amf-client-js');
const fs = require('fs-extra');
const path = require('path');
/**
 * A class to generate AMF json/ld data model.
 * It is using the "editing" pipeline created for the console
 * by the AMF team.
 */
class AmfSource {
  /**
   * @param {Object} logger
   */
  constructor(logger) {
    this.logger = logger;
  }
  /**
   * Generates the json/ld model from an API file.
   * @param {String} location API file location
   * @param {String} type API type.
   * @return {Promise} Promise resolved to a model.
   */
  getModel(location, type) {
    this.logger.info(
      `Generating API model from ${location}, using ${type} parser`);
    amf.plugins.document.WebApi.register();
    amf.plugins.document.Vocabularies.register();
    amf.plugins.features.AMFValidation.register();

    this.logger.debug('Initializing AMF library...');
    return amf.Core.init()
    .then(() => {
      this.logger.debug('AMF ready.');
      this.logger.debug('Running API parser...');
      const parser = amf.Core.parser(type, 'application/yaml');
      let url;
      if (location.indexOf('http') === 0) {
        url = location;
      } else {
        url = `file://${location}`;
      }
      return parser.parseFileAsync(url);
    })
    .then((doc) => {
      this.logger.debug('API parsed.');
      this.logger.debug('Validating API...');
      let validateProfile;
      switch (type) {
        case 'RAML 1.0': validateProfile = amf.ProfileNames.RAML; break;
        case 'RAML 0.8': validateProfile = amf.ProfileNames.RAML08; break;
        case 'OAS 2.0':
        case 'OAS 3.0':
          validateProfile = amf.ProfileNames.OAS;
          break;
      }
      return amf.AMF.validate(doc, validateProfile)
      .then((report) => {
        if (!report.conforms) {
          this.logger.warn(report.toString());
        } else {
          this.logger.debug('API valid.');
        }
        return doc;
      });
    })
    .then((doc) => {
      this.logger.debug('Resolving API model for API components...');
      const resolver = amf.Core.resolver(type);
      return resolver.resolve(doc, 'editing');
    });
  }
  /**
   * Saves the model to a file.
   * @param {Array} model json/ld model
   * @param {String} file Path to a file where to savbe the model.
   * @return {Promise}
   */
  saveModel(model, file) {
    this.logger.debug('Generating json-ld model...');
    const opts = amf.render.RenderOptions().withSourceMaps.withCompactUris;
    const generator = amf.Core.generator('AMF Graph', 'application/ld+json');
    const start = Date.now();
    return generator.generateString(model, opts)
    .then((data) => {
      const time = Date.now() - start;
      this.logger.debug(`Model ready in ${time} milliseconds`);
      this.logger.debug('Storing API data model to file: ' + file);
      const dir = path.dirname(file);
      return fs.ensureDir(dir)
      .then(() => fs.writeFile(file, data, 'utf8'));
    });
  }
}

exports.AmfSource = AmfSource;
