'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');
const testHelper = require('./content-test-common');
const path = require('path');

describe('api-console-builder', () => {
  const workingDir = 'playground/standalone-local-sources-test';
  describe('standalone-local-sources', () => {
    after(function() {
      return fs.remove(workingDir);
    });

    it('Build the console', function() {
      this.timeout(270000);
      return builder({
        noOptimization: true,
        src: 'test/api-console-release-4.0.0.zip',
        dest: workingDir,
        raml: 'test/api.raml',
        sourceIsZip: true,
        useJson: true
      });
    });

    it('Build dir should be created', function() {
      return fs.pathExists(workingDir)
      .then((exists) => {
        assert.isTrue(exists, 'Build exists');
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
