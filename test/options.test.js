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

  describe('Default options', () => {
    let options;

    before(function() {
      options = new BuilderOptions({
        tagName: '5.0.0'
      });
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
