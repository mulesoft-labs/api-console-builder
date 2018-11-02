'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');
const testHelper = require('./content-test-common');
const path = require('path');

describe('api-console-builder', () => {
  const workingDir = 'test/standalone-raml-test';
  describe('standalone-RAML', () => {
    let api = 'https://raw.githubusercontent.com/advanced-rest-client/';
    api += 'raml-example-api/master/api.raml';

    after(function() {
      return fs.remove(workingDir);
    });

    it('Build the console', function() {
      this.timeout(270000);
      return builder({
        noOptimization: true,
        src: 'https://github.com/mulesoft/api-console/archive/v4.2.1.zip',
        dest: workingDir,
        raml: api,
        verbose: false
      });
    });

    it('Build dir should be created', function() {
      return fs.pathExists(workingDir)
      .then((exists) => {
        assert.isTrue(exists, 'Build exists');
      });
    });

    it('Has the main file', function() {
      return fs.pathExists(path.join(workingDir, 'index.html'))
      .then((exists) => {
        assert.isTrue(exists);
      });
    });

    it('Import links in index.html file are resolved', function() {
      this.timeout(10000);
      return testHelper.countImportLinksfromFile(path.join(workingDir, 'index.html'))
      .then((links) => {
        assert.lengthOf(links, 0);
      });
    });
  });
});
