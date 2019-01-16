'use strict';

const builder = require('..');
const path = require('path');

const workingDir = path.join('build', 'attributes');
const apiFile = path.join(__dirname, '..', 'test', 'test-apis', 'api-oas-20.json');

/**
 * Sets zattributes on the `<api-console>` element.
 * Tis is later passed as a configuration options when API console is initialized.
 */
builder({
  destination: workingDir,
  api: apiFile,
  apiType: 'OAS 2.0',
  apiMediaType: 'application/json',
  verbose: true,
  attributes: [
    'no-try-it',
    'no-extension-banner',
    {
      'responsive-width': '680px',
      'append-headers': 'x-api-token: test-123\nx-api-console: true'
    }
  ]
})
.catch((cause) => {
  console.error(cause);
});
