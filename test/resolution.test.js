'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');

describe('api-console-builder', () => {
  describe('Imports resolutions', () => {
    var content;
    before(function() {
      this.timeout(270000);
      return builder({
        noJsOptimization: true,
        src: 'test/api-console-release-4.0.0.zip',
        sourceIsZip: true,
        dest: 'build',
        raml: 'test/api.raml',
        verbose: false,
        useJson: true,
        inlineJson: true
      })
      .then(() => fs.readFile('build/index.html', 'utf8'))
      .then((data) => {
        content = data;
      });
    });

    after(function() {
      return fs.remove('build');
    });

    it('All imports are resolved', function() {
      // in comments there are examples matching regexp so for this test optimisation must be
      // enabled
      var reg = /<link rel="import" href="[^"]*">/;
      var match = content.match(reg);
      assert.isNull(match);
    });

  });
});
