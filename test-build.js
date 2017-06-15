const builder = require('./');

builder({
  src: '../../api-console',
  dest: 'test-build',
  raml: 'https://cdn.rawgit.com/advanced-rest-client/drive-raml-api-v2/1f85d308/api.raml',
  verbose: true,
  useJson: true,
  inlineJson: true,
  noOptimization: true
})
.then(() => console.log('Build complete'))
.catch((cause) => console.log('Build error', cause.message));
