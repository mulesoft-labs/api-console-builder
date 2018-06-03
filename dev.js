'use strict';

const builder = require('.');
const workingDir = 'build/dev';

builder({
  // local: 'test/api-console-5.0.0-preview.zip',
  tagName: '5.0.0-preview',
  destination: workingDir,
  api: 'test/test-apis/api-raml-10.raml',
  apiType: 'RAML 1.0',
  embedded: false,
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
