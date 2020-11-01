/* eslint-disable import/no-unresolved */
import { ApiConsoleProject } from '@api-components/api-console-builder';
import path from 'path';

const workingDir = path.join('build', 'attributes');
const apiFile = path.join(__dirname, '..', 'test', 'test-apis', 'api-oas-20.json');

const project = new ApiConsoleProject({
  destination: workingDir,
  api: apiFile,
  apiType: 'OAS 2.0',
  apiMediaType: 'application/json',
  attributes: [
    'notryit',
    'noextensionbanner',
    {
      'responsivewidth': '680px',
      'appendheaders': 'x-api-token: test-123\nx-api-console: true',
    },
  ],
});

(async () => {
await project.bundle();
})();
