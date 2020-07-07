import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { CacheBuild } from '../lib/CacheBuild.js';
import { dummyLogger } from './Helper.js';

/** @typedef {import('winston').Logger} Winston */

/* eslint-disable no-empty-function */

const workingDir = path.join('test', 'cache-test');
const logger = dummyLogger();

describe('CacheBuild', () => {
  before(async () => fs.ensureDir(workingDir));
  after(async () => fs.remove(workingDir));

  describe('constructor()', () => {
    it('sets opts property', () => {
      const opts = {};
      const instance = new CacheBuild(opts, logger);
      assert.isTrue(instance.opts === opts);
    });

    it('sets logger property', () => {
      const instance = new CacheBuild({}, logger);
      assert.isTrue(instance.logger === logger);
    });

    it('sets hash property', () => {
      const instance = new CacheBuild({}, logger);
      assert.typeOf(instance.hash, 'string');
    });

    it('sets cacheFolder property', () => {
      const instance = new CacheBuild({}, logger);
      assert.typeOf(instance.cacheFolder, 'string');
    });

    it('does not set hash when noCache is set', () => {
      const instance = new CacheBuild({ noCache: true }, logger);
      assert.isUndefined(instance.hash);
    });

    it('does not set cacheFolder when noCache is set', () => {
      const instance = new CacheBuild({ noCache: true }, logger);
      assert.isUndefined(instance.cacheFolder);
    });
  });

  describe('createHash()', () => {
    let instance;
    beforeEach(() => {
      instance = new CacheBuild({}, logger);
    });

    const hashes = [];

    it('Creates hash for "local" option', () => {
      const result = instance.createHash({
        local: 'test',
      });
      assert.typeOf(result, 'string');
      hashes.push(result);
    });

    [
      ['tagName', '6.0.0'],
      ['themeFile', 'some-file'],
      ['indexFile', 'other-file'],
      ['appTitle', 'test'],
      ['attributes', { test: true }],
    ].forEach(([name, value]) => {
      it(`creates a hash for "${name}" option`, () => {
        const opts = {};
        opts[name] = value;
        const result = instance.createHash(opts);
        assert.typeOf(result, 'string');
      });

      it(`hash for "${name}" is unique`, () => {
        const opts = {};
        opts[name] = value;
        const result = instance.createHash(opts);
        assert.equal(hashes.indexOf(result), -1);
        hashes.push(result);
      });
    });

    it('does not throw error when stringifying attributes', () => {
      const attributes = { test: true };
      attributes.attributes = attributes;
      const opts = {
        attributes,
      };
      const result = instance.createHash(opts);
      assert.typeOf(result, 'string');
    });
  });

  describe('locateAppDir()', () => {
    let origHome;
    let origAppData;
    let instance;
    let buildLocation;
    before(() => {
      origHome = process.env.HOME;
      origAppData = process.env.APPDATA;
      buildLocation = path.join('api-console', 'cache', 'builds');
      process.env.HOME = path.join('a', 'b', 'c');
    });

    after(() => {
      if (origHome) {
        process.env.HOME = origHome;
      }
      if (origAppData) {
        process.env.APPDATA = origAppData;
      }
    });

    beforeEach(() => {
      instance = new CacheBuild({}, logger);
    });

    it('Uses APPDATA variable', () => {
      process.env.APPDATA = path.join('a', 'b', 'c');
      const result = instance.locateAppDir();
      assert.equal(result, path.join(process.env.APPDATA, buildLocation));
      process.env.APPDATA = undefined;
    });

    it('Sets macOS location', () => {
      delete process.env.APPDATA;
      const result = instance.locateAppDir('darwin');
      assert.equal(result, path.join(process.env.HOME, 'Library', 'Preferences', buildLocation));
    });

    it('Sets linux location', () => {
      delete process.env.APPDATA;
      const result = instance.locateAppDir('linux');
      assert.equal(result, path.join(process.env.HOME, '.config', buildLocation));
    });

    it('Uses default location', () => {
      delete process.env.APPDATA;
      const result = instance.locateAppDir('unknown');
      assert.equal(result, path.join('/var/local', buildLocation));
    });
  });

  describe('hasCache()', () => {
    let instance;
    beforeEach(() => {
      instance = new CacheBuild({}, logger);
    });

    it('returns false when noCache', async () => {
      instance.opts.noCache = true;
      const result = await instance.hasCache();
      assert.isFalse(result);
    });

    it('returns false when cache file not found', async () => {
      const location = path.join(instance.cacheFolder, `${instance.hash}.zip`);
      await fs.remove(location);
      const result = await instance.hasCache();
      assert.isFalse(result);
    });
  });

  describe('_processZip()', () => {
    const source = path.join('test', 'sample.zip');
    let instance;
    beforeEach(() => {
      instance = new CacheBuild({}, logger);
    });

    afterEach(() => fs.remove(workingDir));

    it('unzips the archive', async () => {
      await instance._processZip(source, workingDir);
      // @ts-ignore
      const exists = await fs.exists(path.join(workingDir, 'index.html'));
      assert.isTrue(exists);
    });

    it('unzips sub-directories', async () => {
      await instance._processZip(source, workingDir);
      // @ts-ignore
      const exists = await fs.exists(path.join(workingDir, 'subdir', 'file.json'));
      assert.isTrue(exists);
    });

    it('rejects when no source file', async () => {
      let called = false;
      try {
        await instance._processZip('non-existing', workingDir);
      } catch (e) {
        called = true;
      }
      assert.isTrue(called);
    });
  });

  describe('restore()', () => {
    let instance;
    beforeEach(() => {
      instance = new CacheBuild({}, logger);
      instance.cacheFolder = 'test';
      instance.hash = 'sample';
    });

    afterEach(() => fs.remove(workingDir));

    it('unzips cache file to the working location', async () => {
      await instance.restore(workingDir);
      // @ts-ignore
      const exists = await fs.exists(path.join(workingDir, 'index.html'));
      assert.isTrue(exists);
    });
  });

  describe('cacheBuild()', () => {
    const srcFolder = path.join(workingDir, 'src');

    /**
     * @return {Promise<void>}
     */
    async function createSourcesStructure() {
      const files = [
        path.join(srcFolder, 'legacy', 'apic-import-651009da.js'),
        path.join(srcFolder, 'polyfills', 'core-js.5e6caafde24250a9349bba4d345eb7be.js'),
        path.join(srcFolder, 'api-model.json'),
        path.join(srcFolder, 'apic-import-66b811fa.js'),
        path.join(srcFolder, 'index.html'),
        path.join(srcFolder, 'vendor.js'),
        path.join(srcFolder, 'sw.js'),
      ];

      for (let i = 0, len = files.length; i < len; i++) {
        await fs.ensureFile(files[i]);
      }
    }

    let instance;
    beforeEach(async () => {
      instance = new CacheBuild({}, logger);
      instance.cacheFolder = workingDir;
      await createSourcesStructure();
    });

    afterEach(() => fs.remove(workingDir));

    it('creates a zip file', async () => {
      await instance.cacheBuild(srcFolder);
      // @ts-ignore
      const exists = await fs.exists(path.join(workingDir, `${instance.hash }.zip`));
      assert.isTrue(exists);
    });

    it('ignores function when noCache is set', async () => {
      instance.opts.noCache = true;
      await instance.cacheBuild(srcFolder);
      // @ts-ignore
      const exists = await fs.exists(path.join(workingDir, `${instance.hash }.zip`));
      assert.isFalse(exists);
    });

    it('zips all application files', async () => {
      await instance.cacheBuild(srcFolder);
      const file = path.join(workingDir, `${instance.hash }.zip`);
      const dest = path.join(workingDir, 'unzipped');
      await instance._processZip(file, dest);
      const files = [
        path.join(dest, 'legacy', 'apic-import-651009da.js'),
        path.join(dest, 'polyfills', 'core-js.5e6caafde24250a9349bba4d345eb7be.js'),
        path.join(dest, 'api-model.json'),
        path.join(dest, 'apic-import-66b811fa.js'),
        path.join(dest, 'index.html'),
        path.join(dest, 'vendor.js'),
        path.join(dest, 'sw.js'),
      ];

      for (let i = 0, len = files.length; i < len; i++) {
        const item = files[i];
        // @ts-ignore
        const exists = await fs.exists(item);
        assert.isTrue(exists, `${file} exists`);
      }
    });
  });
});
