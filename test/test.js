'use strict';

const builder = require('..');
const workingDir = 'test/playground/attributes-test-build';

builder({
  noOptimization: true,
  src: 'test/api-console-release-4.0.0.zip',
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
