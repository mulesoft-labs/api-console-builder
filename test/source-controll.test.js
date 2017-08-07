'use strict';

const {SourceControl} = require('../lib/source-control');
const {BuilderOptions} = require('../lib/builder-options');
const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');

describe('SourceControl', () => {
  const logger = {
    warn: function() {
      console.warn.apply(console, arguments);
    },
    info: function() {
      console.info.apply(console, arguments);
    },
    log: function() {
      console.log.apply(console, arguments);
    }
  };
  const workingDir = 'playground/source-control-test';
  const opts = {};

  describe('createWorkingDir()', () => {
    var processor;
    beforeEach(function() {
      var options = Object.assign({}, opts);
      processor = new SourceControl(options, logger);
    });

    it('Creates a temporary location', function() {
      return processor.createWorkingDir()
      .then(path => {
        assert.isString(path);
        return path;
      })
      .then(path => processor.cleanup(path));
    });

    // This is important for Polymer Builder.
    it('Temporary location is not a symbolic link', function() {
      var _path;
      return processor.createWorkingDir()
      .then(p => {
        _path = p;
        return fs.stat(_path);
      })
      .then(stats => {
        assert.isFalse(stats.isSymbolicLink());
      })
      .then(() => processor.cleanup(_path));
    });
  });

  describe('cleanup()', () => {
    var processor;
    beforeEach(function() {
      var options = Object.assign({}, opts);
      processor = new SourceControl(options, logger);
    });

    it('Clears temportary location with files', function() {
      var _path;
      return processor.createWorkingDir()
      .then(_p => {
        _path = _p;
        return fs.writeFile(path.join(_p, 'test.log'), 'test', 'utf8');
      })
      .then(() => processor.cleanup(_path))
      .then(() => {
        return fs.pathExists(_path);
      })
      .then((result) => {
        assert.isFalse(result);
      });
    });
  });

  describe('copyOutput()', () => {
    var processor;
    var tmpWorkingDir;

    function finishTest(files) {
      var promise = [];
      if (files instanceof Array) {
        let list = files.map((file) => fs.pathExists(file));
        promise = Promise.all(list);
      } else {
        promise = fs.pathExists(files);
      }
      return promise
      .then((result) => {
        if (result instanceof Array) {
          result = result.some((item) => item === false);
          assert.isFalse(result);
        } else {
          assert.isTrue(result);
        }
      });
    }

    beforeEach(function() {
      var options = Object.assign({}, opts);
      options.dest = workingDir;
      options.attributes = [{
        'json-file': 'api-data.json'
      }];
      options = new BuilderOptions(options);
      processor = new SourceControl(options, logger);
      return processor.createWorkingDir()
      .then((loc) => {
        tmpWorkingDir = loc;
        return fs.ensureDir(path.join(tmpWorkingDir, 'build'));
      })
      .then(() => {
        return fs.ensureDir(path.join(tmpWorkingDir, 'build', 'other'));
      })
      .then(() => {
        return fs.writeFile(path.join(tmpWorkingDir, 'build', 'test.log'), 'test', 'utf8');
      })
      .then(() => {
        return fs.writeFile(path.join(tmpWorkingDir, 'build', 'other', 'test.log'), 'test', 'utf8');
      })
      .then(() => {
        return fs.writeFile(path.join(tmpWorkingDir, 'api-data.json'), 'test', 'utf8');
      })
      .then(() => {
        return fs.writeFile(path.join(tmpWorkingDir, 'example.html'), 'test', 'utf8');
      });
    });

    afterEach(function() {
      return fs.remove(workingDir);
    });

    it('Copies all required files', function() {
      processor.opts.useJson = true;
      processor.opts.embedded = true;
      return processor.copyOutput(tmpWorkingDir, 'build')
      .then(() => {
        return finishTest([
          path.join(workingDir, 'other'),
          path.join(workingDir, 'other', 'test.log'),
          path.join(workingDir, 'test.log'),
          path.join(workingDir, 'api-data.json'),
          path.join(workingDir, 'example.html')
        ]);
      });
    });

    it('Copies all required files for standalone', function() {
      processor.opts.useJson = true;
      return processor.copyOutput(tmpWorkingDir, 'build')
      .then(() => {
        return finishTest([
          path.join(workingDir, 'other'),
          path.join(workingDir, 'other', 'test.log'),
          path.join(workingDir, 'test.log'),
          path.join(workingDir, 'api-data.json')
        ]);
      })
      .then(() => {
        return fs.pathExists(path.join(workingDir, 'example.html'));
      })
      .then((result) => {
        assert.isFalse(result);
      });
    });

    it('Copies all required files for inline JSON', function() {
      processor.opts.useJson = true;
      processor.opts.inlineJson = true;
      return processor.copyOutput(tmpWorkingDir, 'build')
      .then(() => {
        return finishTest([
          path.join(workingDir, 'other'),
          path.join(workingDir, 'other', 'test.log'),
          path.join(workingDir, 'test.log')
        ]);
      })
      .then(() => {
        return fs.pathExists(path.join(workingDir, 'api-data.json'));
      })
      .then((result) => {
        assert.isFalse(result);
      });
    });
  });
});
