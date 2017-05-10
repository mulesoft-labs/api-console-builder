'use strict';

const builder = require('..');
const assert = require('chai').assert;
const fs = require('fs-extra');

describe('api-console-builder', () => {
  describe('API Console attributes setup', () => {
    var content;
    before(function() {
      this.timeout(120000);
      return builder({
        noOptimization: true,
        src: 'test/api-console-release-4.0.0.zip',
        dest: 'build',
        raml: 'test/api.raml',
        sourceIsZip: true,
        verbose: false,
        useJson: true,
        noTryit: true,
        narrowView: true,
        proxy: 'http://proxy.com',
        proxyEncodeUrl: true,
        appendHeaders: 'x-header: text'
      })
      .then(() => fs.readFile('build/index.html', 'utf8'))
      .then((data) => {
        content = data.match(/<api-console data-ac-build.*><\/api-console>/gm)[0];
      });
    });

    after(function(done) {
      fs.remove('build')
      .then(() => {
        done();
      });
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
      assert.isTrue(hasAttribute('no-tryit'));
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
  });
});
