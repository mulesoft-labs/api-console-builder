'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');

describe('api-console-builder', () => {
  describe('standalone-local-sources', () => {
    afterEach(function() {
      return fs.remove('build');
    });

    it('Build the console', function() {
      this.timeout(270000);
      return builder({
        noOptimization: true,
        src: 'test/api-console-release-4.0.0.zip',
        dest: 'build',
        raml: 'test/api.raml',
        sourceIsZip: true,
        useJson: true
      })
      .then(() => fs.pathExists('build'))
      .then((exists) => {
        assert.isTrue(exists);
      });
    });
  });
});
