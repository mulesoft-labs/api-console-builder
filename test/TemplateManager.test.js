import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { TemplateManager } from '../lib/TemplateManager.js';
import { dummyLogger } from './Helper.js';

const workingDir = path.join('test', 'templates-test');
const logger = dummyLogger();

describe('TemplateManager', () => {
  before(async () => fs.ensureDir(workingDir));
  after(async () => fs.remove(workingDir));

  describe('constructor()', () => {
    it('sets workingDir property', () => {
      const instance = new TemplateManager(workingDir, logger);
      assert.equal(instance.workingDir, workingDir);
    });

    it('sets logger property', () => {
      const instance = new TemplateManager(workingDir, logger);
      assert.isTrue(instance.logger === logger);
    });
  });

  describe('copyTemplate()', () => {
    let instance;
    beforeEach(() => {
      instance = new TemplateManager(workingDir, logger);
    });
    afterEach(async () => fs.remove(workingDir));

    it('copies build files to the working directory', async () => {
      await instance.copyTemplate();
      const files = [
        'apic-import.js',
        'index.html',
        'styles.css',
        'rollup.config.js',
      ];
      for (let i = 0, len = files.length; i < len; i++) {
        const file = files[i];
        // @ts-ignore
        const exists = await fs.exists(path.join(workingDir, file));
        assert.isTrue(exists, `File ${file} exists`);
      }
    });

    it('removes underscore from file name', async () => {
      await instance.copyTemplate();
      const files = [
        'package.json',
      ];
      for (let i = 0, len = files.length; i < len; i++) {
        const file = files[i];
        // @ts-ignore
        const exists = await fs.exists(path.join(workingDir, file));
        assert.isTrue(exists, `File ${file} exists`);
      }
    });
  });
});
