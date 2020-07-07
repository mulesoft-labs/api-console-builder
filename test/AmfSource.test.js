import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import winston from 'winston';
import http from 'http';
import { AmfSource } from '../lib/AmfSource.js';

const workingDir = path.join('test', 'parsing-test');

/**
 * @return {winston.Logger}
 */
function getLogger() {
  const level = 'warn';
  const format = winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
  );
  return winston.createLogger({
    level,
    format,
    exitOnError: false,
    transports: [
      new winston.transports.Console(),
    ],
  });
}

describe('AmfSource', () => {
  describe('Parsing local API data', () => {
    [
      ['RAML 0.8', 'api-raml-08.raml', 'application/yaml'],
      ['RAML 1.0', 'api-raml-10.raml', 'application/yaml'],
      ['OAS 2.0', 'api-oas-20.json', 'application/json'],
      ['OAS 2.0', 'api-oas-20.yaml', 'application/yaml'],
      ['OAS 3.0', 'api-oas-30.yaml', 'application/yaml'],
    ].forEach(([type, file, mime]) => {
      after(async () => {
        await fs.remove(workingDir);
      });

      it(`Parses ${type} with ${mime} mime`, async () => {
        const instance = new AmfSource(getLogger());
        const doc = await instance.getModel(`test/test-apis/${file}`, type, mime);
        assert.typeOf(doc, 'object');
        assert.typeOf(doc.encodes, 'object');
        // @ts-ignore
        assert.typeOf(doc.encodes.servers, 'array');
      });

      it(`Stores ${type} to file`, async () => {
        const instance = new AmfSource(getLogger());
        const apiFile = path.join(workingDir, 'api.json');
        const doc = await instance.getModel(`test/test-apis/${file}`, type, mime);
        await instance.saveModel(doc, apiFile);
        const model = await fs.readJson(apiFile);
        assert.typeOf(model, 'array', 'Model is saved');
        const api = model[0];
        assert.typeOf(api['@context'], 'object', 'Model is compact');
      });
    });
  });

  describe('Parsing remote API data', () => {
    const hostname = '127.0.0.1';
    const port = 3123;
    let server;
    const sockets = {};
    let nextSocketId = 0;

    /**
     * @return {Promise<void>}
     */
    function createServer() {
      return new Promise((resolve, reject) => {
        server = http.createServer(async (req, res) => {
          const content = await fs.readFile('test/test-apis/api-raml-10.raml', 'utf8');
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/raml');
          res.end(content);
        });
        server.on('connection', (socket) => {
          const socketId = nextSocketId++;
          sockets[socketId] = socket;
          socket.on('close', () => {
            delete sockets[socketId];
          });
          socket.setTimeout(1000);
        });
        server.on('error', () => reject(new Error('server start error')));
        server.listen(port, hostname, () => resolve());
      });
    }

    /**
     * @return {Promise<void>}
     */
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

    it('parses remote API', async () => {
      const instance = new AmfSource(getLogger());
      const doc = await instance.getModel(`http://${hostname}:${port}/`, 'RAML 1.0');
      assert.typeOf(doc, 'object');
      assert.typeOf(doc.encodes, 'object');
      // @ts-ignore
      assert.typeOf(doc.encodes.servers, 'array');
    });
  });
});
