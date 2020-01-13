import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { SourceControl } from '../lib/SourceControl.js';

const workingDir = path.join('test', 'sources-test');
const f = () => {};
const logger = { info: f, log: f, warn: f, error: f, debug: f};

describe('SourceControl', () => {
  before(async () => await fs.ensureDir(workingDir));
  after(async () => await fs.remove(workingDir));

  describe('constructor()', function() {
    it('sets opts property', () => {
      const opts = {};
      const instance = new SourceControl(opts, logger);
      assert.isTrue(instance.opts === opts);
    });

    it('sets logger property', () => {
      const instance = new SourceControl({}, logger);
      assert.isTrue(instance.logger === logger);
    });
  });

  describe('clearOutputDir()', () => {
    let instance;
    beforeEach(() => {
      instance = new SourceControl({}, logger);
    });

    it('removes default directory', async () => {
      await fs.ensureDir('build');
      await instance.clearOutputDir();
      const exists = await fs.exists('build');
      assert.isFalse(exists);
    });

    it('removes set directory', async () => {
      const dir = path.join(workingDir, 'output');
      instance.opts.destination = dir;
      await fs.ensureDir(dir);
      await instance.clearOutputDir();
      const exists = await fs.exists(dir);
      assert.isFalse(exists);
    });
  });

  describe('createWorkingDir()', () => {
    let instance;
    beforeEach(() => {
      instance = new SourceControl({}, logger);
    });

    it('returns a path to created directory', async () => {
      const result = await instance.createWorkingDir();
      assert.typeOf(result, 'string');
    });

    it('created directory exists', async () => {
      const result = await instance.createWorkingDir();
      const exists = await fs.exists(result);
      assert.isTrue(exists);
    });
  });

  describe('cleanup()', () => {
    let instance;
    beforeEach(() => {
      instance = new SourceControl({}, logger);
    });

    it('removes the directory', async () => {
      const dir = path.join(workingDir, 'output');
      await fs.ensureDir(dir);
      await instance.cleanup(dir);
      const exists = await fs.exists(dir);
      assert.isFalse(exists);
    });

    it('ignores non existing directory', async () => {
      const dir = path.join(workingDir, 'output-non-existing');
      await instance.cleanup(dir);
    });
  });

  describe('copyOutput()', () => {
    let instance;
    let simpleFile;
    let subFile;
    const destination = path.join(workingDir, 'dest');
    beforeEach(async () => {
      instance = new SourceControl({
        destination
      }, logger);
      simpleFile = path.join(workingDir, 'build', 'simple.js');
      subFile = path.join(workingDir, 'build', 'sub', 'file.js');
      await fs.ensureFile(simpleFile);
      await fs.ensureFile(subFile);
    });

    afterEach(() => fs.remove(workingDir));

    it('copies a file from main directory', async () => {
      await instance.copyOutput(workingDir, 'build');
      const exists = await fs.exists(path.join(destination, 'simple.js'));
      assert.isTrue(exists);
    });

    it('copies a file from a sub-directory', async () => {
      await instance.copyOutput(workingDir, 'build');
      const exists = await fs.exists(path.join(destination, 'sub', 'file.js'));
      assert.isTrue(exists);
    });
  });
});
