'use strict';

const {BuilderOptions} = require('../lib/builder-options.js');
const assert = require('chai').assert;

describe('builder-options', () => {
  describe('findAttribute()', () => {
    let options;

    const opts = {
      attributes: [
        'test',
        'other-test',
        {
          'attr-with-value': 'value',
          'second-value': 'test-value'
        },
        'third-test',
        {
          'other-object': 'other-value',
          'second-value': 'error'
        }
      ]
    };

    before(function() {
      options = new BuilderOptions();
    });

    it('Should find a boolean attribute', function() {
      const result = options.findAttribute('test', opts);
      assert.ok(result);
    });

    it('Boolean attribute is a string', function() {
      const result = options.findAttribute('test', opts);
      assert.typeOf(result, 'string');
    });

    it('Should find other boolean attribute', function() {
      const result = options.findAttribute('third-test', opts);
      assert.ok(result);
    });

    it('Should find third boolean attribute', function() {
      const result = options.findAttribute('other-test', opts);
      assert.ok(result);
    });

    it('Should find attribute with value', function() {
      const result = options.findAttribute('attr-with-value', opts);
      assert.ok(result);
    });

    it('Attribute with value is an object', function() {
      const result = options.findAttribute('attr-with-value', opts);
      assert.typeOf(result, 'object');
    });

    it('Attribute with value contains a name property', function() {
      const result = options.findAttribute('attr-with-value', opts);
      assert.equal(result.name, 'attr-with-value');
    });

    it('Attribute with value contains a value property', function() {
      const result = options.findAttribute('attr-with-value', opts);
      assert.equal(result.value, 'value');
    });

    it('Should find attribute with value in map', function() {
      const result = options.findAttribute('second-value', opts);
      assert.ok(result);
    });

    it('Should find only firs matching attribute', function() {
      const result = options.findAttribute('second-value', opts);
      assert.equal(result.value, 'test-value');
    });

    it('Should return undefined for unknown attribute', function() {
      const result = options.findAttribute('unknown', opts);
      assert.isUndefined(result);
    });

    it('Should return undefined if unknown without passing options', function() {
      const result = options.findAttribute('unknown');
      assert.isUndefined(result);
    });

    it('Should find attribute from self instance', function() {
      options = new BuilderOptions(opts);
      const result = options.findAttribute('test');
      assert.ok(result);
    });
  });

  describe('validateOptions()', () => {
    let options;

    describe('_validateOptionsList()', () => {
      beforeEach(function() {
        options = new BuilderOptions();
      });

      it('Should pass a known option', function() {
        options._validateOptionsList({
          tagVersion: 'test'
        });
        assert.isTrue(options.isValid);
      });

      it('Should not pass a unknown option', function() {
        options._validateOptionsList({
          test: 'test'
        });
        assert.isFalse(options.isValid);
      });
    });

    describe('_validateCompilerLevel()', () => {
      beforeEach(function() {
        options = new BuilderOptions();
      });

      it('Should pass valid option', function() {
        options._validateCompilerLevel({
          jsCompilationLevel: 'SIMPLE'
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });

      it('Should warn for ADVANCED option', function() {
        options._validateCompilerLevel({
          jsCompilationLevel: 'ADVANCED'
        });
        assert.lengthOf(options.validationWarnings, 1);
      });

      it('Should not pass invalid option', function() {
        options._validateCompilerLevel({
          jsCompilationLevel: 'test'
        });
        assert.isFalse(options.isValid);
      });

      it('Should warn with noJsOptimization', function() {
        options._validateCompilerLevel({
          jsCompilationLevel: 'SIMPLE',
          noJsOptimization: true
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 1);
      });

      it('Should warn with noOptimization', function() {
        options._validateCompilerLevel({
          jsCompilationLevel: 'SIMPLE',
          noOptimization: true
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 1);
      });
    });

    describe('_validateSourceOptions()', () => {
      beforeEach(function() {
        options = new BuilderOptions();
      });

      it('Should fail for src and tagVersion', function() {
        options._validateSourceOptions({
          src: 'test',
          tagVersion: 'v1'
        });
        assert.isFalse(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });

      it('Should want for sourceIsZip and src not set', function() {
        options._validateSourceOptions({
          sourceIsZip: true
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 1);
      });

      it('Should want for sourceIsZip and tagVersion set', function() {
        options._validateSourceOptions({
          sourceIsZip: true,
          tagVersion: 'v1'
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 2);
      });

      it('Passes valid src', function() {
        options._validateSourceOptions({
          src: 'test'
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });

      it('Passes valid tagVersion', function() {
        options._validateSourceOptions({
          tagVersion: 'test'
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });

      it('Passes valid src and sourceIsZip', function() {
        options._validateSourceOptions({
          src: 'test',
          sourceIsZip: true
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });
    });

    describe('_validateNoCompilationOptions()', () => {
      beforeEach(function() {
        options = new BuilderOptions();
      });

      it('Should pass valid option', function() {
        options._validateNoCompilationOptions({
          noOptimization: true
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });

      it('Should warn about noJsOptimization', function() {
        options._validateNoCompilationOptions({
          noOptimization: true,
          noJsOptimization: true
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 1);
      });

      it('Should warn about noHtmlOptimization', function() {
        options._validateNoCompilationOptions({
          noOptimization: true,
          noHtmlOptimization: true
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 1);
      });

      it('Should warn about noCssOptimization', function() {
        options._validateNoCompilationOptions({
          noOptimization: true,
          noCssOptimization: true
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 1);
      });
    });

    describe('_validateAttributes()', () => {
      beforeEach(function() {
        options = new BuilderOptions();
      });

      it('Should pass when no attributes set', function() {
        options._validateAttributes({});
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });

      it('Should pass when empty array', function() {
        options._validateAttributes({
          attributes: []
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });

      it('Should not pas when not an array', function() {
        options._validateAttributes({
          attributes: 'test'
        });
        assert.isFalse(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });
    });

    describe('_validateApiFileOptions()', () => {
      beforeEach(function() {
        options = new BuilderOptions();
      });

      it('Should pass when no attributes set', function() {
        options._validateApiFileOptions({});
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });

      it('Should pass when json-file is not in the list', function() {
        options._validateApiFileOptions({
          attributes: [{'test': 'test'}]
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });

      it('Should fail if value is not a string', function() {
        options._validateApiFileOptions({
          attributes: [{'json-file': true}]
        });
        assert.isFalse(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });

      it('Should warn when missing useJson property', function() {
        options._validateApiFileOptions({
          attributes: [{'json-file': 'test'}],
          raml: 'test'
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 1);
      });

      it('Should pass when using useJson property', function() {
        options._validateApiFileOptions({
          attributes: [{'json-file': 'test'}],
          raml: 'test',
          useJson: true
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });
    });

    describe('_validateLogger()', () => {
      beforeEach(function() {
        options = new BuilderOptions();
      });

      it('Should set warning for invalid object', function() {
        options._validateLogger({
          logger: {}
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 1);
      });

      it('Should set warning when missing info method', function() {
        options._validateLogger({
          logger: {
            log: function() {},
            warning: function() {},
            error: function() {}
          }
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 1);
      });

      it('Should set warning when missing log method', function() {
        options._validateLogger({
          logger: {
            info: function() {},
            warning: function() {},
            error: function() {}
          }
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 1);
      });

      it('Should set warning when missing warning method', function() {
        options._validateLogger({
          logger: {
            info: function() {},
            log: function() {},
            error: function() {}
          }
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 1);
      });

      it('Should set warning when missing error method', function() {
        options._validateLogger({
          logger: {
            info: function() {},
            log: function() {},
            warning: function() {}
          }
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 1);
      });

      it('Should not set warning when walid', function() {
        options._validateLogger({
          logger: {
            info: function() {},
            log: function() {},
            warning: function() {},
            error: function() {}
          }
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });
    });
  });

  describe('Default options', () => {
    let options;

    before(function() {
      options = new BuilderOptions();
    });

    it('Should not set src default option', function() {
      assert.isUndefined(options.src);
    });

    it('Should not set attributes default option', function() {
      assert.isUndefined(options.attributes);
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

    it('Should set attributes for raml and useJson', function() {
      options = new BuilderOptions({
        raml: 'true',
        useJson: true
      });
      assert.typeOf(options.attributes, 'array');
    });

    it('Added attribute is for json-file', function() {
      options = new BuilderOptions({
        raml: 'true',
        useJson: true
      });
      let attr = options.findAttribute('json-file');
      assert.equal(attr.value, 'api.json');
    });
  });
});
