'use strict';

const builder = require('..');
const fs = require('fs-extra');
const path = require('path');

const workingDir = path.join('build', 'amf-raml');
const apiFile = 'api-raml-10.raml';

/**
 * Builds the console with AMF parser included and API file copied to the
 * build location.
 */
builder({
  destination: workingDir,
  tagName: '5.0.0',
  api: apiFile,
  apiType: 'RAML 1.0',
  withAmf: true,
  verbose: true
})
.then(() => {
  const source = path.join(__dirname, '..', 'test', 'test-apis', apiFile);
  const dest = path.join(workingDir, apiFile);
  return fs.copy(source, dest);
})
.catch((cause) => {
  console.error(cause);
});
