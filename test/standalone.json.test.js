'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');
const testHelper = require('./content-test-common');
const path = require('path');

describe('api-console-builder', () => {
  const workingDir = 'playground/standalone-json-test';
  describe('standalone JSON', () => {

    var api = 'https://raw.githubusercontent.com/advanced-rest-client/';
    api += 'raml-example-api/master/api.raml';

    after(function() {
      return fs.remove(workingDir);
    });

    it('Build the console with the inlined json', function() {
      this.timeout(270000);
      return builder({
        noOptimization: true,
        src: 'https://github.com/mulesoft/api-console/archive/release/4.0.0.zip',
        dest: workingDir,
        raml: api,
        verbose: false,
        useJson: true
      });
    });

    it('Build dir should be created', function() {
      return fs.pathExists(workingDir)
      .then((exists) => {
        assert.isTrue(exists, 'Build exists');
      });
    });

    it('api.json file should be created', function() {
      return fs.pathExists(path.join(workingDir, 'api.json'))
      .then((exists) => {
        assert.isTrue(exists, 'api.json do not exists');
      });
    });

    it('Import links in index.html file are resolved', function() {
      return testHelper.countImportLinksfromFile(path.join(workingDir, 'index.html'))
      .then((links) => {
        assert.lengthOf(links, 0);
      });
    });
  });
});
