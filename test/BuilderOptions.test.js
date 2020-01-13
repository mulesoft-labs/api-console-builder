import { assert } from 'chai';
import sinon from 'sinon';
import { BuilderOptions } from '../lib/BuilderOptions.js';

const baseOptions = {
  api: 'test/api',
  apiType: 'RAML 1.0',
};

describe('BuilderOptions', () => {
  describe('_validateOptionsList()', () => {
    let options;
    beforeEach(function() {
      options = new BuilderOptions({ ...baseOptions });
    });

    it('passes for a known option', function() {
      options._validateOptionsList({
        tagName: 'test'
      });
      assert.isTrue(options.isValid);
    });

    it('does not pass an unknown option', function() {
      options._validateOptionsList({
        test: 'test'
      });
      assert.isFalse(options.isValid);
    });

    it('returns plural version for unknown options', function() {
      options._validateOptionsList({
        test: 'test',
        other: 'value'
      });
      assert.equal(options.validationErrors[0], 'Unknown options: test, other');
    });

    it('adds error messages for type missmatch', function() {
      options._validateOptionsList({
        tagName: 5
      });
      assert.equal(options.validationErrors[0], 'Property tagName expected to be string but found number.');
    });

    // `api` and `apiType` are tested elsewhere
    [
      ['tagName', '6.0.0', true],
      ['destination', 'test/path', 10],
      ['attributes', { a: '123' }, 'test'],
      ['verbose', false, 'true'],
      ['noCache', false, 'true'],
      ['exitOnError', false, 'true'],
      ['strict', false, 'true'],
      ['logger', {}, true],
      ['themeFile', 'index.css', null],
      ['indexFile', 'index.html', null],
      ['appTitle', 'test', false],
      ['apiMediaType', 'application/test', false],
    ].forEach(([name, correct, incorrect]) => {
      it(`passes validation for correct value for ${name}`, () => {
        const opts = { ...baseOptions };
        opts[name] = correct;
        options.validate(opts);
        assert.isTrue(options.isValid);
      });

      it(`fails validation for incorrect value for ${name}`, () => {
        const opts = { ...baseOptions };
        opts[name] = incorrect;
        options.validate(opts);
        assert.isFalse(options.isValid);
      });
    });
  });

  describe('_validateLogger()', () => {
    let options;
    beforeEach(function() {
      options = new BuilderOptions({ ...baseOptions });
    });

    it('sets warning for invalid object', function() {
      options._validateLogger({
        logger: {}
      });
      assert.isTrue(options.isValid);
      assert.lengthOf(options.validationWarnings, 1);
    });

    it('set warning when missing info method', function() {
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

    it('set warning when missing log method', function() {
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

    it('sets warning when missing warning method', function() {
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

    it('sets warning when missing error method', function() {
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

    it('validates when walid', function() {
      options._validateLogger({
        logger: {
          info: function() {},
          log: function() {},
          warn: function() {},
          error: function() {},
        }
      });
      assert.isTrue(options.isValid);
      assert.lengthOf(options.validationWarnings, 0);
    });
  });

  describe('API parsing options', () => {
    it('fails when api is not set', () => {
      const options = new BuilderOptions({
        apiType: 'RAML 1.0',
      });
      assert.lengthOf(options.validationErrors, 1);
    });

    it('fails when apiType is not set', () => {
      const options = new BuilderOptions({
        api: 'api.raml',
      });
      assert.lengthOf(options.validationErrors, 1);
    });

    it('validates when api and apiType are set', () => {
      const options = new BuilderOptions({
        api: 'api.raml',
        apiType: 'RAML 1.0',
      });
      assert.lengthOf(options.validationErrors, 0);
    });

    it('fails for unsupported "apiType"', function() {
      const options = new BuilderOptions({
        api: 'api.raml',
        apiType: 'unsuported'
      });
      assert.lengthOf(options.validationErrors, 1);
    });

    [
      ['RAML 0.8', 'application/raml', 'api.raml'],
      ['RAML 1.0', 'application/raml', 'api.raml'],
      ['OAS 2.0', 'application/yaml', 'api.yaml'],
      ['OAS 3.0', 'application/yaml', 'api.yaml'],
      ['OAS 3.0', 'application/json', 'api.json'],
    ].forEach(([apiType, mime, api]) => {
      it(`validates for ${apiType} with ${mime} type`, () => {
        const options = new BuilderOptions({
          api,
          apiType,
          apiMediaType: mime,
        });
        assert.lengthOf(options.validationErrors, 0);
      });
    });
  });

  describe('_setDefaults()', () => {
    it('sets default destination', () => {
      const options = new BuilderOptions({...baseOptions});
      const result = options._setDefaults({});
      assert.equal(result.destination, 'build');
    });

    it('respects set destination', () => {
      const options = new BuilderOptions({...baseOptions});
      const result = options._setDefaults({
        destination: 'other',
      });
      assert.equal(result.destination, 'other');
    });

    [
      ['verbose', false],
      ['exitOnError', true],
      ['strict', false],
      ['noCache', false],
    ].forEach(([name, defValue]) => {
      it(`sets default ${name}`, () => {
        const options = new BuilderOptions({...baseOptions});
        const result = options._setDefaults({});
        assert.equal(result[name], defValue);
      });

      it(`respects set ${name}`, () => {
        const options = new BuilderOptions({...baseOptions});
        const userOpts = {};
        userOpts[name] = !defValue;
        const result = options._setDefaults(userOpts);
        assert.notEqual(result[name], defValue);
      });
    });
  });

  describe('_validateTagName()', () => {
    let instance;
    beforeEach(function() {
      instance = new BuilderOptions({ ...baseOptions });
    });

    it('passes validation when no tagName', () => {
      instance._validateTagName({});
      assert.lengthOf(instance.validationErrors, 0);
    });

    it('passes validation when minimum version is set', () => {
      instance._validateTagName({
        tagName: '6.0.0'
      });
      assert.lengthOf(instance.validationErrors, 0);
    });

    it('passes validation when a version is set', () => {
      instance._validateTagName({
        tagName: '6.1.0'
      });
      assert.lengthOf(instance.validationErrors, 0);
    });

    it('failes when previous major version is set', () => {
      instance._validateTagName({
        tagName: '5.1.0'
      });
      assert.lengthOf(instance.validationErrors, 1);
    });

    it('failes when next major version is set', () => {
      instance._validateTagName({
        tagName: '7.0.0'
      });
      assert.lengthOf(instance.validationErrors, 1);
    });
  });

  describe('validate()', () => {
    let instance;
    beforeEach(function() {
      instance = new BuilderOptions({ ...baseOptions });
    });

    it('calls _validateOptionsList()', () => {
      const spy = sinon.spy(instance, '_validateOptionsList');
      instance.validate();
      assert.isTrue(spy.called);
    });

    it('calls _validateLogger()', () => {
      const spy = sinon.spy(instance, '_validateLogger');
      instance.validate();
      assert.isTrue(spy.called);
    });

    it('calls _validateApiOptions()', () => {
      const spy = sinon.spy(instance, '_validateApiOptions');
      instance.validate();
      assert.isTrue(spy.called);
    });

    it('calls _validateTagName()', () => {
      const spy = sinon.spy(instance, '_validateTagName');
      instance.validate();
      assert.isTrue(spy.called);
    });
  });

  describe('constructor()', () => {
    it('sets validationErrors', () => {
      const instance = new BuilderOptions({ ...baseOptions });
      assert.typeOf(instance.validationErrors, 'array');
    });

    it('sets validationWarnings', () => {
      const instance = new BuilderOptions({ ...baseOptions });
      assert.typeOf(instance.validationWarnings, 'array');
    });

    const f = () => {};

    [
      ['tagName', '6.0.0'],
      ['destination', 'test'],
      ['apiMediaType', 'application/x-test'],
      ['verbose', true],
      ['noCache', true],
      ['strict', true],
      ['exitOnError', false],
      ['attributes', { a: 'test' }],
      ['logger', { info: f, log: f, warn: f, error: f, }],
      ['themeFile', 'styles.css'],
      ['indexFile', 'index.html'],
      ['appTitle', 'test'],
    ].forEach(([name, value]) => {
      it(`sets passed value to ${name}`, () => {
        const opts = { ...baseOptions };
        opts[name] = value;
        const instance = new BuilderOptions(opts);
        assert.equal(instance[name], value);
      });
    });
  });
});
