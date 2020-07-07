import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { Bundler } from '../lib/Bundler.js';
import { dummyLogger } from './Helper.js';

/* eslint-disable no-empty-function */

const workingDir = path.join('test', 'vendor-test');
const logger = dummyLogger();

/**
 * @return {Promise<void>}
 */
async function createPackage() {
  const contentUnix = `echo "test" >> test-file`;
  const contentWindows = `dir > test-file`;
  const root = path.join(workingDir, 'node_modules', '.bin');
  const unixFile = path.join(root, 'rollup');
  const winFile = path.join(root, 'rollup.cmd');
  const options = {
    encoding: 'utf8',
    mode: 0o777,
  };
  await fs.ensureDir(root);
  await fs.writeFile(unixFile, contentUnix, options);
  await fs.writeFile(winFile, contentWindows, options);
}

// Note, this test does not tests whether it actually creates a bundle.
// This tests are designer to test whether correct script is executed to
// run the bundler.
// Also, the build process (as a whole) is tested in another place.

describe('Bundler', () => {
  before(async () => fs.ensureDir(workingDir));
  after(async () => fs.remove(workingDir));

  describe('constructor()', () => {
    it('sets workingDir property', () => {
      const instance = new Bundler(workingDir, logger);
      assert.equal(instance.workingDir, workingDir);
    });

    it('sets logger property', () => {
      const instance = new Bundler(workingDir, logger);
      assert.isTrue(instance.logger === logger);
    });
  });

  describe('#dest', () => {
    it('returns a path to the rollup output director', () => {
      const instance = new Bundler(workingDir, logger);
      const out = path.join(workingDir, 'dist');
      assert.equal(instance.dest, out);
    });
  });

  describe('cleanOutput()', () => {
    let instance;
    beforeEach(() => {
      instance = new Bundler(workingDir, logger);
    });

    it('removes pre-existing output directory', async () => {
      const out = path.join(workingDir, 'dist');
      await fs.ensureDir(out);
      await instance.cleanOutput();
      const exists = await fs.pathExists(out);
      assert.isFalse(exists);
    });
  });

  describe('bundle()', () => {
    before(async () => {
      await createPackage();
    });

    after(async () => fs.remove(workingDir));

    it('runs rollup build', async () => {
      const instance = new Bundler(workingDir, logger);
      await instance.bundle();
      const exists = await fs.pathExists(path.join(workingDir, 'test-file'));
      assert.isTrue(exists);
    });
  });
});
