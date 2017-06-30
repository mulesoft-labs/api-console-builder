const builder = require('./');
var configs = [{
  dest: 'build-latest',
  raml: '../raml-example-api/api.raml',
  verbose: true,
  useJson: true,
  inlineJson: true,
  noOptimization: true
}, {
  src: '../api-console/',
  dest: 'build-local-source',
  raml: '../raml-example-api/api.raml',
  verbose: true,
  useJson: true,
  noOptimization: true,
  attributes: [{
    'json-file': 'my-api.json'
  }]
}, {
  dest: 'build-with-parser',
  raml: 'https://cdn.rawgit.com/advanced-rest-client/raml-example-api/0036975d/api.raml',
  verbose: true,
  noOptimization: true
}, {
  dest: 'build-tagged',
  tagVersion: 'v4.0.0',
  verbose: true,
  noOptimization: true
}, {
  src: '../api-console/',
  raml: '../raml-example-api/api.raml',
  dest: 'build-embedded-raml',
  verbose: true,
  noOptimization: true
}];

function run() {
  var item = configs.shift();
  if (!item) {
    console.log('Finished.');
    return;
  }
  process(item);
}

function process(config) {
  console.log('');
  console.log('Building ' +  config.dest + '...');
  builder(config)
  .then(() => {
    console.log('Build ' +  config.dest + ' complete');
    setTimeout(run, 1);
  })
  .catch((cause) => console.log('Build error', cause.message));
}

run();
