'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');

describe('api-console-builder', () => {
  describe('embedded-json', () => {

    before(function() {
      this.timeout(120000);
      return builder({
        noOptimization: true,
        src: 'test/api-console-release-4.0.0.zip',
        sourceIsZip: true,
        dest: 'build',
        raml: 'test/api.raml',
        embedded: true,
        verbose: false,
        useJson: true
      });
    });

    after(function() {
      return fs.remove('build');
    });

    it('Build exists', function() {
      return fs.pathExists('build')
      .then((exists) => {
        assert.isTrue(exists);
      });
    });
    it('import.html exists', function() {
      return fs.pathExists('build/import.html')
      .then((exists) => {
        assert.isTrue(exists);
      });
    });
    it('example.html exists', function() {
      return fs.pathExists('build/example.html')
      .then((exists) => {
        assert.isTrue(exists);
      });
    });
    it('api.json do not exists', function() {
      return fs.pathExists('build/api.json')
      .then((exists) => {
        assert.isTrue(exists);
      });
    });
  });
});
