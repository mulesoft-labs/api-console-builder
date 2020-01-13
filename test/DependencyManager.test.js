import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { DependencyManager } from '../lib/DependencyManager.js';

const workingDir = path.join('test', 'dependency-test');
const f = () => {};
const logger = { info: f, log: f, warn: f, error: f, debug: f};
const tagName = '6.0.0-preview.36';

async function createPackage() {
  const pkg = {
    name: "api-console",
    description: "a template to install API dependencies",
    repository: {
      type: "git",
      url: "git+ssh://git@github.com/mulesoft-labs/api-console-builder.git"
    },
    license: "Apache-2.0",
    dependencies: {
      'is-sorted': '1.0.5'
    }
  };
  await fs.outputJson(path.join(workingDir, 'package.json'), pkg);
}

describe('DependencyManager', () => {
  before(async () => await fs.ensureDir(workingDir));
  after(async () => await fs.remove(workingDir));

  describe('constructor()', function() {
    it('sets workingDir property', () => {
      const instance = new DependencyManager(workingDir, logger,tagName);
      assert.equal(instance.workingDir, workingDir);
    });

    it('sets logger property', () => {
      const instance = new DependencyManager(workingDir, logger, tagName);
      assert.isTrue(instance.logger === logger);
    });

    it('sets tagName property', () => {
      const instance = new DependencyManager(workingDir, logger, tagName);
      assert.isTrue(instance.logger === logger);
    });
  });

  describe('installNpm()', () => {
    let instance;
    beforeEach(async () => {
      await createPackage();
      instance = new DependencyManager(workingDir, logger,tagName);
    });

    afterEach(async () => await fs.remove(workingDir));

    it('installs dependencies in a working directory', async () => {
      await instance.installNpm();
      const exists = await fs.pathExists(path.join(workingDir, 'node_modules', 'is-sorted'));
      assert.isTrue(exists);
    });
  });

  describe('installConsole()', () => {
    let instance;
    beforeEach(async () => {
      await createPackage();
      instance = new DependencyManager(workingDir, logger,tagName);
    });

    afterEach(async () => await fs.remove(workingDir));

    it('installs console in a working directory', async () => {
      await instance.installConsole();
      const exists = await fs.pathExists(path.join(workingDir, 'node_modules', '@anypoint-web-components', 'api-console'));
      assert.isTrue(exists);
    });
  });

  describe('install()', () => {
    let instance;
    beforeEach(async () => {
      await createPackage();
      instance = new DependencyManager(workingDir, logger,tagName);
    });

    afterEach(async () => await fs.remove(workingDir));

    it('installs dependencies and the console', async () => {
      await instance.install();
      const exists = await fs.pathExists(path.join(workingDir, 'node_modules', '@anypoint-web-components', 'api-console'));
      assert.isTrue(exists);
      const exists2 = await fs.pathExists(path.join(workingDir, 'node_modules', 'is-sorted'));
      assert.isTrue(exists2);
    });
  });
});
