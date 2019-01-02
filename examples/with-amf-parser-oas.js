'use strict';

const builder = require('..');
const fs = require('fs-extra');
const path = require('path');

const workingDir = path.join('build', 'amf-oas2');
const apiFile = 'api-oas-20.json';

/**
 * Builds the console with AMF parser included and API file copied to the
 * build location.
 */
builder({
  destination: workingDir,
  tagName: '5.0.0-preview-1',
  api: apiFile,
  apiType: 'OAS 2.0',
  apiMediaType: 'application/json',
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
