'use strict';

const builder = require('..');
const workingDir = 'test/playground/attributes-test-build';

builder({
  noOptimization: true,
  src: 'test/api-console-4.2.1.zip',
  dest: workingDir,
  raml: 'test/api.raml',
  sourceIsZip: true,
  verbose: true,
  useJson: true,
  attributes: [
    {
      'append-headers': 'x-header: text'
    },
    'narrow',
    'no-try-it'
  ]
});
