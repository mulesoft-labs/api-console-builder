'use strict';

const builder = require('..');
const path = require('path');

const workingDir = path.join('build', 'no-cache');
const apiFile = path.join(__dirname, '..', 'test', 'test-apis', 'api-raml-10.raml');

/**
 * This build will not use buid cache and it is always compiled from
 * sources.
 *
 * Note, this will not prevent from caching API console sources downloaded from GitHub.
 */
builder({
  destination: workingDir,
  tagName: '5.0.0-preview-1',
  api: apiFile,
  apiType: 'RAML 1.0',
  verbose: true,
  noCache: true
})
.catch((cause) => {
  console.error(cause);
});
