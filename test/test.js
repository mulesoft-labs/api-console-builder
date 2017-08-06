'use strict';

const builder = require('..');
const workingDir = 'playground/attributes-test-build';

builder({
  noOptimization: false,
  src: 'test/api-console-release-4.0.0.zip',
  dest: workingDir,
  raml: 'test/api.raml',
  sourceIsZip: true,
  verbose: true,
  useJson: true,
  attributes: [
    {
      'append-headers': 'x-header: text',
      proxy: 'http://proxy.com',
      'json-file': 'file.json'
    },
    'narrow',
    'no-try-it',
    'proxy-encode-url'
  ]
});
