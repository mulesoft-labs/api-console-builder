'use strict';

const {ApiConsoleBuilder} = require('../lib/api-console-builder.js');
const {ApiConsoleBuilderOptions} = require('../lib/api-console-builder-options.js');
const assert = require('chai').assert;

describe('api-console-builder', () => {
  describe('Optimization options', () => {
    describe('Optimization disabled', () => {
      var builder;
      before(function() {
        const options = new ApiConsoleBuilderOptions({
          noOptimization: true
        });
        builder = new ApiConsoleBuilder(options);
        builder._setOptymisationConditions();
      });

      it('Should set no comment optimization', function() {
        assert.isFalse(builder._optConditions.commenets);
      });

      it('Should set no html optimization', function() {
        assert.isFalse(builder._optConditions.html);
      });

      it('Should set no js optimization', function() {
        assert.isFalse(builder._optConditions.js);
      });

      it('Should set no css files optimization', function() {
        assert.isFalse(builder._optConditions.css);
      });

      it('Should set no html style optimization', function() {
        assert.isFalse(builder._optConditions.styles);
      });
    });

    describe('Optimization enabled', () => {
      var builder;
      before(function() {
        const options = new ApiConsoleBuilderOptions({});
        builder = new ApiConsoleBuilder(options);
        builder._setOptymisationConditions();
      });

      it('Should set no comment optimization', function() {
        assert.typeOf(builder._optConditions.commenets, 'regexp');
      });

      it('Should set no html optimization', function() {
        assert.typeOf(builder._optConditions.html, 'regexp');
      });

      it('Should set no js optimization', function() {
        assert.typeOf(builder._optConditions.js, 'regexp');
      });

      it('Should set no css files optimization', function() {
        assert.typeOf(builder._optConditions.css, 'regexp');
      });

      it('Should set no html style optimization', function() {
        assert.typeOf(builder._optConditions.styles, 'regexp');
      });
    });

    describe('CSS optimization disabled only', () => {
      var builder;
      before(function() {
        const options = new ApiConsoleBuilderOptions({
          noCssOptimization: true
        });
        builder = new ApiConsoleBuilder(options);
        builder._setOptymisationConditions();
      });

      it('Should set no comment optimization', function() {
        assert.typeOf(builder._optConditions.commenets, 'regexp');
      });

      it('Should set no html optimization', function() {
        assert.typeOf(builder._optConditions.html, 'regexp');
      });

      it('Should set no js optimization', function() {
        assert.typeOf(builder._optConditions.js, 'regexp');
      });

      it('Should set no css files optimization', function() {
        assert.isFalse(builder._optConditions.css);
      });

      it('Should set no html style optimization', function() {
        assert.isFalse(builder._optConditions.styles);
      });
    });

    describe('HTML optimization disabled only', () => {
      var builder;
      before(function() {
        const options = new ApiConsoleBuilderOptions({
          noHtmlOptimization: true
        });
        builder = new ApiConsoleBuilder(options);
        builder._setOptymisationConditions();
      });

      it('Should set no comment optimization', function() {
        assert.isFalse(builder._optConditions.commenets);
      });

      it('Should set no html optimization', function() {
        assert.isFalse(builder._optConditions.html);
      });

      it('Should set no js optimization', function() {
        assert.typeOf(builder._optConditions.js, 'regexp');
      });

      it('Should set no css files optimization', function() {
        assert.typeOf(builder._optConditions.css, 'regexp');
      });

      it('Should set no html style optimization', function() {
        assert.typeOf(builder._optConditions.styles, 'regexp');
      });
    });

    describe('JS optimization disabled only', () => {
      var builder;
      before(function() {
        const options = new ApiConsoleBuilderOptions({
          noJsOptimization: true
        });
        builder = new ApiConsoleBuilder(options);
        builder._setOptymisationConditions();
      });

      it('Should set no comment optimization', function() {
        assert.typeOf(builder._optConditions.commenets, 'regexp');
      });

      it('Should set no html optimization', function() {
        assert.typeOf(builder._optConditions.html, 'regexp');
      });

      it('Should set no js optimization', function() {
        assert.isFalse(builder._optConditions.js);
      });

      it('Should set no css files optimization', function() {
        assert.typeOf(builder._optConditions.css, 'regexp');
      });

      it('Should set no html style optimization', function() {
        assert.typeOf(builder._optConditions.styles, 'regexp');
      });
    });
  });
});
