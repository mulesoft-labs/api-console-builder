'use strict';

const {AttributesProcessor} = require('../lib/attributes.js');
const assert = require('chai').assert;
const path = require('path');
const fs = require('fs-extra');

describe('AttributesProcessor', () => {
  // Writtes a dummy HTML file to parse.
  function writeMainFile(file) {
    var content = `<html>
    <head></head>
    <body>
      <header>API Console test</header>
      <section>
        <h1>Test</h1>
        <div>
          <api-console x-attr="test"></api-console>
        </div>
      </section>
    </body></html>`;
    return fs.writeFile(file, content, 'utf8');
  }

  const logger = {
    warn: function() {},
    info: function() {},
    log: function() {}
  };
  const workingDir = 'test/attributes-class-test';
  const attributes = [
    'test',
    'other-test',
    {'attr-with-value': 'value'}
  ];
  const mainFile = 'main-file.html';

  describe('listAttributes()', () => {
    var processor;
    const opts = {
      attributes: attributes
    };
    beforeEach(function() {
      processor = new AttributesProcessor(opts, logger, workingDir);
    });

    it('Returns an array', function() {
      const result = processor.listAttributes();
      assert.typeOf(result, 'array');
    });

    it('Returns not empty array', function() {
      const result = processor.listAttributes();
      assert.lengthOf(result, 3);
    });

    it('Each item contains a name property', function() {
      const result = processor.listAttributes();
      for (let i = 0, len = result.length; i < len; i++) {
        assert.ok(result[i].name);
      }
    });

    it('Each item contains a value property with string value', function() {
      const result = processor.listAttributes();
      for (let i = 0, len = result.length; i < len; i++) {
        assert.typeOf(result[i].value, 'string');
      }
    });

    it('Contains a list of passed attributes', function() {
      const result = processor.listAttributes();
      const compare = [{
        name: 'test',
        value: ''
      }, {
        name: 'other-test',
        value: ''
      }, {
        name: 'attr-with-value',
        value: 'value'
      }];
      assert.deepEqual(result, compare);
    });
  });

  describe('setMainFile()', () => {
    var processor;
    const opts = {
      attributes: attributes
    };

    beforeEach(function() {
      processor = new AttributesProcessor(opts, logger, workingDir);
    });

    it('Sets main file from opts.main file', function() {
      processor.opts.mainFile = 'api-test.test';
      processor.setMainFile();
      const compare = path.join(workingDir, 'api-test.test');
      assert.equal(processor.mainFile, compare);
    });

    it('Sets main file to example.html form embedded builds', function() {
      processor.opts.mainFile = 'api-test.test';
      processor.opts.embedded = true;
      processor.setMainFile();
      const compare = path.join(workingDir, 'example.html');
      assert.equal(processor.mainFile, compare);
    });
  });

  describe('readMainFile()', () => {
    var processor;
    const opts = {
      attributes: attributes,
      mainFile: mainFile
    };

    before(function() {
      return fs.ensureDir(workingDir)
      .then(() => writeMainFile(path.join(workingDir, mainFile)));
    });

    after(function() {
      return fs.remove(workingDir);
    });

    beforeEach(function() {
      processor = new AttributesProcessor(opts, logger, workingDir);
    });

    it('Sets mainFile property', function() {
      return processor.readMainFile()
      .then(function() {
        assert.isDefined(processor.mainFile);
      });
    });

    it('Reads the main file', function() {
      return processor.readMainFile()
      .then(function(content) {
        assert.typeOf(content, 'string');
      });
    });
  });

  describe('findConsole()', () => {
    var processor;
    const opts = {
      attributes: attributes,
      mainFile: mainFile
    };
    var doc;

    before(function() {
      return fs.ensureDir(workingDir)
      .then(() => writeMainFile(path.join(workingDir, mainFile)));
    });

    after(function() {
      return fs.remove(workingDir);
    });

    beforeEach(function() {
      processor = new AttributesProcessor(opts, logger, workingDir);
      return processor.readMainFile()
      .then(content => processor.createAst(content))
      .then((ast) => {
        doc = ast;
      });
    });

    it('Parses main file', function() {
      assert.typeOf(doc, 'object');
    });

    it('Finds a console node', function() {
      var node = processor.findConsole(doc);
      assert.ok(node);
      assert.equal(node.nodeName, 'api-console');
    });
  });

  describe('updateAttributes()', () => {
    var processor;
    const opts = {
      attributes: attributes,
      mainFile: mainFile
    };
    var node;
    var list;

    before(function() {
      return fs.ensureDir(workingDir)
      .then(() => writeMainFile(path.join(workingDir, mainFile)));
    });

    after(function() {
      return fs.remove(workingDir);
    });

    beforeEach(function() {
      processor = new AttributesProcessor(opts, logger, workingDir);
      list = processor.listAttributes();
      return processor.readMainFile()
      .then(content => processor.createAst(content))
      .then((ast) => {
        return processor.findConsole(ast);
      })
      .then((_node) => {
        node = _node;
      });
    });

    it('Updates attributes on the API Console', function() {
      processor.updateAttributes(node, list);
      assert.typeOf(node.attrs, 'array');
    });

    it('Node has 4 attributes', function() {
      processor.updateAttributes(node, list);
      assert.lengthOf(node.attrs, 4);
    });

    it('Updating existing attribute does not change array size', function() {
      list.push({
        name: 'x-attr',
        value: 'replaced'
      });
      processor.updateAttributes(node, list);
      assert.lengthOf(node.attrs, 4);
    });

    it('Updates attribute value', function() {
      list.push({
        name: 'x-attr',
        value: 'replaced'
      });
      processor.updateAttributes(node, list);
      assert.equal(node.attrs[0].value, 'replaced');
    });
  });

  describe('setAttributes()', () => {
    var processor;
    const opts = {
      attributes: attributes,
      mainFile: mainFile
    };
    const mainFileLocation = path.join(workingDir, mainFile);

    afterEach(function() {
      return fs.remove(workingDir);
    });

    beforeEach(function() {
      return fs.ensureDir(workingDir)
      .then(() => writeMainFile(mainFileLocation))
      .then(() => {
        processor = new AttributesProcessor(opts, logger, workingDir);
      });
    });

    it('Parsed file contains by-api-console-builder', function() {
      return processor.setAttributes()
      .then(() => fs.readFile(mainFileLocation, 'utf8'))
      .then((content) => {
        assert.isTrue(content.indexOf('by-api-console-builder') !== -1);
      });
    });

    it('Parsed file contains pre-existing attribute', function() {
      return processor.setAttributes()
      .then(() => fs.readFile(mainFileLocation, 'utf8'))
      .then((content) => {
        assert.isTrue(content.indexOf('x-attr') !== -1);
      });
    });

    it('Parsed file contains boolean attribute', function() {
      return processor.setAttributes()
      .then(() => fs.readFile(mainFileLocation, 'utf8'))
      .then((content) => {
        assert.isTrue(content.indexOf('other-test') !== -1);
      });
    });

    it('Parsed file contains string attribute', function() {
      return processor.setAttributes()
      .then(() => fs.readFile(mainFileLocation, 'utf8'))
      .then((content) => {
        assert.isTrue(content.indexOf('attr-with-value="value"') !== -1);
      });
    });

    it('Parsed file contains updated attribute', function() {
      processor.opts.attributes.push({'x-attr': 'replaced'});
      return processor.setAttributes()
      .then(() => fs.readFile(mainFileLocation, 'utf8'))
      .then((content) => {
        assert.isTrue(content.indexOf('x-attr="replaced"') !== -1);
      });
    });
  });
});
