'use strict';

const {TemplatesProcessor} = require('../lib/templates');
const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');

describe('TemplatesProcessor', () => {
  const logger = {
    warn: function() {},
    info: function() {},
    log: function() {}
  };
  const workingDir = 'test-build';

  describe('setTemplates()', () => {
    var processor;
    const opts = {};

    beforeEach(function() {
      var options = Object.assign({}, opts);
      processor = new TemplatesProcessor(options, logger, workingDir);
    });

    it('The templateUsed variable is undefined', function() {
      assert.isUndefined(processor.templateUsed);
    });

    it('Sets templateUsed to false', function() {
      processor.opts.mainFile = 'test-file';
      processor.setTemplates();
      assert.isFalse(processor.templateUsed);
    });

    it('Sets templateUsed to true', function() {
      processor.setTemplates();
      assert.isTrue(processor.templateUsed);
    });

    it('Uses standalone and plain template', function() {
      processor.setTemplates();
      assert.equal(processor.templateFile, 'standalone-plain.tpl');
    });

    it('Uses standalone and json template', function() {
      processor.opts.useJson = true;
      processor.setTemplates();
      assert.equal(processor.templateFile, 'standalone-json.tpl');
    });

    it('Uses standalone, json and inline template', function() {
      processor.opts.useJson = true;
      processor.opts.inlineJson = true;
      processor.setTemplates();
      assert.equal(processor.templateFile, 'standalone-json-inline.tpl');
    });

    it('Uses standalone and RAML template', function() {
      processor.opts.raml = 'file';
      processor.setTemplates();
      assert.equal(processor.templateFile, 'standalone-raml.tpl');
    });

    it('Do not sets example template', function() {
      processor.opts.raml = 'file';
      processor.setTemplates();
      assert.isUndefined(processor.exampleFile);
    });

    it('Uses embedded and plain template', function() {
      processor.opts.embedded = true;
      processor.setTemplates();
      assert.equal(processor.templateFile, 'embedded-plain.tpl');
    });

    it('Sets the example template for plain', function() {
      processor.opts.embedded = true;
      processor.setTemplates();
      assert.equal(processor.exampleFile, 'embedded-plain-example.tpl');
    });

    it('Uses embedded and json template', function() {
      processor.opts.embedded = true;
      processor.opts.useJson = true;
      processor.setTemplates();
      assert.equal(processor.templateFile, 'embedded-json.tpl');
    });

    it('Sets the example template for JSON', function() {
      processor.opts.embedded = true;
      processor.opts.useJson = true;
      processor.setTemplates();
      assert.equal(processor.exampleFile, 'embedded-json-example.tpl');
    });

    it('Uses embedded, json and inline template', function() {
      processor.opts.embedded = true;
      processor.opts.useJson = true;
      processor.opts.inlineJson = true;
      processor.setTemplates();
      assert.equal(processor.templateFile, 'embedded-json-inline.tpl');
    });

    it('Sets the example template for inline JSON', function() {
      processor.opts.embedded = true;
      processor.opts.useJson = true;
      processor.opts.inlineJson = true;
      processor.setTemplates();
      assert.equal(processor.exampleFile, 'embedded-json-inline-example.tpl');
    });

    it('Uses embedded and json template', function() {
      processor.opts.embedded = true;
      processor.opts.raml = 'file';
      processor.setTemplates();
      assert.equal(processor.templateFile, 'embedded-raml.tpl');
    });

    it('Sets the example template for raml', function() {
      processor.opts.embedded = true;
      processor.opts.raml = 'file';
      processor.setTemplates();
      assert.equal(processor.exampleFile, 'embedded-raml-example.tpl');
    });
  });

  describe('copyTemplateFiles()', () => {
    var processor;
    const opts = {};
    const standaloneMainFile = path.join(workingDir, 'index.html');
    const embeddedMainFile = path.join(workingDir, 'import.html');
    const exampleFile = path.join(workingDir, 'example.html');

    function standaloneResultTest() {
      return fs.pathExists(standaloneMainFile)
      .then((exists) => {
        assert.isTrue(exists);
      })
      .then(() => {
        return fs.pathExists(exampleFile);
      })
      .then((exists) => {
        assert.isFalse(exists);
      });
    }

    function embeddedResultTest() {
      return fs.pathExists(embeddedMainFile)
      .then((exists) => {
        assert.isTrue(exists);
      })
      .then(() => {
        return fs.pathExists(exampleFile);
      })
      .then((exists) => {
        assert.isTrue(exists);
      });
    }

    beforeEach(function() {
      var options = Object.assign({}, opts);
      processor = new TemplatesProcessor(options, logger, workingDir);
    });

    afterEach(function() {
      return fs.remove(workingDir);
    });

    it('Promise return an error when not calling setTemplates()', function() {
      return processor.copyTemplateFiles()
      .then(() => {
        throw new Error('TEST');
      })
      .catch(function(cause) {
        assert.notEqual(cause.message, 'TEST');
      });
    });

    it('Copies standalone and plain template', function() {
      processor.setTemplates();
      return processor.copyTemplateFiles()
      .then(() => standaloneResultTest());
    });

    it('Copies standalone and JSON template', function() {
      processor.opts.useJson = true;
      processor.setTemplates();
      return processor.copyTemplateFiles()
      .then(() => standaloneResultTest());
    });

    it('Copies standalone and JSON inline template', function() {
      processor.opts.useJson = true;
      processor.opts.inlineJson = true;
      processor.setTemplates();
      return processor.copyTemplateFiles()
      .then(() => standaloneResultTest());
    });

    it('Copies standalone and RAML template', function() {
      processor.opts.raml = 'file';
      processor.setTemplates();
      return processor.copyTemplateFiles()
      .then(() => standaloneResultTest());
    });

    it('Copies standalone and plain template', function() {
      processor.opts.embedded = true;
      processor.setTemplates();
      return processor.copyTemplateFiles()
      .then(() => embeddedResultTest());
    });

    it('Copies standalone and JSON template', function() {
      processor.opts.embedded = true;
      processor.opts.useJson = true;
      processor.setTemplates();
      return processor.copyTemplateFiles()
      .then(() => embeddedResultTest());
    });

    it('Copies standalone and JSON inline template', function() {
      processor.opts.embedded = true;
      processor.opts.useJson = true;
      processor.opts.inlineJson = true;
      processor.setTemplates();
      return processor.copyTemplateFiles()
      .then(() => embeddedResultTest());
    });

    it('Copies standalone and RAML template', function() {
      processor.opts.embedded = true;
      processor.opts.raml = 'file';
      processor.setTemplates();
      return processor.copyTemplateFiles()
      .then(() => embeddedResultTest());
    });
  });

  describe('updateTemplateVars()', () => {
    var processor;
    const opts = {};
    const standaloneMainFile = path.join(workingDir, 'index.html');
    const exampleFile = path.join(workingDir, 'example.html');
    const RAML = {
      title: 'Test based API'
    };

    beforeEach(function() {
      var options = Object.assign({}, opts);
      processor = new TemplatesProcessor(options, logger, workingDir);
    });

    afterEach(function() {
      return fs.remove(workingDir);
    });

    it('Quietly resolves when not calling setTemplates()', function() {
      return processor.updateTemplateVars();
    });

    it('Quietly resolves when not setting RAML', function() {
      processor.setTemplates();
      return processor.updateTemplateVars();
    });

    it('Updates variables for standalone raml', function() {
      processor.opts.raml = 'file';
      processor.setTemplates();
      return processor.copyTemplateFiles()
      .then(() => processor.updateTemplateVars(RAML))
      .then(() => fs.readFile(standaloneMainFile, 'utf8'))
      .then((content) => {
        assert.equal(content.indexOf('[[API-FILE-URL]]'), -1, 'File URL is updated');
        assert.equal(content.indexOf('[[API-TITLE]]'), -1, 'API title is updated');
      });
    });

    it('Updates variables for standalone JSON', function() {
      processor.opts.useJson = true;
      processor.setTemplates();
      return processor.copyTemplateFiles()
      .then(() => processor.updateTemplateVars(RAML))
      .then(() => fs.readFile(standaloneMainFile, 'utf8'))
      .then((content) => {
        assert.equal(content.indexOf('[[API-TITLE]]'), -1, 'API title is updated');
      });
    });

    it('Updates variables for standalone inline JSON', function() {
      processor.opts.useJson = true;
      processor.opts.inlineJson = true;
      processor.setTemplates();
      return processor.copyTemplateFiles()
      .then(() => processor.updateTemplateVars(RAML))
      .then(() => fs.readFile(standaloneMainFile, 'utf8'))
      .then((content) => {
        assert.equal(content.indexOf('[[API-TITLE]]'), -1, 'API title is updated');
        assert.equal(content.indexOf('[[API-DATA]]'), -1, 'Api data is updated');
      });
    });

    it('Updates variables for embedded raml', function() {
      processor.opts.raml = 'file';
      processor.opts.embedded = true;
      processor.setTemplates();
      return processor.copyTemplateFiles()
      .then(() => processor.updateTemplateVars(RAML))
      .then(() => fs.readFile(exampleFile, 'utf8'))
      .then((content) => {
        assert.equal(content.indexOf('[[API-FILE-URL]]'), -1, 'File URL is updated');
        assert.equal(content.indexOf('[[API-TITLE]]'), -1, 'API title is updated');
      });
    });

    it('Updates variables for embedded JSON', function() {
      processor.opts.useJson = true;
      processor.opts.embedded = true;
      processor.setTemplates();
      return processor.copyTemplateFiles()
      .then(() => processor.updateTemplateVars(RAML))
      .then(() => fs.readFile(exampleFile, 'utf8'))
      .then((content) => {
        assert.equal(content.indexOf('[[API-TITLE]]'), -1, 'API title is updated');
      });
    });

    it('Updates variables for embedded inline JSON', function() {
      processor.opts.useJson = true;
      processor.opts.inlineJson = true;
      processor.opts.embedded = true;
      processor.setTemplates();
      return processor.copyTemplateFiles()
      .then(() => processor.updateTemplateVars(RAML))
      .then(() => fs.readFile(exampleFile, 'utf8'))
      .then((content) => {
        assert.equal(content.indexOf('[[API-TITLE]]'), -1, 'API title is updated');
        assert.equal(content.indexOf('[[API-DATA]]'), -1, 'Api data is updated');
      });
    });
  });
});
