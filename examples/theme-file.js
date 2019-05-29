'use strict';

const builder = require('..');
const path = require('path');

const workingDir = path.join('build', 'theme');
const apiFile = path.join(__dirname, '..', 'test', 'test-apis', 'api-raml-10.raml');

/**
 * Builds the console with generated AMF ld+json data model.
 */
builder({
  destination: workingDir,
  tagName: '5.0.0-rc.2',
  api: apiFile,
  apiType: 'RAML 1.0',
  verbose: true,
  themeFile: path.join(__dirname, '..', 'test', 'apic-theme-file.html')
})
.catch((cause) => {
  console.error(cause);
});