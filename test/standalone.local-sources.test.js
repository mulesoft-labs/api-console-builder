'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');

describe('api-console-builder', () => {
  describe('using local sources', () => {
    afterEach(function(done) {
      fs.remove('build')
      .then(() => {
        done();
      });
    });

    it('Build the console', function() {
      this.timeout(120000);
      return builder({
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
