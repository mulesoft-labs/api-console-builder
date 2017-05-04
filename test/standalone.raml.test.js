'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');

describe('api-console-builder', () => {
  describe('standalone with RAML', () => {

    var api = 'https://raw.githubusercontent.com/advanced-rest-client/';
    api += 'raml-example-api/master/api.raml';

    afterEach(function(done) {
      fs.remove('build')
      .then(() => {
        done();
      });
    });

    it('Build the console', function() {
      this.timeout(120000);
      return builder({
        src: 'https://github.com/mulesoft/api-console/archive/release/4.0.0.zip',
        dest: 'build',
        raml: api
      })
      .then(() => fs.pathExists('build'))
      .then((exists) => {
        assert.isTrue(exists);
      });
    });
  });
});
