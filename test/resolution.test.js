'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');
const testHelper = require('./content-test-common');

describe('resolution.test.js', () => {
  const workingDir = 'playground/resolutions-test';
  describe('Imports resolutions', () => {
    var content;
    before(function() {
      this.timeout(270000);
      return builder({
        noJsOptimization: false,
        src: 'test/api-console-release-4.0.0.zip',
        sourceIsZip: true,
        dest: workingDir,
        raml: 'test/api.raml',
        verbose: true,
        useJson: true,
        inlineJson: true
      })
      .then(() => fs.readFile(workingDir + '/index.html', 'utf8'))
      .then((data) => {
        content = data;
      });
    });

    after(function() {
      return fs.remove(workingDir);
    });

    it('All imports are resolved', function() {
      var links = testHelper.countImportLinks(content);
      assert.lengthOf(links, 0);
    });
  });
});
