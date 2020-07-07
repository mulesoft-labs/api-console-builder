import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import sinon from 'sinon';
import { parse } from 'node-html-parser';
import { ApiConsoleProject } from '../lib/ApiConsoleProject.js';
import { BuilderOptions } from '../lib/BuilderOptions.js';
import { CacheBuild } from '../lib/CacheBuild.js';
import { SourceControl } from '../lib/SourceControl.js';
import { dummyLogger } from './Helper.js';

const workingDir = path.join('test', 'project-test');
const logger = dummyLogger();
const defaultOpts = {
  api: path.join('test', 'test-apis', 'api-raml-10.raml'),
  apiType: 'RAML 1.0',
  logger,
};

describe('ApiConsoleProject', () => {
  // before(async () => await fs.ensureDir(workingDir));
  // after(async () => await fs.remove(workingDir));

  describe('constructor()', () => {
    it('sets opts property', () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      assert.ok(instance.opts, 'options are set');
      assert.isTrue(instance.opts instanceof BuilderOptions, 'options are converted to BuilderOptions');
    });

    it('sets logger property', () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      assert.deepEqual(instance.logger, logger);
    });

    it('sets passed logger property', () => {
      const obj = dummyLogger();
      // @ts-ignore
      obj.test = true;
      const opts = {
        ...defaultOpts,
      };
      opts.logger = obj;
      const instance = new ApiConsoleProject(opts);
      assert.deepEqual(instance.logger, obj);
    });

    it('sets cache property', () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      assert.ok(instance.cache, 'cache is set');
      assert.isTrue(instance.cache instanceof CacheBuild, 'cache is an instance of CacheBuild');
    });

    it('sets apiDataFile property', () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      assert.equal(instance.apiDataFile, 'api-model.json');
    });

    it('throws an error when configuration is invalid', () => {
      assert.throws(() => {
        const opts = { ...defaultOpts };
        delete opts.api;
        const instance = new ApiConsoleProject(opts);
        assert.typeOf(instance.opts.api, 'string');
      });
    });
  });

  describe('printValidationWarnings()', () => {
    let instance;
    beforeEach(() => {
      instance = new ApiConsoleProject({ ...defaultOpts });
    });

    it('does not print warnings when no warnings', () => {
      const spy = sinon.spy(instance.logger, 'warn');
      instance.printValidationWarnings();
      instance.logger.warn.restore();
      assert.isFalse(spy.called);
    });

    it('prints warnings when available', () => {
      const spy = sinon.spy(instance.logger, 'warn');
      instance.opts.validationWarnings = ['test'];
      instance.printValidationWarnings();
      instance.logger.warn.restore();
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('printValidationErrors()', () => {
    let instance;
    beforeEach(() => {
      instance = new ApiConsoleProject({ ...defaultOpts });
    });

    it('does not print warnings when no warnings', () => {
      const spy = sinon.spy(instance.logger, 'error');
      instance.printValidationErrors();
      instance.logger.error.restore();
      assert.isFalse(spy.called);
    });

    it('prints warnings when available', () => {
      const spy = sinon.spy(instance.logger, 'error');
      instance.opts.validationErrors = ['test'];
      instance.printValidationErrors();
      instance.logger.error.restore();
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('#sourceControl', () => {
    let instance;
    beforeEach(() => {
      instance = new ApiConsoleProject({ ...defaultOpts });
    });

    it('returns instance of SourceControl', () => {
      assert.isTrue(instance.sourceControl instanceof SourceControl, 'is an instance of SourceControl');
    });

    it('re-uses existing instance', () => {
      const sc = instance.sourceControl;
      assert.isTrue(instance.sourceControl === sc, 'subsequent call returns the same instance');
    });
  });

  describe('processTemplates()', () => {
    beforeEach(async () => fs.ensureDir(workingDir));
    afterEach(async () => fs.remove(workingDir));

    it('copies template files to the working directory', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      await instance.processTemplates(workingDir);
      // @ts-ignore
      const exists = await fs.exists(path.join(workingDir, 'apic-import.js'));
      // testing for any file as the test for copying files are in TemplateManager tests.
      assert.isTrue(exists, `Files are copied`);
    });
  });

  describe('processApi()', () => {
    beforeEach(async () => fs.ensureDir(workingDir));
    afterEach(async () => fs.remove(workingDir));

    it('creates model file in the working directory', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      await instance.processApi(workingDir);
      // @ts-ignore
      const exists = await fs.exists(path.join(workingDir, 'api-model.json'));
      // testing for any file as the test for copying files are in TemplateManager tests.
      assert.isTrue(exists, `Model is created are copied`);
    });

    it('sets apiModel property', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      await instance.processApi(workingDir);
      assert.ok(instance.apiModel);
    });
  });

  describe('ensureTheme()', () => {
    beforeEach(async () => fs.ensureDir(workingDir));
    afterEach(async () => fs.remove(workingDir));

    it('copies set theme file to the working directory', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.opts.themeFile = path.join('test', 'apic-theme-file.css');
      await instance.ensureTheme(workingDir);
      // @ts-ignore
      const exists = await fs.exists(path.join(workingDir, 'styles.css'));
      assert.isTrue(exists, `style file is created`);
    });

    it('prints warning when source file does not exist', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.opts.themeFile = path.join('test', 'non-existing.css');
      const spy = sinon.spy(instance.logger, 'warn');
      await instance.ensureTheme(workingDir);
      // @ts-ignore
      instance.logger.warn.restore();
      assert.isTrue(spy.called);
    });

    it('ignores operation when source file does not exist', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.opts.themeFile = path.join('test', 'non-existing.css');
      await instance.ensureTheme(workingDir);
      // @ts-ignore
      const exists = await fs.exists(path.join(workingDir, 'styles.css'));
      assert.isFalse(exists, `style file is not created`);
    });

    it('throws an error when strict is set', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.opts.themeFile = path.join('test', 'non-existing.css');
      instance.opts.strict = true;
      let called = false;
      try {
        await instance.ensureTheme(workingDir);
      } catch (e) {
        called = true;
      }
      assert.isTrue(called);
    });
  });

  describe('ensureApplicationIndexFile()', () => {
    beforeEach(async () => fs.ensureDir(workingDir));
    afterEach(async () => fs.remove(workingDir));

    const indexFile = 'apic-index-file.html';
    const distFile = 'index.html';
    const fakeFile = 'non-existing.html';

    it('copies set theme file to the working directory', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.opts.indexFile = path.join('test', indexFile);
      await instance.ensureApplicationIndexFile(workingDir);
      // @ts-ignore
      const exists = await fs.exists(path.join(workingDir, distFile));
      assert.isTrue(exists, `index file is created`);
    });

    it('prints warning when source file does not exist', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.opts.indexFile = path.join('test', fakeFile);
      const spy = sinon.spy(instance.logger, 'warn');
      await instance.ensureApplicationIndexFile(workingDir);
      // @ts-ignore
      instance.logger.warn.restore();
      assert.isTrue(spy.called);
    });

    it('ignores operation when source file does not exist', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.opts.indexFile = path.join('test', fakeFile);
      await instance.ensureApplicationIndexFile(workingDir);
      // @ts-ignore
      const exists = await fs.exists(path.join(workingDir, distFile));
      assert.isFalse(exists, `index file is not created`);
    });

    it('throws an error when strict is set', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.opts.indexFile = path.join('test', fakeFile);
      instance.opts.strict = true;
      let called = false;
      try {
        await instance.ensureApplicationIndexFile(workingDir);
      } catch (e) {
        called = true;
      }
      assert.isTrue(called);
    });
  });

  describe('getApiTitle()', () => {
    beforeEach(async () => fs.ensureDir(workingDir));
    afterEach(async () => fs.remove(workingDir));

    it('reads api title', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      await instance.processApi(workingDir);
      const result = instance.getApiTitle();
      assert.equal(result, 'TestApi');
    });

    it('returns undefined when no API', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      const result = instance.getApiTitle();
      assert.isUndefined(result);
    });

    it('returns undefined when no encodes', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      // @ts-ignore
      instance.apiModel = {};
      const result = instance.getApiTitle();
      assert.isUndefined(result);
    });

    it('returns undefined when no name', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.apiModel = {
        // @ts-ignore
        encodes: {},
      };
      const result = instance.getApiTitle();
      assert.isUndefined(result);
    });
  });

  describe('updateTemplateVariables()', () => {
    const mainFile = path.join(workingDir, 'index.html');
    /**
     * @return {Promise<void>}
     */
    async function createFile() {
      const contents = `>>[[API-TITLE]]<<`;
      await fs.writeFile(mainFile, contents);
    }

    let instance;
    beforeEach(async () => {
      await fs.ensureDir(workingDir);
      await createFile();
      instance = await new ApiConsoleProject({ ...defaultOpts });
    });

    afterEach(async () => fs.remove(workingDir));

    it('writes title defined in user options', async () => {
      instance.opts.appTitle = 'Test title';
      await instance.updateTemplateVariables(workingDir);
      const contents = await fs.readFile(mainFile, 'utf8');
      assert.equal(contents, '>>Test title<<');
    });

    it('writes title from the API file', async () => {
      instance.apiModel = {
        encodes: {
          name: {
            value: () => 'Test api title',
          },
        },
      };
      await instance.updateTemplateVariables(workingDir);
      const contents = await fs.readFile(mainFile, 'utf8');
      assert.equal(contents, '>>Test api title<<');
    });

    it('writes default title', async () => {
      await instance.updateTemplateVariables(workingDir);
      const contents = await fs.readFile(mainFile, 'utf8');
      assert.equal(contents, '>>API Console<<');
    });
  });

  describe('building process', () => {
    /**
     * @param {ApiConsoleProject} project
     * @return {Promise<void>}
     */
    async function clearInstanceCache(project) {
      const cacheLocation = path.join(project.cache.cacheFolder, `${project.cache.hash}.zip`);
      await fs.remove(cacheLocation);
    }

    // const cacheLocation = path.join(workingDir, 'cache');
    const buildLocation = path.join(workingDir, 'bundle');
    const apiLocation = path.join('test', 'test-apis', 'api-raml-10.raml');

    describe('basic build', () => {
      const hash = '925c20e5a61114a95a2c88cd60767ee06e327aff28b462b6d827c27a5c9624ed';
      let instance;
      before(async () => {
        await fs.ensureDir(workingDir);
      });

      after(async () => {
        await fs.remove(workingDir);
      });

      // The build process costs a lot so it happens only once.
      before(async () => {
        const opts = {
          destination: buildLocation,
          api: apiLocation,
          apiType: 'RAML 1.0',
          apiMediaType: 'application/raml',
          verbose: true,
          attributes: [{
            test: 'true',
          }],
        };
        instance = new ApiConsoleProject(opts);
        await clearInstanceCache(instance);
        await instance.bundle();
      });

      it('creates the bundle', async () => {
        const exists = await fs.pathExists(buildLocation);
        assert.isTrue(exists);
      });

      it('copies bundle files', async () => {
        const files = [
          path.join(buildLocation, 'polyfills'),
          path.join(buildLocation, 'api-model.json'),
          path.join(buildLocation, 'index.html'),
          path.join(buildLocation, 'vendor.js'),
          path.join(buildLocation, 'sw.js'),
        ];

        for (let i = 0, len = files.length; i < len; i++) {
          const file = files[i];
          const exists = await fs.pathExists(file);
          assert.isTrue(exists, `${file} exists`);
        }
      });

      it('adds attributes', async () => {
        const mainFile = path.join(buildLocation, 'index.html');
        const content = await fs.readFile(mainFile, 'utf8');
        assert.include(content, 'test="true"', 'has set attribute');
      });

      it('sets title from the API', async () => {
        const mainFile = path.join(buildLocation, 'index.html');
        const content = await fs.readFile(mainFile, 'utf8');
        assert.include(content, '<title>TestApi</title>', 'title is set');
      });

      it('creates a cache file', async () => {
        const cb = new CacheBuild(instance.opts, instance.logger);
        const base = cb.locateAppDir();
        const file = path.join(base, `${hash}.zip`);
        const exists = await fs.pathExists(file);
        assert.isTrue(exists, `${file} exists`);
      });
    });

    describe('build from the cache file', () => {
      const hash = '925c20e5a61114a95a2c88cd60767ee06e327aff28b462b6d827c27a5c9624ed';
      before(async () => {
        await fs.ensureDir(workingDir);
        const opts = {
          destination: buildLocation,
          api: apiLocation,
          apiType: 'RAML 1.0',
          apiMediaType: 'application/raml',
          verbose: true,
          attributes: [{
            test: 'true',
          }],
        };
        const project = new ApiConsoleProject(opts);
        await clearInstanceCache(project);
        const cb = new CacheBuild(project.opts, project.logger);
        const file = path.join(cb.cacheFolder, `${hash}.zip`);
        await fs.ensureDir(cb.cacheFolder);
        await fs.copy(
          path.join(__dirname, 'cached.zip'),
          path.join(file),
        );
        await project.bundle();
      });

      after(async () => {
        await fs.remove(workingDir);
      });

      it('extracts bundle files', async () => {
        const files = [
          path.join(buildLocation, 'polyfills'),
          path.join(buildLocation, 'api-model.json'),
          path.join(buildLocation, 'index.html'),
          path.join(buildLocation, 'vendor.js'),
          path.join(buildLocation, 'sw.js'),
          // cached.js is added to the zip file that makes sure that the
          // files comes from the zip.
          path.join(buildLocation, 'cached.js'),
        ];

        for (let i = 0, len = files.length; i < len; i++) {
          const file = files[i];
          const exists = await fs.pathExists(file);
          assert.isTrue(exists, `${file} exists`);
        }
      });

      it('generates api-model.js file', async () => {
        // api-model.json is removed from the test zip to test for this behavior
        const file = path.join(buildLocation, 'api-model.json');
        const exists = await fs.pathExists(file);
        assert.isTrue(exists);
      });
    });

    describe('custom css and custom html', () => {
      before(async () => {
        await fs.ensureDir(workingDir);
      });

      after(async () => {
        await fs.remove(workingDir);
      });

      before(async () => {
        const opts = {
          destination: buildLocation,
          api: apiLocation,
          apiType: 'RAML 1.0',
          themeFile: path.join('test', 'apic-theme-file.css'),
          indexFile: path.join('test', 'apic-index-file.html'),
        };
        const project = new ApiConsoleProject(opts);
        await clearInstanceCache(project);
        await project.bundle();
      });

      it('uses custom css file', async () => {
        const content = await fs.readFile(path.join(buildLocation, 'index.html'), 'utf8');
        const root = parse(content);
        const links = root.querySelectorAll('head link');
        const link = links.find((item) => {
          const rel = item.getAttribute('rel');
          if (rel !== 'preload') {
            return false;
          }
          const as = item.getAttribute('as');
          if (as !== 'script') {
            return false;
          }
          return true;
        });
        const href = link.getAttribute('href');
        const file = path.join(buildLocation, href);
        const data = await fs.readFile(file, 'utf8');
        assert.include(data, '--test-theme-value:', 'has custom styles');
      });

      it('uses custom html file', async () => {
        const content = await fs.readFile(path.join(buildLocation, 'index.html'), 'utf8');
        assert.include(content, 'custom-html=""', 'has custom html');
      });
    });
  });
});
