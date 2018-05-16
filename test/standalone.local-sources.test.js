'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');
const testHelper = require('./content-test-common');
const path = require('path');

describe('api-console-builder', () => {
  const workingDir = 'test/standalone-local-sources-test';
  describe('standalone-local-sources', () => {
    after(function() {
      return fs.remove(workingDir);
    });

    it('Build the console', function() {
      this.timeout(270000);
      return builder({
        noOptimization: true,
        src: 'test/api-console-4.2.1.zip',
        dest: workingDir,
        raml: 'test/api.raml',
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
      this.timeout(10000);
      return testHelper.countImportLinksfromFile(
        path.join(workingDir, 'index.html'))
      .then((links) => {
        assert.lengthOf(links, 0);
      });
    });
  });
});
