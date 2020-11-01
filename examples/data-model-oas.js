/* eslint-disable import/no-unresolved */
import { ApiConsoleProject } from '@api-components/api-console-builder';
import path from 'path';

const workingDir = path.join('build', 'oas');
const apiFile = path.join(__dirname, '..', 'test', 'test-apis', 'api-oas-20.json');

const project = new ApiConsoleProject({
  destination: workingDir,
  api: apiFile,
  apiType: 'OAS 2.0',
  apiMediaType: 'application/json',
});

(async () => {
await project.bundle();
})();
