'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');

describe('api-console-builder', () => {
  describe('embedded-RAML', () => {

    before(function() {
      this.timeout(270000);
      return builder({
        noOptimization: true,
        src: 'https://github.com/mulesoft/api-console/archive/release/4.0.0.zip',
        dest: 'build',
        raml: 'test/api.raml',
        useJson: true,
        embedded: true,
        verbose: false
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
  });
});
