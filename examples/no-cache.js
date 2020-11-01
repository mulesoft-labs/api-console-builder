/* eslint-disable import/no-unresolved */
import { ApiConsoleProject } from '@api-components/api-console-builder';
import path from 'path';

const workingDir = path.join('build', 'no-cache');
const apiFile = path.join(__dirname, '..', 'test', 'test-apis', 'api-raml-10.raml');

const project = new ApiConsoleProject({
  destination: workingDir,
  api: apiFile,
  apiType: 'RAML 1.0',
  noCache: true,
});

(async () => {
await project.bundle();
})();
