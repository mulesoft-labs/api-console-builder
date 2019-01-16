'use strict';

const builder = require('..');
const workingDir = 'build/dev';

builder({
  destination: workingDir,
  api: 'test/test-apis/api-raml-10.raml',
  apiType: 'RAML 1.0',
  withAmf: true,
  verbose: true,
  noCache: true,
  attributes: []
});
