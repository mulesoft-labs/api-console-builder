'use strict';

const {ApiConsoleProject} = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');

const workingDir = path.join('test', 'api-model-test');
const defaultOptions = {
  destination: workingDir,
  verbose: false,
  tagName: '5.0.0-preview'
};

describe('Model generation', function() {
  [
    ['RAML 1.0', 'test/test-apis/api-raml-10.raml'],
    ['RAML 0.8', 'test/test-apis/api-raml-08.raml'],
    ['OAS 2.0', 'test/test-apis/api-oas-20.yaml'],
    ['OAS 3.0', 'test/test-apis/api-oas-30.yaml']
  ].forEach((item) => {
    describe(item[0], function() {
      const options = Object.assign({
        api: item[1],
        apiType: item[0]
      }, defaultOptions);
      this.timeout(300000);

      before(function() {
        return fs.ensureDir(workingDir);
      });

      after(function() {
        return fs.remove(workingDir);
      });

      it('Sets apiModel property', () => {
        const project = new ApiConsoleProject(options);
        project._setup();
        project.workingDir = workingDir;
        return project._setApi()
        .then(() => assert.typeOf(project.apiModel, 'object'));
      });

      it('Saves model as a file', () => {
        const project = new ApiConsoleProject(options);
        project._setup();
        project.workingDir = workingDir;
        return project._setApi()
        .then(() => fs.pathExists(path.join(workingDir, 'api-model.json')));
      });

      it('_getApiTitle() returns the title', () => {
        const project = new ApiConsoleProject(options);
        project._setup();
        project.workingDir = workingDir;
        return project._setApi()
        .then(() => {
          const result = project._getApiTitle();
          assert.typeOf(result, 'string');
        });
      });
    });
  });
});
