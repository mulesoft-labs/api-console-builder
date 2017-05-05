'use strict';

const {ApiConsoleBuilder} = require('../lib/api-console-builder.js');
const {ApiConsoleBuilderOptions} = require('../lib/api-console-builder-options.js');
const assert = require('chai').assert;

describe('api-console-builder', () => {
  describe('Optimisation options', () => {
    describe('Optimisation disabled', () => {
      var builder;
      before(function() {
        const options = new ApiConsoleBuilderOptions({
          noOptimisation: true
        });
        builder = new ApiConsoleBuilder(options);
        builder._setOptymisationConditions();
      });

      it('Should set no comment optimisation', function() {
        assert.isFalse(builder._optConditions.commenets);
      });

      it('Should set no html optimisation', function() {
        assert.isFalse(builder._optConditions.html);
      });

      it('Should set no js optimisation', function() {
        assert.isFalse(builder._optConditions.js);
      });

      it('Should set no css files optimisation', function() {
        assert.isFalse(builder._optConditions.css);
      });

      it('Should set no html style optimisation', function() {
        assert.isFalse(builder._optConditions.styles);
      });
    });

    describe('Optimisation enabled', () => {
      var builder;
      before(function() {
        const options = new ApiConsoleBuilderOptions({});
        builder = new ApiConsoleBuilder(options);
        builder._setOptymisationConditions();
      });

      it('Should set no comment optimisation', function() {
        assert.typeOf(builder._optConditions.commenets, 'regexp');
      });

      it('Should set no html optimisation', function() {
        assert.typeOf(builder._optConditions.html, 'regexp');
      });

      it('Should set no js optimisation', function() {
        assert.typeOf(builder._optConditions.js, 'regexp');
      });

      it('Should set no css files optimisation', function() {
        assert.typeOf(builder._optConditions.css, 'regexp');
      });

      it('Should set no html style optimisation', function() {
        assert.typeOf(builder._optConditions.styles, 'regexp');
      });
    });

    describe('CSS optimisation disabled only', () => {
      var builder;
      before(function() {
        const options = new ApiConsoleBuilderOptions({
          noCssOptimisation: true
        });
        builder = new ApiConsoleBuilder(options);
        builder._setOptymisationConditions();
      });

      it('Should set no comment optimisation', function() {
        assert.typeOf(builder._optConditions.commenets, 'regexp');
      });

      it('Should set no html optimisation', function() {
        assert.typeOf(builder._optConditions.html, 'regexp');
      });

      it('Should set no js optimisation', function() {
        assert.typeOf(builder._optConditions.js, 'regexp');
      });

      it('Should set no css files optimisation', function() {
        assert.isFalse(builder._optConditions.css);
      });

      it('Should set no html style optimisation', function() {
        assert.isFalse(builder._optConditions.styles);
      });
    });

    describe('HTML optimisation disabled only', () => {
      var builder;
      before(function() {
        const options = new ApiConsoleBuilderOptions({
          noHtmlOptimisation: true
        });
        builder = new ApiConsoleBuilder(options);
        builder._setOptymisationConditions();
      });

      it('Should set no comment optimisation', function() {
        assert.isFalse(builder._optConditions.commenets);
      });

      it('Should set no html optimisation', function() {
        assert.isFalse(builder._optConditions.html);
      });

      it('Should set no js optimisation', function() {
        assert.typeOf(builder._optConditions.js, 'regexp');
      });

      it('Should set no css files optimisation', function() {
        assert.typeOf(builder._optConditions.css, 'regexp');
      });

      it('Should set no html style optimisation', function() {
        assert.typeOf(builder._optConditions.styles, 'regexp');
      });
    });

    describe('JS optimisation disabled only', () => {
      var builder;
      before(function() {
        const options = new ApiConsoleBuilderOptions({
          noJsOptimisation: true
        });
        builder = new ApiConsoleBuilder(options);
        builder._setOptymisationConditions();
      });

      it('Should set no comment optimisation', function() {
        assert.typeOf(builder._optConditions.commenets, 'regexp');
      });

      it('Should set no html optimisation', function() {
        assert.typeOf(builder._optConditions.html, 'regexp');
      });

      it('Should set no js optimisation', function() {
        assert.isFalse(builder._optConditions.js);
      });

      it('Should set no css files optimisation', function() {
        assert.typeOf(builder._optConditions.css, 'regexp');
      });

      it('Should set no html style optimisation', function() {
        assert.typeOf(builder._optConditions.styles, 'regexp');
      });
    });
  });
});
