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
   * Generates the json/ld model from an API file.
   * @param {String} location API file location
   * @param {String} type API type.
   * @return {Promise} Promise resolved to a model.
   */
  getModel(location, type) {
    amf.plugins.document.WebApi.register();
    amf.plugins.document.Vocabularies.register();
    amf.plugins.features.AMFValidation.register();
    return amf.Core.init()
    .then(() => {
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
      const resolver = amf.Core.resolver('RAML 1.0');
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
    const generator = amf.Core.generator('AMF Graph', 'application/ld+json');
    return generator.generateString(model)
    .then((data) => fs.writeFile(file, data, 'utf8'));
  }
}

exports.AmfSource = AmfSource;
