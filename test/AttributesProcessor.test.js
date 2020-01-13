import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { AttributesProcessor } from '../lib/AttributesProcessor.js';

const workingDir = path.join('test', 'attributes-test');
const mainFile = path.join(workingDir, 'index.html');
const f = () => {};
const logger = { info: f, log: f, warn: f, error: f, debug: f};

describe('AttributesProcessor', () => {
  before(async () => await fs.ensureDir(workingDir));
  after(async () => await fs.remove(workingDir));

  async function createFile() {
    const src = path.join(__dirname, '..', 'templates', 'index.html');
    const contents = await fs.readFile(src);
    await fs.writeFile(mainFile, contents);
  }

  describe('constructor()', () => {
    let instance;
    const attributes = { test: true };
    beforeEach(() => {
      instance = new AttributesProcessor(attributes, logger, mainFile);
    });

    it('sets attributes property', () => {
      assert.deepEqual(instance.attributes, attributes);
    });

    it('sets logger property', () => {
      assert.deepEqual(instance.logger, logger);
    });

    it('sets appMainFile property', () => {
      assert.deepEqual(instance.appMainFile, mainFile);
    });
  });

  describe('listAttributes()', () => {
    it('returns empty array when no attributes in the array', () => {
      const instance = new AttributesProcessor([], logger, mainFile);
      const result = instance.listAttributes();
      assert.deepEqual(result, []);
    });

    it('returns empty array when no attributes', () => {
      const instance = new AttributesProcessor(undefined, logger, mainFile);
      const result = instance.listAttributes();
      assert.deepEqual(result, []);
    });

    it('transforms string item into an object', () => {
      const instance = new AttributesProcessor(['test'], logger, mainFile);
      const result = instance.listAttributes();
      assert.deepEqual(result, [{
        name: 'test',
        value: ''
      }]);
    });

    it('puts single value into the result', () => {
      const instance = new AttributesProcessor([{ test: 'value' }], logger, mainFile);
      const result = instance.listAttributes();
      assert.deepEqual(result, [{
        name: 'test',
        value: 'value'
      }]);
    });

    it('puts multiple values into the result', () => {
      const instance = new AttributesProcessor([{ test: 'value', other: 'x-value' }], logger, mainFile);
      const result = instance.listAttributes();
      assert.deepEqual(result, [{
        name: 'test',
        value: 'value'
      }, {
        name: 'other',
        value: 'x-value'
      }]);
    });

    it('generates result for mixed content', () => {
      const attr = [
        'single',
        { multiple: '1', values: true },
        { other: 1 }
      ];
      const instance = new AttributesProcessor(attr, logger, mainFile);
      const result = instance.listAttributes();
      assert.deepEqual(result, [
        {
          name: 'single',
          value: ''
        },
        {
          name: 'multiple',
          value: '1'
        },
        {
          name: 'values',
          value: true
        },
        {
          name: 'other',
          value: 1
        }
      ]);
    });
  });

  describe('writting attributes', () => {
    before(async () => await createFile());
    after(async () => await fs.emptyDir(workingDir));

    let instance;
    beforeEach(() => {
      const attr = [
        'single',
        { multiple: '1', values: 'true' },
        { other: '1' }
      ];
      instance = new AttributesProcessor(attr, logger, mainFile);
    });

    it('writes all attributes', async () => {
      await instance.setAttributes();
      const content = await fs.readFile(mainFile, 'utf8');
      assert.include(content, 'single=""', 'has "single"');
      assert.include(content, 'multiple="1"', 'has "multiple"');
      assert.include(content, 'values="true"', 'has "values"');
      assert.include(content, 'other="1"', 'has "other"');
    });

    it('writes builder own attribute', async () => {
      await instance.setAttributes();
      const content = await fs.readFile(mainFile, 'utf8');
      assert.include(content, 'by-api-console-builder=""', 'has "single"');
    });
  });
});
