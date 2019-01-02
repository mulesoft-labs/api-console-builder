'use strict';

const {BuilderOptions} = require('../lib/builder-options.js');
const assert = require('chai').assert;

describe('builder-options', () => {
  describe('validateOptions()', () => {
    let options;

    describe('_validateOptionsList()', () => {
      beforeEach(function() {
        options = new BuilderOptions({
          tagName: '5.0.0'
        });
      });

      it('Should pass a known option', function() {
        options._validateOptionsList({
          tagName: 'test'
        });
        assert.isTrue(options.isValid);
      });

      it('Should not pass a unknown option', function() {
        options._validateOptionsList({
          test: 'test'
        });
        assert.isFalse(options.isValid);
      });

      it('Returns plural version for unknown options', function() {
        options._validateOptionsList({
          test: 'test',
          other: 'value'
        });
        assert.equal(options.validationErrors[0], 'Unknown options: test, other');
      });

      it('Adds error messages for type missmatch', function() {
        options._validateOptionsList({
          tagName: 5
        });
        assert.equal(options.validationErrors[0], 'Property tagName expected to be string but found number.');
      });

      it('Passes no user options', () => {
        options.validateOptions();
        assert.isTrue(options.isValid);
      });
    });

    describe('_validateEmbeddableOptions()', () => {
      let opts;
      beforeEach(function() {
        options = new BuilderOptions();
        opts = {
          embedded: false
        };
      });

      it('Adds warning when embedded and attributes combined', () => {
        opts.embedded = true;
        opts.attributes = [{}];
        options._validateEmbeddableOptions(opts);
        assert.equal(options.validationWarnings[0], 'Illigal attributes option when embedded is set.');
      });

      it('Sets "attributes" undefined', () => {
        opts.embedded = true;
        opts.attributes = [{}];
        options._validateEmbeddableOptions(opts);
        assert.isUndefined(opts.attributes);
      });

      ['noOauth', 'noCryptoJs', 'noJsPolyfills', 'noXhr'].forEach((prop) => {
        it(`Sets warning when standalone and ${prop}`, () => {
          opts[prop] = true;
          options._validateEmbeddableOptions(opts);
          assert.typeOf(options.validationWarnings[0], 'string');
        });

        it('Sets noOauth to false', () => {
          opts[prop] = true;
          options._validateEmbeddableOptions(opts);
          assert.isFalse(opts[prop]);
        });
      });
    });

    describe('_validateConsoleSource()', () => {
      beforeEach(function() {
        options = new BuilderOptions({
          tagName: '5.0.0'
        });
      });

      it('Should fail for local and tagName', function() {
        options._validateConsoleSource({
          local: 'test',
          tagName: 'v1'
        });
        assert.isFalse(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });

      it('Passes valid src', function() {
        options._validateConsoleSource({
          local: 'test'
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });

      it('Passes valid tagName', function() {
        options._validateConsoleSource({
          tagName: 'test'
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });
    });

    describe('_validateLogger()', () => {
      beforeEach(function() {
        options = new BuilderOptions({
          tagName: '5.0.0'
        });
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
            warn: function() {},
            error: function() {}
          }
        });
        assert.isTrue(options.isValid);
        assert.lengthOf(options.validationWarnings, 0);
      });
    });
  });

  describe('API options', () => {
    it('Validates when no API options', function() {
      const options = new BuilderOptions({
        tagName: '5.0.0'
      });
      assert.lengthOf(options.validationErrors, 0);
    });

    it('Validates when all API options', function() {
      const options = new BuilderOptions({
        tagName: '5.0.0',
        api: 'api.raml',
        apiType: 'RAML 1.0'
      });
      assert.lengthOf(options.validationErrors, 0);
    });

    it('Error when "api" is missing', function() {
      const options = new BuilderOptions({
        tagName: '5.0.0',
        apiType: 'RAML 1.0'
      });
      assert.lengthOf(options.validationErrors, 1);
    });

    it('Error when "apiType" is missing', function() {
      const options = new BuilderOptions({
        tagName: '5.0.0',
        api: 'api.raml'
      });
      assert.lengthOf(options.validationErrors, 1);
    });

    it('Error when unsupported "apiType"', function() {
      const options = new BuilderOptions({
        tagName: '5.0.0',
        api: 'api.raml',
        apiType: 'unsuported'
      });
      assert.lengthOf(options.validationErrors, 1);
    });

    it('Validates OAS 2.0 type', function() {
      const options = new BuilderOptions({
        tagName: '5.0.0',
        api: 'api.raml',
        apiType: 'OAS 2.0'
      });
      assert.lengthOf(options.validationErrors, 0);
    });

    it('Validates OAS 3.0 type', function() {
      const options = new BuilderOptions({
        tagName: '5.0.0',
        api: 'api.raml',
        apiType: 'OAS 3.0'
      });
      assert.lengthOf(options.validationErrors, 0);
    });

    it('Validates RAML 0.8 type', function() {
      const options = new BuilderOptions({
        tagName: '5.0.0',
        api: 'api.raml',
        apiType: 'RAML 0.8'
      });
      assert.lengthOf(options.validationErrors, 0);
    });

    it('Validates RAML 1.0 type', function() {
      const options = new BuilderOptions({
        tagName: '5.0.0',
        api: 'api.raml',
        apiType: 'RAML 1.0'
      });
      assert.lengthOf(options.validationErrors, 0);
    });
  });

  describe('Default options', () => {
    let options;

    before(function() {
      options = new BuilderOptions();
    });

    it('Should not set local default option', function() {
      assert.isUndefined(options.local);
    });

    it('Should not set attributes default option', function() {
      assert.isUndefined(options.attributes);
    });

    it('Should set destination default option', function() {
      assert.equal(options.destination, 'build');
    });

    it('Should set embedded default option', function() {
      assert.isFalse(options.embedded);
    });

    it('Should set verbose default option', function() {
      assert.isFalse(options.verbose);
    });
  });
});
