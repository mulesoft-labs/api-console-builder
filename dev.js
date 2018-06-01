'use strict';

const builder = require('.');
const workingDir = 'test/playground';

builder({
  local: 'test/api-console-5.0.0-preview.zip',
  destination: workingDir,
  api: 'test/test-apis/api-raml-10.raml',
  embedded: true,
  verbose: true,
  // noCryptoJs: true,
  // noJsPolyfills: true,
  // themeFile: 'test/theme.html',
  attributes: [
    {
      'append-headers': 'x-header: text'
    },
    'narrow'
  ]
});
