const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');
const winston = require('winston');
const {CacheBuild} = require('../lib/cache-build');

function getLogger() {
  const level = 'warn';
  const format = winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  );
  return winston.createLogger({
    level,
    format,
    exitOnError: false,
    transports: [
      new winston.transports.Console()
    ]
  });
}

describe('CacheBuild', function() {
  const workingDir = path.join('test', 'playground');
  describe('constructor()', function() {
    it('Sets opts property', () => {
      const opts = {};
      const instance = new CacheBuild(opts, getLogger());
      assert.isTrue(instance.opts === opts);
    });

    it('Sets logger property', () => {
      const logger = getLogger();
      const instance = new CacheBuild({}, logger);
      assert.isTrue(instance.logger === logger);
    });

    it('Sets hash property', () => {
      const instance = new CacheBuild({}, getLogger());
      assert.typeOf(instance.hash, 'string');
    });

    it('Sets cacheFolder property', () => {
      const instance = new CacheBuild({}, getLogger());
      assert.typeOf(instance.cacheFolder, 'string');
    });

    it('Won\'t set hash when noCache option is set', () => {
      const instance = new CacheBuild({noCache: true}, getLogger());
      assert.isUndefined(instance.hash);
    });

    it('Won\'t set cacheFolder when noCache option is set', () => {
      const instance = new CacheBuild({noCache: true}, getLogger());
      assert.isUndefined(instance.cacheFolder);
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
      instance = new CacheBuild({}, getLogger());
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
      instance = new CacheBuild({}, getLogger());
    });

    it('Returns false when noCache', () => {
      instance.opts.noCache = true;
      return instance.hasCache()
      .then((result) => assert.isFalse(result));
    });

    it('Returns false when cache file not found', () => {
      return instance.hasCache()
      .then((result) => assert.isFalse(result));
    });
  });

  describe('_processZip()', () => {
    const source = path.join('test', 'sample.zip');
    let instance;
    beforeEach(() => {
      instance = new CacheBuild({}, getLogger());
    });

    afterEach(() => fs.remove(workingDir));

    it('Unzips archive', () => {
      return instance._processZip(source, workingDir)
      .then(() => fs.exists(path.join(workingDir, 'index.html')))
      .then((exists) => assert.isTrue(exists));
    });

    it('Unzips sub-directories', () => {
      return instance._processZip(source, workingDir)
      .then(() => fs.exists(path.join(workingDir, 'subdir', 'file.json')))
      .then((exists) => assert.isTrue(exists));
    });

    it('Rejects when no source file', () => {
      let called = false;
      return instance._processZip('non-existing', workingDir)
      .then(() => {
        called = true;
        throw new Error('Should not resolve');
      })
      .catch((cause) => {
        if (called) {
          throw cause;
        }
      });
    });
  });

  describe('restore()', () => {
    let instance;
    beforeEach(() => {
      instance = new CacheBuild({}, getLogger());
      instance.cacheFolder = 'test';
      instance.hash = 'sample';
    });

    afterEach(() => fs.remove(workingDir));

    it('Unzips cache file to working location', () => {
      return instance.restore(workingDir)
      .then(() => fs.exists(path.join(workingDir, 'index.html')))
      .then((exists) => assert.isTrue(exists));
    });
  });

  describe('cacheBuild()', () => {
    function createSourcesStructure() {
      const es6build = path.join(workingDir, 'es6-bundle', 'index.html');
      const es5build = path.join(workingDir, 'es5-bundle', 'index.html');
      const importFile = path.join(workingDir, 'apic-import.js');
      const indexFile = path.join(workingDir, 'index.html');
      return fs.ensureDir(es6build)
      .then(() => fs.ensureDir(es5build))
      .then(() => fs.ensureFile(importFile))
      .then(() => fs.ensureFile(indexFile));
    }

    let instance;
    beforeEach(() => {
      instance = new CacheBuild({}, getLogger());
      instance.cacheFolder = workingDir;
      return createSourcesStructure();
    });

    afterEach(() => fs.remove(workingDir));

    it('Creates a zip file', () => {
      return instance.cacheBuild(workingDir)
      .then(() => fs.exists(path.join(workingDir, instance.hash + '.zip')))
      .then((exists) => assert.isTrue(exists));
    });

    it('Ignores function when noCache is set', () => {
      instance.opts.noCache = true;
      return instance.cacheBuild(workingDir)
      .then(() => fs.exists(path.join(workingDir, instance.hash + '.zip')))
      .then((exists) => assert.isFalse(exists));
    });
  });

  describe('createHash()', () => {
    let instance;
    beforeEach(() => {
      instance = new CacheBuild({}, getLogger());
    });

    const hashes = [];

    it('Creates hash for "local" option', () => {
      const result = instance.createHash({
        local: 'test'
      });
      assert.typeOf(result, 'string');
      hashes.push(result);
    });

    [
      ['tagName', '5.0.0'],
      ['api', true],
      ['embedded', true],
      ['withAmf', true],
      ['noCryptoJs', true],
      ['noJsPolyfills', true],
      ['noWebAnimations', true],
      ['themeFile', 'some-file'],
      ['attributes', {test: true}]
    ].forEach((item) => {
      it(`Creates hash for "${item[0]}" option`, () => {
        const opts = {};
        opts[item[0]] = item[1];
        const result = instance.createHash(opts);
        assert.typeOf(result, 'string');
      });

      it('Hash for "tagName" is unique', () => {
        const opts = {};
        opts[item[0]] = item[1];
        const result = instance.createHash(opts);
        assert.equal(hashes.indexOf(result), -1);
        hashes.push(result);
      });
    });

    it('Will not throw error when stringifying attributes', () => {
      const attributes = {test: true};
      attributes.attributes = attributes;
      const opts = {
        attributes
      };
      const result = instance.createHash(opts);
      assert.typeOf(result, 'string');
    });
  });
});
