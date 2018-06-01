'use strict';

const {ApiConsoleProject} = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');

describe('Api console project', function() {
  const workingDir = 'test/test-build';
  const defaultOptions = {
    destination: workingDir,
    api: 'test/test-apis/api-raml-10.raml',
    apiType: 'RAML 1.0',
    verbose: false,
    tagName: '5.0.0-preview'
  };
  const defaultOptionsEmbedded = {
    destination: workingDir,
    api: 'test/test-apis/api-raml-10.raml',
    apiType: 'RAML 1.0',
    verbose: false,
    tagName: '5.0.0-preview',
    embedded: true
  };

  const customLogger = {
    info: function() {},
    log: function() {},
    warn: function() {},
    error: function() {}
  };

  describe('constructor', () => {
    it('Sets opts property', () => {
      const project = new ApiConsoleProject(defaultOptions);
      assert.typeOf(project.opts, 'object', 'Is an object');
      assert.equal(project.opts.constructor.name,
        'BuilderOptions', 'Is instance of BuilderOptions');
    });

    it('Sets default logger', () => {
      const project = new ApiConsoleProject(defaultOptions);
      assert.typeOf(project.logger, 'object', 'Is an object');
    });

    it('Uses passed logger', () => {
      const opts = Object.assign({}, defaultOptions);
      opts.logger = customLogger;
      const project = new ApiConsoleProject(opts);
      assert.isTrue(project.logger === customLogger);
    });

    it('Sets startDir', () => {
      const project = new ApiConsoleProject(defaultOptions);
      assert.typeOf(project.startDir, 'string');
    });

    it('Sets workingBuildOutput', () => {
      const project = new ApiConsoleProject(defaultOptions);
      assert.typeOf(project.workingBuildOutput, 'string');
    });

    it('sourceControl returns class instance', () => {
      const project = new ApiConsoleProject(defaultOptions);
      assert.equal(project.sourceControl.constructor.name,
        'SourceControl', 'Is instance of SourceControl');
    });

    it('consoleSources returns class instance', () => {
      const project = new ApiConsoleProject(defaultOptions);
      assert.equal(project.consoleSources.constructor.name,
        'ApiConsoleSources', 'Is instance of ApiConsoleSources');
    });
  });

  describe('_setup()', () => {
    it('Sets buildType property to "model"', () => {
      const project = new ApiConsoleProject(defaultOptions);
      project._setup();
      assert.equal(project.buildType, 'model');
    });

    it('Sets buildType property to "api"', () => {
      const opts = Object.assign({}, defaultOptions);
      opts.withAmf = true;
      const project = new ApiConsoleProject(opts);
      project._setup();
      assert.equal(project.buildType, 'api');
    });

    it('Sets buildType property to "plain"', () => {
      const opts = Object.assign({}, defaultOptions);
      delete opts.api;
      delete opts.apiType;
      const project = new ApiConsoleProject(opts);
      project._setup();
      assert.equal(project.buildType, 'plain');
    });

    it('Sets apiDataFile property to default file', () => {
      const opts = Object.assign({}, defaultOptions);
      delete opts.api;
      delete opts.apiType;
      const project = new ApiConsoleProject(opts);
      project._setup();
      assert.equal(project.apiDataFile, 'api-model.json');
    });

    it('Sets apiDataFile property to api file', () => {
      const opts = Object.assign({}, defaultOptions);
      opts.withAmf = true;
      const project = new ApiConsoleProject(opts);
      project._setup();
      assert.equal(project.apiDataFile, opts.api);
    });

    it('Sets appMainFile property to api-console.html', () => {
      const opts = Object.assign({}, defaultOptions);
      opts.embedded = true;
      const project = new ApiConsoleProject(opts);
      project._setup();
      assert.equal(project.appMainFile, 'api-console.html');
    });

    it('Sets appMainFile property to index.html', () => {
      const project = new ApiConsoleProject(defaultOptions);
      project._setup();
      assert.equal(project.appMainFile, 'index.html');
    });
  });

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
      return project._sourcesToWorkingDirectory();
    });

    it('Should set workingDir property', function() {
      assert.typeOf(project.workingDir, 'string');
    });

    it('Should copy sources to the temp location', function() {
      const consoleFile = path.join(
        project.workingDir, 'index.html');
      return fs.pathExists(consoleFile)
      .then((exists) => {
        assert.isTrue(exists);
      });
    });
  });

  describe('_prepareDependenciesList()', () => {
    it('Adds all dependencies', () => {
      const project = new ApiConsoleProject(defaultOptionsEmbedded);
      const result = project._prepareDependenciesList(false);
      assert.typeOf(result, 'array', 'Returns array');
      assert.isAbove(result.indexOf(
        'advanced-rest-client/oauth-authorization#^2.0.0'), -1,
        'oauth-authorization is set');
      assert.isAbove(result.indexOf(
        'advanced-rest-client/cryptojs-lib'), -1, 'cryptojs-lib is set');
      assert.isAbove(result.indexOf(
        'advanced-rest-client/arc-polyfills'), -1,
        'arc-polyfills is set');
      assert.isAbove(result.indexOf(
        'advanced-rest-client/xhr-simple-request#^2.0.0'), -1,
        'xhr-simple-request is set');
      assert.isAbove(result.indexOf(
        'web-animations/web-animations-js#^2.3'), -1,
        'web-animations-js is set');
    });

    it('Skips cryptojs-lib', () => {
      const opts = Object.assign({}, defaultOptionsEmbedded);
      opts.noCryptoJs = true;
      const project = new ApiConsoleProject(opts);
      const result = project._prepareDependenciesList(false);
      assert.equal(result.indexOf('advanced-rest-client/cryptojs-lib'), -1);
    });

    it('Skips arc-polyfills', () => {
      const opts = Object.assign({}, defaultOptionsEmbedded);
      opts.noJsPolyfills = true;
      const project = new ApiConsoleProject(opts);
      const result = project._prepareDependenciesList(false);
      assert.equal(result.indexOf('advanced-rest-client/arc-polyfills'), -1);
    });

    it('Skips xhr-simple-request', () => {
      const opts = Object.assign({}, defaultOptionsEmbedded);
      opts.noXhr = true;
      const project = new ApiConsoleProject(opts);
      const result = project._prepareDependenciesList(false);
      assert.equal(result.indexOf(
        'advanced-rest-client/xhr-simple-request#^2.0.0'), -1);
    });

    it('Skips web-animations-js', () => {
      const opts = Object.assign({}, defaultOptionsEmbedded);
      opts.noWebAnimations = true;
      const project = new ApiConsoleProject(opts);
      const result = project._prepareDependenciesList(false);
      assert.equal(result.indexOf(
        'web-animations/web-animations-js#^2.3'), -1);
    });

    it('Ignores skips when standalone build', () => {
      const opts = Object.assign({}, defaultOptions);
      opts.noWebAnimations = true;
      opts.noXhr = true;
      opts.noJsPolyfills = true;
      opts.noCryptoJs = true;
      const project = new ApiConsoleProject(opts);
      const result = project._prepareDependenciesList(true);
      assert.isAbove(result.indexOf(
        'advanced-rest-client/cryptojs-lib'), -1, 'cryptojs-lib is set');
      assert.isAbove(result.indexOf(
        'advanced-rest-client/arc-polyfills'), -1,
        'arc-polyfills is set');
      assert.isAbove(result.indexOf(
        'advanced-rest-client/xhr-simple-request#^2.0.0'), -1,
        'xhr-simple-request is set');
      assert.isAbove(result.indexOf(
        'web-animations/web-animations-js#^2.3'), -1,
        'web-animations-js is set');
    });
  });

  describe('_manageDependencies()', function() {
    this.timeout(300000); // bower may need a while.

    let project;
    before(() => {
      const opts = Object.assign({}, defaultOptions);
      project = new ApiConsoleProject(opts);
      return project._sourcesToWorkingDirectory();
    });

    after(function() {
      return fs.remove(workingDir);
    });

    it('Installs dependencies', function() {
      return project._manageDependencies();
    });

    it('Installs bower_components', function() {
      const consoleFile = path.join(
        project.workingDir, 'bower_components');
      return fs.pathExists(consoleFile)
      .then((exists) => assert.isTrue(exists));
    });

    [
      'oauth-authorization',
      'cryptojs-lib',
      'arc-polyfills',
      'xhr-simple-request',
      'web-animations-js'
    ].forEach((lib) => {
      it(`Installs optional ${lib}`, () => {
        const loc = path.join(project.workingDir, 'bower_components', lib);
        return fs.pathExists(loc)
        .then((exists) => assert.isTrue(exists));
      });
    });
  });

  describe('_prebuildTemplates()', function() {
    this.timeout(300000);
    let project;
    before(function() {
      const options = Object.assign({}, defaultOptions);
      project = new ApiConsoleProject(options);
      project._setup();
      return project._sourcesToWorkingDirectory()
      .then(() => project._manageDependencies())
      .then(() => project._setApi());
    });

    after(function() {
      return fs.remove(workingDir);
    });

    it('Should copy templates', function() {
      return project._prebuildTemplates();
    });

    it('Template is copied', function() {
      const consoleFile = path.join(project.workingDir, 'index.html');
      return fs.pathExists(consoleFile)
      .then((exists) => assert.isTrue(exists));
    });
  });
});
