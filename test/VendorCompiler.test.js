import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { VendorCompiler } from '../lib/VendorCompiler.js';
import { DependencyManager } from '../lib/DependencyManager.js';

const workingDir = path.join('test', 'vendor-test');
const f = () => {};
const logger = { info: f, log: f, warn: f, error: f, debug: f};

async function createPackage() {
  const pkg = {
    name: "api-console-bundle",
    description: "a template to install API dependencies",
    repository: {
      type: "git",
      url: "git+ssh://git@github.com/mulesoft-labs/api-console-builder.git"
    },
    license: "Apache-2.0",
    dependencies: {
      cryptojslib: '3.1.2',
      jsrsasign: '8.0.12',
      jsonlint: '1.6.3',
      codemirror: '5.50.2',
    }
  };
  await fs.outputJson(path.join(workingDir, 'package.json'), pkg);
}

describe('VendorCompiler', () => {
  before(async () => await fs.ensureDir(workingDir));
  after(async () => await fs.remove(workingDir));

  describe('constructor()', function() {
    it('sets workingDir property', () => {
      const instance = new VendorCompiler(workingDir, logger);
      assert.equal(instance.workingDir, workingDir);
    });

    it('sets logger property', () => {
      const instance = new VendorCompiler(workingDir, logger);
      assert.isTrue(instance.logger === logger);
    });
  });

  describe('compile()', () => {
    before(async () => {
      await createPackage();
      const instance = new DependencyManager(workingDir, logger);
      await instance.installNpm();
    });

    it('creates vendor package', async () => {
      const instance = new VendorCompiler(workingDir, logger);
      await instance.compile();
      const exists = await fs.pathExists(path.join(workingDir, 'vendor.js'));
      assert.isTrue(exists);
    });
  });
});
