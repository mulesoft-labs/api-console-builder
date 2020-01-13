import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import sinon from 'sinon';
import { ApiConsoleProject } from '../lib/ApiConsoleProject.js';
import { BuilderOptions } from '../lib/BuilderOptions.js';
import { CacheBuild } from '../lib/CacheBuild.js';
import { SourceControl } from '../lib/SourceControl.js';

const workingDir = path.join('test', 'project-test');
const f = () => {};
const logger = { info: f, log: f, warn: f, error: f, debug: f };
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
      const logger = { info: f, log: f, warn: f, error: f, debug: f, test: true };
      const opts = {
        ...defaultOpts,
      };
      opts.logger = logger;
      const instance = new ApiConsoleProject(opts);
      assert.deepEqual(instance.logger, logger);
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
        new ApiConsoleProject(opts);
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
    beforeEach(async () => await fs.ensureDir(workingDir));
    afterEach(async () => await fs.remove(workingDir));

    it('copies template files to the working directory', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      await instance.processTemplates(workingDir);
      const exists = await fs.exists(path.join(workingDir, 'apic-import.js'));
      // testing for any file as the test for copying files are in TemplateManager tests.
      assert.isTrue(exists, `Files are copied`);
    });
  });

  describe('processApi()', () => {
    beforeEach(async () => await fs.ensureDir(workingDir));
    afterEach(async () => await fs.remove(workingDir));

    it('creates model file in the working directory', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      await instance.processApi(workingDir);
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
    beforeEach(async () => await fs.ensureDir(workingDir));
    afterEach(async () => await fs.remove(workingDir));

    it('copies set theme file to the working directory', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.opts.themeFile = path.join('test', 'apic-theme-file.css');
      await instance.ensureTheme(workingDir);
      const exists = await fs.exists(path.join(workingDir, 'styles.css'));
      assert.isTrue(exists, `style file is created`);
    });

    it('prints warning when source file does not exist', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.opts.themeFile = path.join('test', 'non-existing.css');
      const spy = sinon.spy(instance.logger, 'warn');
      await instance.ensureTheme(workingDir);
      instance.logger.warn.restore();
      assert.isTrue(spy.called);
    });

    it('ignores operation when source file does not exist', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.opts.themeFile = path.join('test', 'non-existing.css');
      await instance.ensureTheme(workingDir);
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
    beforeEach(async () => await fs.ensureDir(workingDir));
    afterEach(async () => await fs.remove(workingDir));

    const indexFile = 'apic-index-file.html';
    const distFile = 'index.html';
    const fakeFile = 'non-existing.html';

    it('copies set theme file to the working directory', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.opts.indexFile = path.join('test', indexFile);
      await instance.ensureApplicationIndexFile(workingDir);
      const exists = await fs.exists(path.join(workingDir, distFile));
      assert.isTrue(exists, `index file is created`);
    });

    it('prints warning when source file does not exist', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.opts.indexFile = path.join('test', fakeFile);
      const spy = sinon.spy(instance.logger, 'warn');
      await instance.ensureApplicationIndexFile(workingDir);
      instance.logger.warn.restore();
      assert.isTrue(spy.called);
    });

    it('ignores operation when source file does not exist', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.opts.indexFile = path.join('test', fakeFile);
      await instance.ensureApplicationIndexFile(workingDir);
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
    beforeEach(async () => await fs.ensureDir(workingDir));
    afterEach(async () => await fs.remove(workingDir));

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
      instance.apiModel = {};
      const result = instance.getApiTitle();
      assert.isUndefined(result);
    });

    it('returns undefined when no name', async () => {
      const instance = new ApiConsoleProject({ ...defaultOpts });
      instance.apiModel = {
        encodes: {},
      };
      const result = instance.getApiTitle();
      assert.isUndefined(result);
    });
  });

  describe('updateTemplateVariables()', () => {
    const mainFile = path.join(workingDir, 'index.html');
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

    afterEach(async () => await fs.remove(workingDir));

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
            value: () => 'Test api title'
          }
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
    const cacheLocation = path.join(workingDir, 'cache');
    const buildLocation = path.join(workingDir, 'bundle');
    const apiLocation = path.join('test', 'test-apis', 'api-raml-10.raml')

    describe('basic build', () => {
      const hash = '925c20e5a61114a95a2c88cd60767ee06e327aff28b462b6d827c27a5c9624ed';
      let origHome;
      let origAppData;
      before(async () => {
        await fs.ensureDir(workingDir);
        origHome = process.env.HOME;
        origAppData = process.env.APPDATA;
        process.env.HOME = workingDir;
        process.env.APPDATA = cacheLocation;
      });

      after(async () => {
        await fs.remove(workingDir);
        process.env.HOME = origHome;
        process.env.APPDATA = origAppData;
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
          }]
        };
        const project = new ApiConsoleProject(opts);
        // this tag is not supported by the bundler oficially...
        project.opts.tagName = '6.0.0-preview.36';
        await project.bundle();
      });

      it('creates the bundle', async () => {
        const exists = await fs.pathExists(buildLocation);
        assert.isTrue(exists);
      });

      it('copies bundle files', async () => {
        const files = [
          path.join(buildLocation, 'legacy'),
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
        const base = path.join(cacheLocation, 'api-console', 'cache', 'builds');
        const file = path.join(base, `${hash}.zip`);
        const exists = await fs.pathExists(file);
        assert.isTrue(exists, `${file} exists`);
      });

      it('has no debug file', async () => {
        const file = 'api-console-builder-debug.log';
        const exists = await fs.pathExists(file);
        assert.isFalse(exists, `${file} exists`);
      });
    });

    describe('build from the cache', () => {
      const hash = '925c20e5a61114a95a2c88cd60767ee06e327aff28b462b6d827c27a5c9624ed';
      let origHome;
      let origAppData;
      before(async () => {
        await fs.ensureDir(workingDir);
        origHome = process.env.HOME;
        origAppData = process.env.APPDATA;
        process.env.HOME = workingDir;
        process.env.APPDATA = cacheLocation;
      });

      after(async () => {
        await fs.remove(workingDir);
        process.env.HOME = origHome;
        process.env.APPDATA = origAppData;
      });

      before(async () => {
        const opts = {
          destination: buildLocation,
          api: apiLocation,
          apiType: 'RAML 1.0',
          apiMediaType: 'application/raml',
          verbose: true,
          attributes: [{
            test: 'true',
          }]
        };
        const project = new ApiConsoleProject(opts);
        // this tag is not supported by the bundler oficially...
        project.opts.tagName = '6.0.0-preview.36';
        const base = path.join(cacheLocation, 'api-console', 'cache', 'builds');
        const file = path.join(base, `${hash}.zip`);
        await fs.ensureDir(base);
        await fs.copy(
          path.join('test', 'cached.zip'),
          path.join(file),
        );
        await project.bundle();
      });

      it('extracts bundle files', async () => {
        const files = [
          path.join(buildLocation, 'legacy'),
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
      let origHome;
      let origAppData;
      before(async () => {
        await fs.ensureDir(workingDir);
        origHome = process.env.HOME;
        origAppData = process.env.APPDATA;
        process.env.HOME = workingDir;
        process.env.APPDATA = cacheLocation;
      });

      after(async () => {
        await fs.remove(workingDir);
        process.env.HOME = origHome;
        process.env.APPDATA = origAppData;
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
        project.opts.tagName = '6.0.0-preview.36';
        await project.bundle();
      });

      it('uses custom css file', async () => {
        const files = await fs.readdir(buildLocation);
        const file = files.find((item) => item.indexOf('apic-import-') === 0);
        const content = await fs.readFile(path.join(buildLocation, file), 'utf8');
        assert.include(content, '--test-theme-value:', 'has custom styles');
      });

      it('uses custom html file', async () => {
        const content = await fs.readFile(path.join(buildLocation, 'index.html'), 'utf8');
        assert.include(content, 'custom-html=""', 'has custom html');
      });
    });
  });
});
