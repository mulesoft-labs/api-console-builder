'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');
const testHelper = require('./content-test-common');
const path = require('path');

describe('api-console-builder', () => {
  const workingDir = 'test/standalone-inline-json-test';
  describe('standalone JSON inline test', () => {

    var api = 'https://raw.githubusercontent.com/advanced-rest-client/';
    api += 'raml-example-api/master/api.raml';

    after(function() {
      return fs.remove(workingDir);
    });

    it('Build the console with the inlined json', function() {
      this.timeout(270000);
      return builder({
        noOptimization: true,
        src: 'https://github.com/mulesoft/api-console/archive/v4.2.1.zip',
        dest: workingDir,
        raml: api,
        verbose: false,
        useJson: true,
        inlineJson: true
      });
    });

    it('Build dir should be created', function() {
      return fs.pathExists(workingDir)
      .then((exists) => {
        assert.isTrue(exists, 'Build exists');
      });
    });

    it('api.json file should be created', function() {
      return fs.pathExists(workingDir + '/api.json')
      .then((exists) => {
        assert.isFalse(exists, 'api.json do not exists');
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
