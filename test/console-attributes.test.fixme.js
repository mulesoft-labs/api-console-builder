'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');

describe('Attributes build tests', () => {
  const workingDir = 'test/attributes-test-build';

  describe('API Console attributes setup', () => {
    describe('Optimisation enabled', () => {
      var content;
      before(function() {
        this.timeout(270000);
        return builder({
          noOptimization: false,
          src: 'test/api-console-4.2.1.zip',
          dest: workingDir,
          raml: 'test/api.raml',
          sourceIsZip: true,
          verbose: true,
          useJson: true,
          attributes: [
            {
              'append-headers': 'x-header: text',
              proxy: 'http://proxy.com',
              'json-file': 'file.json'
            },
            'narrow',
            'no-try-it',
            'proxy-encode-url'
          ]
        })
        .then(() => fs.readFile(workingDir + '/index.html', 'utf8'))
        .then((data) => {
          content = data.match(/<api-console ([^>]*)by-api-console-builder[^>]*/gm)[0];
        });
      });

      after(function() {
        return fs.remove(workingDir);
      });

      function readAttribute(attribute) {
        var reg = new RegExp(`${attribute}="([^"]*)"`);
        var match = content.match(reg);
        if (!match) {
          return;
        }
        return match[1];
      }

      function hasAttribute(attribute) {
        return content.indexOf(attribute) !== -1;
      }

      it('Should set no-tryit attribute', function() {
        assert.isTrue(hasAttribute('no-try-it'));
      });

      it('Should set narrow attribute', function() {
        assert.isTrue(hasAttribute('narrow'));
      });

      it('Should set proxy-encode-url attribute', function() {
        assert.isTrue(hasAttribute('proxy-encode-url'));
      });

      it('Should set proxy attribute', function() {
        assert.equal(readAttribute('proxy'), 'http://proxy.com');
      });

      it('Should set append-headers attribute', function() {
        assert.equal(readAttribute('append-headers'), 'x-header: text');
      });

      it('Should set json-file attribute', function() {
        assert.equal(readAttribute('json-file'), 'file.json');
      });
    });

    describe('Optimisation disabled', () => {
      var content;
      before(function() {
        this.timeout(270000);
        return builder({
          noOptimization: true,
          src: 'test/api-console-4.2.1.zip',
          dest: workingDir,
          raml: 'test/api.raml',
          sourceIsZip: true,
          verbose: false,
          useJson: true,
          attributes: [
            {
              'append-headers': 'x-header: text',
              proxy: 'http://proxy.com',
              'json-file': 'file.json'
            },
            'narrow',
            'no-try-it',
            'proxy-encode-url'
          ]
        })
        .then(() => fs.readFile(workingDir + '/index.html', 'utf8'))
        .then((data) => {
          content = data.match(/<api-console ([^>]*)by-api-console-builder[^>]*/gm)[0];
        });
      });

      after(function() {
        return fs.remove(workingDir);
      });

      function readAttribute(attribute) {
        var reg = new RegExp(`${attribute}="([^"]*)"`);
        var match = content.match(reg);
        if (!match) {
          return;
        }
        return match[1];
      }

      function hasAttribute(attribute) {
        return content.indexOf(attribute) !== -1;
      }

      it('Should set no-tryit attribute', function() {
        assert.isTrue(hasAttribute('no-try-it'));
      });

      it('Should set narrow attribute', function() {
        assert.isTrue(hasAttribute('narrow'));
      });

      it('Should set proxy-encode-url attribute', function() {
        assert.isTrue(hasAttribute('proxy-encode-url'));
      });

      it('Should set proxy attribute', function() {
        assert.equal(readAttribute('proxy'), 'http://proxy.com');
      });

      it('Should set append-headers attribute', function() {
        assert.equal(readAttribute('append-headers'), 'x-header: text');
      });

      it('Should set json-file attribute', function() {
        assert.equal(readAttribute('json-file'), 'file.json');
      });
    });
  });
});
