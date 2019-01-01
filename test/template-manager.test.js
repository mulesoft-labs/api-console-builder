const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');
const winston = require('winston');
const {TemplateManager} = require('../lib/template-manager');

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

describe('TemplateManager', function() {
  const workingDir = path.join('test', 'playground');
  describe('constructor()', () => {
    it('Sets workingDir', () => {
      const instance = new TemplateManager(workingDir);
      assert.equal(instance.workingDir, workingDir);
    });

    it('Sets options', () => {
      const opts = {};
      const instance = new TemplateManager(undefined, opts);
      assert.isTrue(instance.opts === opts);
    });

    it('Sets logger', () => {
      const logger = getLogger();
      const instance = new TemplateManager(undefined, undefined, logger);
      assert.isTrue(instance.logger === logger);
    });
  });

  describe('_copyTemplateFile()', () => {
    let instance;
    before(() => {
      instance = new TemplateManager(workingDir, {
        buildType: 'plain'
      }, getLogger());
    });

    afterEach(() => fs.remove(workingDir));

    it('Copies the file into working directory', () => {
      return instance._copyTemplateFile()
      .then(() => fs.pathExists(path.join(workingDir, 'build', 'index.html')))
      .then((exists) => assert.isTrue(exists));
    });
  });

  describe('_copyImport()', () => {
    let instance;
    beforeEach(() => {
      instance = new TemplateManager(workingDir, {
        buildType: 'plain'
      }, getLogger());
    });

    afterEach(() => fs.remove(workingDir));

    it('Copies the file into working directory', () => {
      return instance._copyImport()
      .then(() => fs.pathExists(path.join(workingDir, 'build', 'apic-import.js')))
      .then((exists) => assert.isTrue(exists));
    });
  });

  describe('copyTemplate()', () => {
    let instance;
    beforeEach(() => {
      instance = new TemplateManager(workingDir, {
        buildType: 'plain'
      }, getLogger());
    });

    afterEach(() => fs.remove(workingDir));

    it('Copies import file', () => {
      return instance.copyTemplate()
      .then(() => fs.pathExists(path.join(workingDir, 'build', 'apic-import.js')))
      .then((exists) => assert.isTrue(exists));
    });

    it('Copies import and template files when not embedded', () => {
      return instance.copyTemplate()
      .then(() => fs.pathExists(path.join(workingDir, 'build', 'apic-import.js')))
      .then((exists) => assert.isTrue(exists))
      .then(() => fs.pathExists(path.join(workingDir, 'build', 'index.html')))
      .then((exists) => assert.isTrue(exists));
    });

    it('Will not copy template file when embedded', () => {
      instance.opts.embedded = true;
      return instance.copyTemplate()
      .then(() => fs.pathExists(path.join(workingDir, 'build', 'index.html')))
      .then((exists) => assert.isFalse(exists));
    });
  });

  describe('processTemplate()', () => {
    let instance;
    let vars;
    let tplPath;
    beforeEach(() => {
      vars = {
        apiTitle: 'TEST TITLE',
        apiFile: 'TEST FILE'
      };
      tplPath = path.join(workingDir, 'build', 'index.html');
      instance = new TemplateManager(workingDir, {
        buildType: 'model'
      }, getLogger());
      return instance._copyTemplateFile();
    });

    afterEach(() => fs.remove(workingDir));

    it('Sets API title', () => {
      return instance.processTemplate(vars)
      .then(() => fs.readFile(tplPath, 'utf8'))
      .then((contents) => {
        assert.isAbove(contents.indexOf(vars.apiTitle), 0);
      });
    });

    it('Uses default title', () => {
      delete vars.apiTitle;
      return instance.processTemplate(vars)
      .then(() => fs.readFile(tplPath, 'utf8'))
      .then((contents) => {
        assert.isAbove(contents.indexOf('<title>API console</title>'), 0);
      });
    });

    it('Sets API file', () => {
      return instance.processTemplate(vars)
      .then(() => fs.readFile(tplPath, 'utf8'))
      .then((contents) => {
        assert.isAbove(contents.indexOf(vars.apiFile), 0);
      });
    });

    it('Does nothing when embedded mode', () => {
      instance.opts.embedded = true;
      return instance.processTemplate(vars)
      .then(() => fs.readFile(tplPath, 'utf8'))
      .then((contents) => {
        assert.equal(contents.indexOf(vars.apiTitle), -1);
      });
    });


    it('Ignores API file when not set', () => {
      delete vars.apiFile;
      return instance.processTemplate(vars)
      .then(() => fs.readFile(tplPath, 'utf8'))
      .then((contents) => {
        assert.notEqual(contents.indexOf('[[AMF-API-FILE]]'), -1);
      });
    });
  });
});
