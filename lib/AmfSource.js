/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
import amf from 'amf-client-js';
import fs from 'fs-extra';
import path from 'path';

async function validateDoc(type, doc, logger) {
  logger.debug('API parsed.');
  logger.debug('Validating API...');
  let validateProfile;
  switch (type) {
    case 'RAML 1.0': validateProfile = amf.ProfileNames.RAML; break;
    case 'RAML 0.8': validateProfile = amf.ProfileNames.RAML08; break;
    case 'OAS 1.0':
    case 'OAS 2.0':
    case 'OAS 3.0':
      validateProfile = amf.ProfileNames.OAS;
      break;
  }
  const report = await amf.AMF.validate(doc, validateProfile);
  if (!report.conforms) {
    logger.warn(report.toString());
  } else {
    logger.debug('API is valid.');
  }
}

/**
 * A class to generate AMF json/ld data model.
 * It is using the "editing" pipeline created for the console
 * by the AMF team.
 */
export class AmfSource {
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
   * @param {String?} contentType API mime type.
   * @return {Promise} Promise resolved to a model.
   */
  async getModel(location, type, contentType='application/yaml') {
    this.logger.info(
      `Generating API model from ${location}, using ${type} parser`);
    amf.plugins.document.WebApi.register();
    amf.plugins.document.Vocabularies.register();
    amf.plugins.features.AMFValidation.register();

    this.logger.debug('Initializing AMF library...');
    await amf.Core.init();
    this.logger.debug('AMF ready.');
    this.logger.debug('Running API parser...');

    const parser = amf.Core.parser(type, contentType);
    let url;
    if (location.indexOf('http') === 0) {
      url = location;
    } else {
      url = `file://${location}`;
    }
    const doc = await parser.parseFileAsync(url);
    await validateDoc(type, doc, this.logger);
    this.logger.debug('Resolving API model for API components...');
    const resolver = amf.Core.resolver(type);
    return await resolver.resolve(doc, 'editing');
  }
  /**
   * Saves the model to a file.
   * @param {Array} model json/ld model
   * @param {String} file Path to a file where to savbe the model.
   * @return {Promise<void>}
   */
  async saveModel(model, file) {
    this.logger.debug('Generating json-ld model...');
    const opts = amf.render.RenderOptions().withSourceMaps.withCompactUris;
    const generator = amf.Core.generator('AMF Graph', 'application/ld+json');
    const start = Date.now();
    const data = await generator.generateString(model, opts);
    const time = Date.now() - start;
    this.logger.debug(`Model ready in ${time} milliseconds`);
    this.logger.debug('Storing API data model to file: ' + file);
    const dir = path.dirname(file);
    await fs.ensureDir(dir);
    await fs.writeFile(file, data, 'utf8');
  }
}
