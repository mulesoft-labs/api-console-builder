'use strict';

const {ApiConsoleBuilder} = require('../lib/builder.js');
const {BuilderOptions} = require('../lib/builder-options');
const assert = require('chai').assert;

describe('api-console-builder', () => {
  describe('Optimization options', () => {
    describe('Optimization disabled', () => {
      let builder;
      before(function() {
        const options = new BuilderOptions({
          noOptimization: true
        });
        builder = new ApiConsoleBuilder(options);
        builder.setOptymisationConditions();
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
      let builder;
      before(function() {
        const options = new BuilderOptions({});
        builder = new ApiConsoleBuilder(options);
        builder.setOptymisationConditions();
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
      let builder;
      before(function() {
        const options = new BuilderOptions({
          noCssOptimization: true
        });
        builder = new ApiConsoleBuilder(options);
        builder.setOptymisationConditions();
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
      let builder;
      before(function() {
        const options = new BuilderOptions({
          noHtmlOptimization: true
        });
        builder = new ApiConsoleBuilder(options);
        builder.setOptymisationConditions();
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
      let builder;
      before(function() {
        const options = new BuilderOptions({
          noJsOptimization: true
        });
        builder = new ApiConsoleBuilder(options);
        builder.setOptymisationConditions();
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
