'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');
const testHelper = require('./content-test-common');

describe('resolution.test.js', () => {
  const workingDir = 'test/resolutions-test';
  describe('Imports resolutions', () => {
    let content;
    before(function() {
      this.timeout(350000);
      return builder({
        noJsOptimization: false,
        src: 'test/api-console-4.2.1.zip',
        dest: workingDir,
        raml: 'test/api.raml',
        verbose: false,
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
      const links = testHelper.countImportLinks(content);
      assert.lengthOf(links, 0);
    });
  });
});
