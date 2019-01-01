const {AmfSource} = require('../lib/amf-source');
const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');
const winston = require('winston');
const http = require('http');

const workingDir = path.join('test', 'parsing-test');

function getLogger() {
  const level = 'warn';
  const format = winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  );
  return winston.createLogger({
    level,
    format,
    exitOnError: false,
    transports: [
      new winston.transports.Console()
    ]
  });
}

describe('AMF parser', function() {
  this.timeout(500000);
  [
    ['RAML 0.8', 'api-raml-08.raml', 'YAML'],
    ['RAML 1.0', 'api-raml-10.raml', 'YAML'],
    ['OAS 2.0', 'api-oas-20.json', 'JSON'],
    ['OAS 2.0', 'api-oas-20.yaml', 'YAML'],
    ['OAS 3.0', 'api-oas-30.yaml', 'YAML']
  ].forEach((item) => {
    after(function() {
      return fs.remove(workingDir);
    });

    it('Parses: ' + item[0] + ', format: ' + item[2], function() {
      const instance = new AmfSource(getLogger());
      return instance.getModel('test/test-apis/' + item[1], item[0])
      .then((doc) => {
        assert.typeOf(doc, 'object');
        assert.typeOf(doc.encodes, 'object');
        assert.typeOf(doc.encodes.servers, 'array');
      });
    });

    it(`Stores ${item[0]} to file`, function() {
      const instance = new AmfSource(getLogger());
      const apiFile = path.join(workingDir, 'api.json');
      return instance.getModel('test/test-apis/' + item[1], item[0])
      .then((doc) => instance.saveModel(doc, apiFile))
      .then(() => fs.readJson(apiFile))
      .then((model) => {
        assert.typeOf(model, 'array', 'Model is saved');
        const api = model[0];
        assert.typeOf(api['@context'], 'object', 'Model is compact');
      });
    });
  });
});

describe('AMF parser from remote location', function() {
  const hostname = '127.0.0.1';
  const port = 3123;
  let server;
  const sockets = {};
  let nextSocketId = 0;

  function createServer() {
    return new Promise((resolve, reject) => {
      server = http.createServer((req, res) => {
        fs.readFile('test/test-apis/api-raml-10.raml', 'utf8')
        .then((content) => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/raml');
          res.end(content);
        });
      });
      server.on('connection', function(socket) {
        const socketId = nextSocketId++;
        sockets[socketId] = socket;
        socket.on('close', function() {
          delete sockets[socketId];
        });
        socket.setTimeout(1000);
      });
      server.on('error', () => reject());
      server.listen(port, hostname, () => resolve());
    });
  }

  function destroyServer() {
    return new Promise((resolve) => {
      server.close(() => {
        resolve();
      });
      Object.keys(sockets).forEach((socketId) => {
        sockets[socketId].destroy();
      });
    });
  }

  before(() => createServer());
  after(() => destroyServer());

  it('Parses remote API', function() {
    const instance = new AmfSource(getLogger());
    return instance.getModel(`http://${hostname}:${port}/`, 'RAML 1.0')
    .then((doc) => {
      assert.typeOf(doc, 'object');
      assert.typeOf(doc.encodes, 'object');
      assert.typeOf(doc.encodes.servers, 'array');
    });
  });
});
