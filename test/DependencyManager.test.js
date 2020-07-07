import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { DependencyManager } from '../lib/DependencyManager.js';
import { dummyLogger } from './Helper.js';

const workingDir = path.join('test', 'dependency-test');
const logger = dummyLogger();
const tagName = '6.0.0';

/**
 * @return {Promise<void>}
 */
async function createPackage() {
  const pkg = {
    name: 'api-console-bundle',
    description: 'a template to install API dependencies',
    repository: {
      type: 'git',
      url: 'git+ssh://git@github.com/mulesoft-labs/api-console-builder.git',
    },
    license: 'Apache-2.0',
    dependencies: {
      'is-sorted': '1.0.5',
    },
  };
  await fs.outputJson(path.join(workingDir, 'package.json'), pkg);
}

describe('DependencyManager', () => {
  before(async () => fs.ensureDir(workingDir));
  after(async () => fs.remove(workingDir));

  describe('constructor()', () => {
    it('sets workingDir property', () => {
      const instance = new DependencyManager(workingDir, logger, tagName);
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
      instance = new DependencyManager(workingDir, logger, tagName);
    });

    afterEach(async () => fs.remove(workingDir));

    it('installs dependencies in a working directory', async () => {
      await instance.installNpm();
      const exists = await fs.pathExists(path.join(workingDir, 'node_modules', 'is-sorted'));
      assert.isTrue(exists);
    });
  });

  describe('installConsole()', () => {
    beforeEach(async () => {
      await createPackage();
    });

    afterEach(async () => fs.remove(workingDir));

    it('installs latest console in a working directory', async () => {
      const instance = new DependencyManager(workingDir, logger);
      await instance.installConsole();
      const exists = await fs.pathExists(path.join(workingDir, 'node_modules', 'api-console'));
      assert.isTrue(exists);
    });

    it('installs console with a version in a working directory', async () => {
      const instance = new DependencyManager(workingDir, logger, tagName);
      await instance.installConsole();
      const exists = await fs.pathExists(path.join(workingDir, 'node_modules', 'api-console'));
      assert.isTrue(exists);
    });
  });

  describe('install()', () => {
    let instance;
    beforeEach(async () => {
      await createPackage();
      instance = new DependencyManager(workingDir, logger, tagName);
    });

    afterEach(async () => fs.remove(workingDir));

    it('installs dependencies and the console', async () => {
      await instance.install();
      const exists = await fs.pathExists(path.join(workingDir, 'node_modules', 'api-console'));
      assert.isTrue(exists);
      const exists2 = await fs.pathExists(path.join(workingDir, 'node_modules', 'is-sorted'));
      assert.isTrue(exists2);
    });
  });
});
