'use strict';

const builder = require('..');
const path = require('path');

const workingDir = path.join('build', 'model-oas');
const apiFile = path.join(__dirname, '..', 'test', 'test-apis', 'api-oas-20.json');

/**
 * Builds the console with generated AMF ld+json data model.
 */
builder({
  destination: workingDir,
  api: apiFile,
  apiType: 'OAS 2.0',
  apiMediaType: 'application/json',
  verbose: true
})
.catch((cause) => {
  console.error(cause);
});
