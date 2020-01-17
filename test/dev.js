const { ApiConsoleProject } = require('..');
const workingDir = 'build/dev';

const project = new ApiConsoleProject({
  destination: workingDir,
  tagName: '6.0.0',
  api: 'test/test-apis/api-raml-10.raml',
  apiType: 'RAML 1.0',
  verbose: true,
  noCache: true,
  attributes: []
});
project.bundle()
.then(() => console.log('ready'))
.catch((cause) => console.error(cause));
