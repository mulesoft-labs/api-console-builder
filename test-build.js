const builder = require('./');

builder({
  src: '../../api-console',
  dest: 'build-test',
  raml: '../raml-example-api/api.raml',
  verbose: true,
  useJson: true,
  inlineJson: true,
  noOptimization: true
})
.then(() => console.log('Build complete'))
.catch((cause) => console.log('Build error', cause.message));
