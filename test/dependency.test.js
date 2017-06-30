'use strict';

const {DependencyProcessor} = require('../lib/dependency');
const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');

describe('DependencyProcessor', () => {
  const logger = {
    warn: function() {},
    info: function() {},
    log: function() {}
  };
  const workingDir = 'playground/dependency-test';
  const opts = {
    verbose: true
  };

  describe('checkIsRoot()', () => {
    var processor;
    beforeEach(function() {
      const options = Object.assign({}, opts);
      processor = new DependencyProcessor(options, logger, workingDir);
    });

    it('Returns a boolean value', function() {
      return processor.checkIsRoot()
      .then(result => {
        assert.isBoolean(result);
      });
    });
  });

  describe('_prepareBowerCommand()', () => {
    var processor;
    beforeEach(function() {
      const options = Object.assign({}, opts);
      processor = new DependencyProcessor(options, logger, workingDir);
    });

    it('Should use --allow-root option', function() {
      processor.commandRoot = 'bower';
      processor.runningRoot = true;
      var cmd = processor._prepareBowerCommand('install');
      assert.equal(cmd, 'bower --allow-root install');
    });

    it('Should use --quiet option', function() {
      // processor.runningRoot = true;
      processor.commandRoot = 'bower';
      processor.opts.verbose = false;
      var cmd = processor._prepareBowerCommand('install');
      assert.equal(cmd, 'bower --quiet install');
    });
  });

  describe('isBowerInstalled()', () => {
    var processor;
    beforeEach(function() {
      const options = Object.assign({}, opts);
      processor = new DependencyProcessor(options, logger, workingDir);
      processor.runningRoot = true;
    });

    it('Returns a boolean value', function() {
      return processor.isBowerInstalled()
      .then(result => assert.isBoolean(result));
    });
  });

  describe('_setBowerCommandRoot()', () => {
    var processor;

    beforeEach(function() {
      const options = Object.assign({}, opts);
      processor = new DependencyProcessor(options, logger, workingDir);
    });

    afterEach(function() {
      return fs.remove(workingDir);
    });

    it('Sets a commandRoot variable', function() {
      return processor._setBowerCommandRoot()
      .then(() => {
        assert.isString(processor.commandRoot, 'commandRoot is a string');
        assert.isAbove(processor.commandRoot.indexOf('bower'), -1, 'Contains bower');
      });
    });
  });

  describe('hasBower()', () => {
    var processor;
    const bowerFile = path.join(workingDir, 'bower.json');

    beforeEach(function() {
      const options = Object.assign({}, opts);
      processor = new DependencyProcessor(options, logger, workingDir);
      processor.runningRoot = true;
      return fs.ensureDir(workingDir);
    });

    afterEach(function() {
      return fs.remove(workingDir);
    });

    it('Should return false', function() {
      return processor.hasBower()
      .then(result => assert.isFalse(result));
    });

    it('Should return true', function() {
      return fs.writeJson(bowerFile, {name: 'test'})
      .then(() => processor.hasBower())
      .then(result => assert.isTrue(result));
    });
  });

  describe('_processDependencies()', () => {
    var processor;
    const bowerFile = path.join(workingDir, 'bower.json');
    const bowerContent = {
      name: 'test',
      description: 'test',
      version: '0.0.1',
      license: 'Apache-2.0 OR CC-BY-4.0',
      authors: [
        'The Advanced REST client authors <arc@mulesoft.com>'
      ],
      dependencies: {
        'arc-polyfills': 'advanced-rest-client/arc-polyfills#^0.1.3'
      }
    };

    function finishTest(files) {
      var promise = [];
      if (files instanceof Array) {
        let list = files.map((file) => fs.pathExists(file));
        promise = Promise.all(list);
      } else {
        promise = fs.pathExists(files);
      }
      return promise
      .then((result) => {
        if (result instanceof Array) {
          result = result.some((item) => item === false);
          assert.isFalse(result);
        } else {
          assert.isTrue(result);
        }
      });
    }

    beforeEach(function() {
      const options = Object.assign({}, opts);
      processor = new DependencyProcessor(options, logger, workingDir);
      processor.runningRoot = true;
      return fs.ensureDir(workingDir);
    });

    afterEach(function() {
      return fs.remove(workingDir);
    });

    it('Should install basic dependencies dependencies', function() {
      this.timeout(30000);
      processor.opts.embedded = true;
      return fs.writeJson(bowerFile, bowerContent)
      .then(() => processor._processDependencies())
      .then(() => {
        return finishTest([
          path.join(workingDir, 'bower_components'),
          path.join(workingDir, 'bower_components', 'arc-polyfills')
        ]);
      })
      .then(() => {
        return fs.pathExists(path.join(workingDir, 'bower_components', 'app-route'));
      })
      .then((result) => {
        assert.isFalse(result);
      });
    });

    it('Should install basic dependencies with app-route', function() {
      this.timeout(30000);
      return fs.writeJson(bowerFile, bowerContent)
      .then(() => processor._processDependencies())
      .then(() => {
        return finishTest([
          path.join(workingDir, 'bower_components'),
          path.join(workingDir, 'bower_components', 'arc-polyfills'),
          path.join(workingDir, 'bower_components', 'app-route')
        ]);
      });
    });

    it('Should install basic dependencies with RAML parser', function() {
      this.timeout(30000);
      processor.opts.embedded = true;
      processor.opts.raml = 'file';
      return fs.writeJson(bowerFile, bowerContent)
      .then(() => processor._processDependencies())
      .then(() => {
        return finishTest([
          path.join(workingDir, 'bower_components'),
          path.join(workingDir, 'bower_components', 'raml-js-parser'),
          path.join(workingDir, 'bower_components', 'raml-json-enhance')
        ]);
      });
    });
  });
});
