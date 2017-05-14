'use strict';

const {ApiConsoleBuilderOptions} = require('../lib/api-console-builder-options.js');
const assert = require('chai').assert;

describe('api-console-builder', () => {
  describe('Default options with empty parameters', () => {
    var options;

    before(function() {
      options = new ApiConsoleBuilderOptions();
    });

    it('Should set src default option', function() {
      assert.equal(options.src, './');
    });

    it('Should set dest default option', function() {
      assert.equal(options.dest, 'build');
    });

    it('Should set mainFile default option', function() {
      assert.isUndefined(options.mainFile);
    });

    it('Should set useJson default option', function() {
      assert.isFalse(options.useJson);
    });

    it('Should set inlineJson default option', function() {
      assert.isFalse(options.inlineJson);
    });

    it('Should set sourceIsZip default option', function() {
      assert.isFalse(options.sourceIsZip);
    });

    it('Should set embedded default option', function() {
      assert.isFalse(options.embedded);
    });

    it('Should set verbose default option', function() {
      assert.isFalse(options.verbose);
    });

    it('Should set raml default option', function() {
      assert.isFalse(options.raml);
    });

    it('Should set noTryit default option', function() {
      assert.isFalse(options.noTryit);
    });

    it('Should set narrowView default option', function() {
      assert.isFalse(options.narrowView);
    });

    it('Should set proxy default option', function() {
      assert.isUndefined(options.proxy);
    });

    it('Should set proxyEncodeUrl default option', function() {
      assert.isFalse(options.proxyEncodeUrl);
    });

    it('Should set jsCompilationLevel default option', function() {
      assert.equal(options.jsCompilationLevel, 'WHITESPACE_ONLY');
    });

    it('Should set noOptimization default option', function() {
      assert.isFalse(options.noOptimization);
    });

    it('Should set noCssOptimization default option', function() {
      assert.isFalse(options.noCssOptimization);
    });

    it('Should set noHtmlOptimization default option', function() {
      assert.isFalse(options.noHtmlOptimization);
    });

    it('Should set noJsOptimization default option', function() {
      assert.isFalse(options.noJsOptimization);
    });
  });
});
