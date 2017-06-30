'use strict';

const {Transport} = require('../lib/transport.js');
const assert = require('chai').assert;

describe('Transport library', () => {
  describe('get() JSON', () => {
    const jsonUrl = 'https://api.github.com/repos/mulesoft/api-console/releases';
    const headers = {
      'Accept': 'application/vnd.github.loki-preview+json',
      'user-agent': 'mulesoft-labs/api-console-builder'
    };
    var transport;
    var json;

    before(function() {
      transport = new Transport();
      return transport.get(jsonUrl, headers)
      .then(response => {
        json = response;
      });
    });

    it('Response should be a JS object', function() {
      assert.typeOf(json, 'array');
    });

    it('Response should no be empty', function() {
      assert.isAbove(json.length, 1);
    });

    it('Transport has latest headers', function() {
      assert.typeOf(transport.latestHeaders, 'object');
    });
  });

  describe('get() Buffer', () => {
    const zipUrl = 'https://api.github.com/repos/mulesoft/api-console/zipball/v4.0.0';
    const headers = {
      'user-agent': 'mulesoft-labs/api-console-builder'
    };
    var transport;
    var response;

    before(function() {
      this.timeout(20000);
      transport = new Transport();
      return transport.get(zipUrl, headers)
      .then((res) => {
        response = res;
      });
    });

    it('Response should be a Buffer', function() {
      assert.ok(response.buffer);
    });

    it('Response should no be empty', function() {
      assert.isAbove(response.length, 1);
    });
  });
});
