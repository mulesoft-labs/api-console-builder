'use strict';

const {GithubResolver} = require('../lib/github-resolver.js');
const assert = require('chai').assert;

describe('GitHub resolver', () => {
  describe('basics', () => {
    var resolver;
    before(function() {
      resolver = new GithubResolver();
    });

    it('_getResetTime() returns -1', function() {
      assert.equal(resolver._getResetTime(), -1);
    });

    it('_assertCanMakeRequest() do not throws error', function() {
      resolver._assertCanMakeRequest();
    });
  });

  describe('_assertTag()', () => {
    var resolver;
    before(function() {
      resolver = new GithubResolver();
    });

    it('do not throws error for 4.0.0', function() {
      resolver._assertTag('4.0.0');
    });

    it('do not throws error for 4.1.0', function() {
      resolver._assertTag('4.1.0');
    });

    it('do not throws error for 4.1.1', function() {
      resolver._assertTag('4.1.1');
    });

    it('do not throws error for v4.0.1', function() {
      resolver._assertTag('v4.0.1');
    });

    it('throws for version lower than 4.0.0', function() {
      assert.throws(function() {
        resolver._assertTag('3.0.0');
      });
    });

    it('throws for version lower than v4.0.0', function() {
      assert.throws(function() {
        resolver._assertTag('v3.0.0');
      });
    });
  });

  describe('_filterSupportedTags()', () => {
    var list = [{
      tag_name: '2.0.0'
    }, {
      tag_name: 'v2.0.0'
    }, {
      tag_name: '3.1.0-alpha'
    }, {
      tag_name: 'v4.0.0'
    }, {
      tag_name: '4.1.0'
    }, {
      tag_name: 'v4.0.1-test'
    }, {
      tag_name: 'v4.0.2-alpha',
      prerelease: true
    }, {
      tag_name: 'v4.2.0'
    }];

    var resolver;
    before(function() {
      resolver = new GithubResolver();
    });

    it('Should filter preleases', function() {
      var result = resolver._filterSupportedTags(list);
      var item = result.find(item => item.prerelease);
      assert.notOk(item);
    });

    it('Should filter out versions lower than major 4', function() {
      var result = resolver._filterSupportedTags(list);
      var item = result.find(item => (item.tag_name.indexOf('v2') !== -1 &&
        item.tag_name.indexOf('v3') !== -1 &&
        item.tag_name.indexOf('v3') !== -1 && item.tag_name.indexOf('3') !== -1));
      assert.notOk(item);
    });
  });

  describe('_sortTags()', () => {
    var list = [{
      tag_name: '2.0.0'
    }, {
      tag_name: 'v2.0.1'
    }, {
      tag_name: '3.1.0-alpha'
    }, {
      tag_name: 'v4.0.0'
    }, {
      tag_name: '4.1.0'
    }, {
      tag_name: 'v4.0.1-test'
    }, {
      tag_name: 'v4.0.2-alpha',
      prerelease: true
    }, {
      tag_name: 'v4.2.0'
    }];

    var resolver;
    before(function() {
      resolver = new GithubResolver();
    });

    it('Should sort tags', function() {
      list.sort(resolver._sortTags.bind(resolver));
      assert.equal(list[0].tag_name, 'v4.2.0');
      assert.equal(list[1].tag_name, '4.1.0');
      assert.equal(list[2].tag_name, 'v4.0.2-alpha');
      assert.equal(list[3].tag_name, 'v4.0.1-test');
      assert.equal(list[4].tag_name, 'v4.0.0');
      assert.equal(list[5].tag_name, '3.1.0-alpha');
      assert.equal(list[6].tag_name, 'v2.0.1');
      assert.equal(list[7].tag_name, '2.0.0');
    });
  });

  describe('getLatestInfo()', () => {
    var resolver;
    var response;
    before(function() {
      resolver = new GithubResolver();
      return resolver.getLatestInfo()
      .then((res) => {
        response = res;
      });
    });

    it('Response is an object', function() {
      assert.typeOf(response, 'object');
    });

    it('Contains zipball_url', function() {
      // jscs: disable
      assert.ok(response.zipball_url);
      // jscs: enable
    });

    it('Contains tag_name', function() {
      // jscs: disable
      assert.ok(response.tag_name);
      // jscs: enable
    });
  });

  describe('getReleasesList()', () => {
    var resolver;
    var response;
    before(function() {
      resolver = new GithubResolver();
      return resolver.getReleasesList()
      .then((res) => {
        response = res;
      });
    });

    it('Response is an array', function() {
      assert.typeOf(response, 'array');
    });

    it('Response array is not empty', function() {
      assert.isAbove(response.length, 1);
    });

    it('Entry contains zipball_url', function() {
      // jscs: disable
      assert.ok(response[0].zipball_url);
      // jscs: enable
    });

    it('Entry contains tag_name', function() {
      // jscs: disable
      assert.ok(response[0].tag_name);
      // jscs: enable
    });
  });

  describe('getTagInfo()', () => {
    var resolver;
    var response;
    before(function() {
      resolver = new GithubResolver();
      return resolver.getTagInfo('v4.0.0')
      .then((res) => {
        response = res;
      });
    });

    it('Response is an object', function() {
      assert.typeOf(response, 'object');
    });

    it('Contains zipball_url', function() {
      // jscs: disable
      assert.ok(response.zipball_url);
      // jscs: enable
    });

    it('Contains tag_name', function() {
      // jscs: disable
      assert.ok(response.tag_name);
      // jscs: enable
    });
  });

  describe('getTagInfo() error', () => {
    var resolver;
    before(function() {
      resolver = new GithubResolver();
    });

    it('Will throw an error for tags below 4.0.0', function() {
      return resolver.getTagInfo('v3.0.0')
      .then(() => {
        throw new Error('TEST');
      })
      .catch((cause) => {
        if (cause.message === 'TEST') {
          throw new Error('Passed invalid tag');
        }
      });
    });

    it('Will throw an error for non existing tags', function() {
      return resolver.getTagInfo('152.22.9820')
      .then(() => {
        throw new Error('TEST');
      })
      .catch((cause) => {
        if (cause.message === 'TEST') {
          throw new Error('Passed invalid tag');
        }
      });
    });
  });

});
