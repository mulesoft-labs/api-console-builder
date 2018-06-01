'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');

const workingDir = path.join('test', 'standalone-test');

/*
 * API types and file creation is tested in different suite.
 * This only checks if standalone version is being build.
 *
 * Timeout is hight because API console is a huge project containing almost
 * hundred of different component. Polymer analyzer and then optimization
 * just takes time.
 */

describe('Standalone with API - remote sources', () => {
  after(function() {
    return fs.remove(workingDir);
  });

  it('Builds the console', function() {
    this.timeout(270000);
    return builder({
      tagName: '5.0.0-preview',
      destination: workingDir,
      api: 'test/test-apis/api-raml-10.raml',
      apiType: 'RAML 1.0'
    });
  });

  it('Creates API console bundles', () => {
    const es6path = path.join(workingDir, 'es6-bundle');
    const es5path = path.join(workingDir, 'es5-bundle');
    return fs.pathExists(es6path)
    .then((exists) => assert.isTrue(exists, 'es6-bundle exists'))
    .then(() => fs.pathExists(es5path))
    .then((exists) => assert.isTrue(exists, 'es5-bundle exists'));
  });

  it('Created required files in es6-bundle', () => {
    const es6path = path.join(workingDir, 'es6-bundle');
    return fs.pathExists(path.join(es6path, 'api-model.json'))
    .then((exists) => assert.isTrue(exists, 'Model file exists'))
    .then(() => fs.pathExists(path.join(es6path, 'index.html')))
    .then((exists) => assert.isTrue(
      exists, 'Console entry point file exists'))
    .then(() => fs.pathExists(path.join(es6path, 'bower_components')))
    .then((exists) => assert.isTrue(exists, 'bower_components exists'));
  });

  it('Created required files in es5-bundle', () => {
    const es6path = path.join(workingDir, 'es5-bundle');
    return fs.pathExists(path.join(es6path, 'api-model.json'))
    .then((exists) => assert.isTrue(exists, 'Model file exists'))
    .then(() => fs.pathExists(path.join(es6path, 'index.html')))
    .then((exists) => assert.isTrue(
      exists, 'Console entry point file exists'))
    .then(() => fs.pathExists(path.join(es6path, 'bower_components')))
    .then((exists) => assert.isTrue(exists, 'bower_components exists'));
  });
});

describe('Standalone withouth API - local sources', () => {
  after(function() {
    return fs.remove(workingDir);
  });

  it('Builds the console', function() {
    this.timeout(270000);
    return builder({
      local: 'test/api-console-5.0.0-preview.zip',
      destination: workingDir
    });
  });

  it('Creates API console bundles', () => {
    const es6path = path.join(workingDir, 'es6-bundle');
    const es5path = path.join(workingDir, 'es5-bundle');
    return fs.pathExists(es6path)
    .then((exists) => assert.isTrue(exists, 'es6-bundle exists'))
    .then(() => fs.pathExists(es5path))
    .then((exists) => assert.isTrue(exists, 'es5-bundle exists'));
  });

  it('Created required files in es6-bundle', () => {
    const es6path = path.join(workingDir, 'es6-bundle');
    return fs.pathExists(path.join(es6path, 'api-model.json'))
    .then((exists) => assert.isFalse(exists, 'Model file does not exist'))
    .then(() => fs.pathExists(path.join(es6path, 'index.html')))
    .then((exists) => assert.isTrue(
      exists, 'Console entry point file exists'))
    .then(() => fs.pathExists(path.join(es6path, 'bower_components')))
    .then((exists) => assert.isTrue(exists, 'bower_components exists'));
  });

  it('Creates required files in es5-bundle', () => {
    const es6path = path.join(workingDir, 'es5-bundle');
    return fs.pathExists(path.join(es6path, 'api-model.json'))
    .then((exists) => assert.isFalse(exists, 'Model file does not exist'))
    .then(() => fs.pathExists(path.join(es6path, 'index.html')))
    .then((exists) => assert.isTrue(
      exists, 'Console entry point file exists'))
    .then(() => fs.pathExists(path.join(es6path, 'bower_components')))
    .then((exists) => assert.isTrue(exists, 'bower_components exists'));
  });
});
