const Transform = require('stream').Transform;
const compile = require('google-closure-compiler-js').compile;

class PluginError {
  constructor(message) {
    this.message = message;
  }
}

class CompilationStream extends Transform {
  constructor(compilationOptions) {
    super({objectMode: true});

    this.compilationOptions_ = compilationOptions;
  }

  _transform(file, enc, cb) {
    if (!this.compilationOptions_.skip) {
      if (file.isNull()) {
        // Ignore empty files.
      } else if (file.isStream()) {
        this.emit('error', new PluginError('Streaming not supported'));
      } else {
        if (this._fileAllowed(file.path)) {
          // console.log('Transforming file', file.path);
          file  = this._processFile(file);
        }
      }
    }
    this.push(file);
    cb();
  }

  _fileAllowed(path) {
    if (!path) {
      return true;
    }
    if (path.indexOf('raml-1-parser.js') !== -1) {
      return false;
    }
    if (path.indexOf('min.js') !== -1) {
      return false;
    }

    return true;
  }

  _processFile(file) {
    const options = Object.assign({}, this.compilationOptions_);
    options.jsCode = [{
      path: file.path,
      src: file.contents.toString()
    }];

    const output = compile(options);
    if (output.errors.length > 0) {
      const message = `Compilation error, ${output.errors.length} errors`;
      this.emit('error', new PluginError(message));
    } else {
      file.contents = new Buffer(output.compiledCode);
    }
    return file;
  }
}

/**
 * @return {function(Object<string>=):Object}
 */
module.exports = function(compilationOptions) {
  return new CompilationStream(compilationOptions || {});
};
