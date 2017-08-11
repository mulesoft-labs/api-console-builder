'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');
const testHelper = require('./content-test-common');
const path = require('path');

describe('api-console-builder', () => {
  const workingDir = 'test/build-plain-raml';
  describe('embedded plain build test', () => {

    before(function() {
      this.timeout(120000);
      return builder({
        noOptimization: true,
        src: 'test/api-console-release-4.0.0.zip',
        sourceIsZip: true,
        dest: workingDir,
        embedded: true,
        verbose: false
      });
    });

    after(function() {
      return fs.remove(workingDir);
    });

    it('Build exists', function() {
      return fs.pathExists(workingDir)
      .then((exists) => {
        assert.isTrue(exists);
      });
    });

    it('import.html exists', function() {
      return fs.pathExists(workingDir + '/import.html')
      .then((exists) => {
        assert.isTrue(exists);
      });
    });

    it('example.html exists', function() {
      return fs.pathExists(workingDir + '/example.html')
      .then((exists) => {
        assert.isTrue(exists);
      });
    });

    it('Import links in import.html file are resolved', function() {
      return testHelper.countImportLinksfromFile(path.join(workingDir, 'import.html'))
      .then((links) => {
        assert.lengthOf(links, 0);
      });
    });
  });
});
