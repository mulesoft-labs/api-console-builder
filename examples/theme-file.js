import { ApiConsoleProject } from '@api-components/api-console-builder';
import path from 'path';

const workingDir = path.join('build', 'theme');
const apiFile = path.join(__dirname, '..', 'test', 'test-apis', 'api-raml-10.raml');

const project = new ApiConsoleProject({
  destination: workingDir,
  api: apiFile,
  apiType: 'RAML 1.0',
  themeFile: path.join(__dirname, '..', 'test', 'apic-theme-file.css')
});
(async () => {
  await project.bundle();
})();
