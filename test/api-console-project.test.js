'use strict';

const {ApiConsoleProject} = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');

describe('Api console project', () => {
  const workingDir = 'test/playground/attributes-test-build';
  const defaultOptions = {
    noOptimization: false,
    src: 'test/api-console-release-4.0.0.zip',
    dest: workingDir,
    raml: 'test/api.raml',
    sourceIsZip: true,
    verbose: false
  };

  describe('_sourcesToWorkingDirectory()', () => {
    var project;
    before(function() {
      const options = Object.assign({}, defaultOptions);
      project = new ApiConsoleProject(options);
    });

    after(function() {
      return fs.remove(workingDir);
    });

    it('Should copy sorces to temp location', function() {
      return project._sourcesToWorkingDirectory();
    });

    it('Should set workingDir property', function() {
      assert.typeOf(project.workingDir, 'string');
    });

    it('Should copy sources to the temp location', function() {
      var consoleFile = path.join(project.workingDir, 'api-console.html');
      return fs.pathExists(consoleFile)
      .then(exists => {
        assert.isTrue(exists);
      });
    });
  });

  describe('_manageDependencies()', () => {
    var project;
    before(function() {
      const options = Object.assign({}, defaultOptions);
      project = new ApiConsoleProject(options);
      return project._sourcesToWorkingDirectory();
    });

    after(function() {
      return fs.remove(workingDir);
    });

    it('Should install dependencies', function() {
      this.timeout(45000); // bower may need a while.
      return project._manageDependencies();
    });

    it('Should install bower components', function() {
      var consoleFile = path.join(project.workingDir, 'bower_components');
      return fs.pathExists(consoleFile)
      .then(exists => {
        assert.isTrue(exists);
      });
    });

    it('Should not copy console\'s sources to  bower components', function() {
      var consoleFile = path.join(project.workingDir, 'bower_components', 'api-console');
      return fs.pathExists(consoleFile)
      .then(exists => {
        assert.isTrue(exists);
      });
    });
  });

  describe('_prebuildTemplates()', () => {
    var project;
    before(function() {
      this.timeout(45000);
      const options = Object.assign({}, defaultOptions);
      project = new ApiConsoleProject(options);
      return project._sourcesToWorkingDirectory()
      .then(() => project._manageDependencies());
    });

    after(function() {
      return fs.remove(workingDir);
    });

    it('Should copy templates', function() {
      return project._prebuildTemplates();
    });

    it('Should set mainFile in options', function() {
      assert.typeOf(project.opts.mainFile, 'string');
    });

    it('Template is copied', function() {
      var consoleFile = path.join(project.workingDir, project.opts.mainFile);
      return fs.pathExists(consoleFile)
      .then(exists => {
        assert.isTrue(exists);
      });
    });
  });

  describe('_setRaml()', () => {
    var project;
    before(function() {
      this.timeout(15000);
      const options = Object.assign({}, defaultOptions);
      project = new ApiConsoleProject(options);
      return project._sourcesToWorkingDirectory();
    });

    it('Should parse raml', function() {
      return project._setRaml();
    });

    it('Should set raml property', function() {
      assert.typeOf(project.raml, 'object');
    });
  });
});
