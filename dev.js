'use strict';

const builder = require('.');
const workingDir = 'test/playground';

builder({
  local: 'test/api-console-5.0.0-preview.zip',
  destination: workingDir,
  api: 'test/api.raml',
  verbose: true,
  noCryptoJs: true,
  noJsPolyfills: true,
  attributes: [
    {
      'append-headers': 'x-header: text'
    },
    'narrow',
    'no-try-it'
  ]
});
