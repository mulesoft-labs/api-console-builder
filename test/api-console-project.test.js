'use strict';

const {ApiConsoleProject} = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');

describe('Api console project', function() {
  const workingDir = 'test/attributes-test-build';
  const defaultOptions = {
    noOptimization: true,
    // src: 'test/api-console-4.2.1.zip',
    dest: workingDir,
    raml: 'test/api.raml',
    verbose: false,
    tagVersion: 'v4.2.1',
    majorRelease: 4
  };

  describe('_sourcesToWorkingDirectory()', function() {
    this.timeout(10000);
    let project;
    before(function() {
      const options = Object.assign({}, defaultOptions);
      project = new ApiConsoleProject(options);
    });

    after(function() {
      return fs.remove(workingDir);
    });

    it('Should copy sources to temp location', function() {
      return project.proxy._sourcesToWorkingDirectory();
    });

    it('Should set workingDir property', function() {
      assert.typeOf(project.proxy.workingDir, 'string');
    });

    it('Should copy sources to the temp location', function() {
      const consoleFile = path.join(
        project.proxy.workingDir, 'api-console.html');
      return fs.pathExists(consoleFile)
      .then((exists) => {
        assert.isTrue(exists);
      });
    });
  });

  describe('_manageDependencies()', function() {
    this.timeout(300000); // bower may need a while.
    let project;
    before(function() {
      const options = Object.assign({}, defaultOptions);
      // options.verbose = true;
      project = new ApiConsoleProject(options);
      return project.proxy._sourcesToWorkingDirectory();
    });

    after(function() {
      return fs.remove(workingDir);
    });

    it('Should install dependencies', function() {
      return project.proxy._manageDependencies();
    });

    it('Should install bower components', function() {
      const consoleFile = path.join(
        project.proxy.workingDir, 'bower_components');
      return fs.pathExists(consoleFile)
      .then((exists) => {
        assert.isTrue(exists);
      });
    });

    it('Compies console sources to bower components', function() {
      const consoleFile = path.join(
        project.proxy.workingDir,
        'bower_components',
        'api-console');
      return fs.pathExists(consoleFile)
      .then((exists) => {
        assert.isTrue(exists);
      });
    });
  });

  describe('_prebuildTemplates()', function() {
    this.timeout(300000);
    let project;
    before(function() {
      const options = Object.assign({}, defaultOptions);
      project = new ApiConsoleProject(options);
      return project.proxy._sourcesToWorkingDirectory()
      .then(() => project.proxy._manageDependencies());
    });

    after(function() {
      return fs.remove(workingDir);
    });

    it('Should copy templates', function() {
      return project.proxy._prebuildTemplates();
    });

    it('Should set mainFile in options', function() {
      assert.typeOf(project.proxy.opts.mainFile, 'string');
    });

    it('Template is copied', function() {
      const consoleFile = path.join(
        project.proxy.workingDir, project.proxy.opts.mainFile);
      return fs.pathExists(consoleFile)
      .then((exists) => {
        assert.isTrue(exists);
      });
    });
  });

  describe('_setRaml()', function() {
    this.timeout(300000);
    let project;
    before(function() {
      const options = Object.assign({}, defaultOptions);
      project = new ApiConsoleProject(options);
      return project.proxy._sourcesToWorkingDirectory();
    });

    it('Should parse raml', function() {
      return project.proxy._setRaml();
    });

    it('Should set raml property', function() {
      assert.typeOf(project.proxy.raml, 'object');
    });
  });
});
