'use strict';

const builder = require('..');
const workingDir = 'build/dev';

builder({
  destination: workingDir,
  tagName: '5.0.0-preview-1',
  api: 'test/test-apis/api-raml-10.raml',
  apiType: 'RAML 1.0',
  verbose: true,
  noCache: true,
  attributes: []
});
