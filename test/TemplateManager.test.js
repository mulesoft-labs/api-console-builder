import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { TemplateManager } from '../lib/TemplateManager.js';

const workingDir = path.join('test', 'templates-test');
const f = () => {};
const logger = { info: f, log: f, warn: f, error: f, debug: f};

describe('TemplateManager', () => {
  before(async () => await fs.ensureDir(workingDir));
  after(async () => await fs.remove(workingDir));

  describe('constructor()', function() {
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
    afterEach(async () => await fs.remove(workingDir));

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
        const exists = await fs.exists(path.join(workingDir, file));
        assert.isTrue(exists, `File ${file} exists`);
      }
    });
  });
});
