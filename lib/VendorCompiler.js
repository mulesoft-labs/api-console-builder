import UglifyJS from 'uglify-js';
import fs from  'fs-extra';
import path from 'path';

const CryptoFiles = [
  'cryptojslib/components/core.js',
  'cryptojslib/components/sha1.js',
  'cryptojslib/components/enc-base64.js',
  'cryptojslib/components/md5.js',
  'jsrsasign/lib/jsrsasign-rsa-min.js',
];

const CmFiles = [
  'jsonlint/web/jsonlint.js',
  'codemirror/lib/codemirror.js',
  'codemirror/addon/mode/loadmode.js',
  'codemirror/mode/meta.js',
  'codemirror/mode/javascript/javascript.js',
  'codemirror/mode/xml/xml.js',
  'codemirror/mode/yaml/yaml.js',
  'codemirror/mode/htmlmixed/htmlmixed.js',
  'codemirror/addon/lint/lint.js',
  'codemirror/addon/lint/json-lint.js',
];

/**
 * A class responsible for creating the `vendor.js` file.
 */
export class VendorCompiler {
  /**
   * @param {String} workingDir Build directory location
   * @param {Object} logger Logger object
   */
  constructor(workingDir, logger) {
    this.workingDir = workingDir;
    this.logger = logger;
  }

  async compile() {
    const { workingDir, logger } = this;
    logger.debug('Preparing vendor.js file...');
    const code = {};
    for (let i = 0, len = CryptoFiles.length; i < len; i++) {
      const file = CryptoFiles[i];
      const full = require.resolve(file);
      code[file] = await fs.readFile(full, 'utf8');
    }
    for (let i = 0, len = CmFiles.length; i < len; i++) {
      const file = CmFiles[i];
      const full = require.resolve(file);
      code[file] = await fs.readFile(full, 'utf8');
    }
    logger.debug('Vendor source read. Compiling...');
    const result = UglifyJS.minify(code);
    const dest = path.join(workingDir, 'vendor.js');
    await fs.writeFile(dest, result.code, 'utf8');
    logger.debug(`vendor.js file file ready at ${dest}.`);
  }
}
