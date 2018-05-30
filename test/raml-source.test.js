'use strict';

const {RamlSource} = require('../lib/project-support-4/raml-source');
const {BuilderOptions} = require('../lib/builder-options');
const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');

describe('RamlSource', () => {
  const logger = {
    warn: function() {},
    info: function() {},
    log: function() {}
  };
  const workingDir = 'test/raml-source';
  const opts = {
    raml: 'test/api.raml',
    tagName: '4.2.1',
    useJson: true,
    attributes: [
      {'json-file': 'api-data.json'}
    ]
  };

  describe('apiOutputPath()', () => {
    let processor;
    let outputFile = path.join(workingDir, 'api-data.json');

    beforeEach(function() {
      let options = Object.assign({}, opts);
      options.dest = workingDir;
      options.attributes = [{
        'json-file': 'api-data.json'
      }];
      options = new BuilderOptions(options);
      processor = new RamlSource(options, logger);
    });

    it('Computes JSON file name', function() {
      const location = processor.apiOutputPath(workingDir);
      assert.equal(location, outputFile);
    });

    it('Location is undefined if not using JSON', function() {
      delete processor.opts.supportClass.useJson;
      const location = processor.apiOutputPath(workingDir);
      assert.isUndefined(location);
    });

    it('Prints error when api-json attribute is not set', function() {
      delete processor.opts.supportClass.attributes[0];
      let called = false;
      processor.logger.warn = function() {
        called = true;
      };
      const location = processor.apiOutputPath(workingDir);
      assert.isUndefined(location);
      assert.isTrue(called);
    });
  });

  describe('getRamlJson()', () => {
    let processor;
    const outputFile = path.join(workingDir, 'api-data.json');

    beforeEach(function() {
      let options = Object.assign({}, opts);
      options.dest = workingDir;
      options.attributes = [{
        'json-file': 'api-data.json'
      }];
      options = new BuilderOptions(options);
      processor = new RamlSource(options, logger);
      return fs.ensureDir(workingDir);
    });

    afterEach(function() {
      return fs.remove(workingDir);
    });

    it('Should set apiFile property', function() {
      this.timeout(10000);
      return processor.getRamlJson(opts.raml, workingDir)
      .then(() => {
        assert.equal(processor.apiFile, outputFile);
      });
    });

    it('Returns with parsed RAML', function() {
      this.timeout(10000);
      return processor.getRamlJson(opts.raml, workingDir)
      .then((result) => {
        assert.typeOf(result, 'object', 'the result is object');
        assert.isString(result.title, 'result.title is string');
      });
    });

    it('Generates api.json in selected location', function() {
      this.timeout(10000);
      return processor.getRamlJson(opts.raml, workingDir)
      .then(() => {
        return fs.pathExists(outputFile);
      })
      .then((result) => {
        assert.isTrue(result);
      });
    });
  });
});
