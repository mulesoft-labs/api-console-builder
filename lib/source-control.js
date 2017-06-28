'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const https = require('https');
const tmp = require('tmp');
const unzip = require('unzip');
const fs = require('fs-extra');
const exec = require('child_process').exec;
const path = require('path');
const {BuilderOptions} = require('./builder-options');
/**
 * Is responsible for downloading / copying and unzipping the API console sources.
 * It also support bower components installation.
 *
 * The API console source will be copied to a temp folder.
 *
 * @param {BuilderOptions} opts Options passed to the module
 * @param {Winston} logger Logger to use to log debug output
 */
class SourceControl {

  constructor(opts, logger) {
    if (!(opts instanceof BuilderOptions)) {
      opts = new BuilderOptions(opts);
    }
    /**
     * @type {BuilderOptions}
     */
    this.opts = opts;
    this.logger = logger;
    /**
     * If true then the API console sources will be download from the remote location.
     */
    this.download = this.opts.src.indexOf('http') === 0;

    this._setTemplateFile();
  }
  // Prints arguments to the console.
  log() {
    if (this.opts.verbose) {
      console.log.apply(console, arguments);
    }
  }
  /**
   * Creates a temporary working directory where the console will be build.
   *
   * @return {Promise} Resolved promise will contain an URL to the working directory where
   * the source files are stored.
   */
  createConsoleDir() {
    return this.createTempDir()
    .then((path) => this.realpath(path))
    .then((path) => this.tmpDir = path)
    .then(() => this.prepareSources())
    .then(() => this.installBower())
    .then(() => this.handleTemplates())
    .then(() => {
      this.logger.info('Console working temp directory created.');
    });
  }

  /**
   * Cleans up the temporaty directory.
   */
  cleanup() {
    if (!this.tmpDir) {
      return Promise.resolve();
    }
    this.logger.info('Cleaning up temp dir...');
    return fs.pathExists(this.tmpDir)
    .then((exists) => {
      if (exists) {
        this.logger.info('Removing ', this.tmpDir);
        return fs.remove(this.tmpDir);
      }
    });
  }
  /**
   * Creates a temp working dir for the console.
   */
  createTempDir() {
    return new Promise((resolve, reject) => {
      tmp.dir((err, path) => {
        if (err) {
          reject(new Error('Unable to create a temp dir: ' + err.message));
          return;
        }
        this.logger.info('Created working directory', path);
        resolve(path);
      });
    });
  }

  /**
   * Resolves symbolic links to real path, otherwise polymer build will throw error.
   */
  realpath(path) {
    return new Promise((resolve, reject) => {
      fs.realpath(path, function(err, resolvedPath) {
        if (err) {
          return reject(new Error('Unable to resolve path ' + err));
        }
        resolve(resolvedPath);
      });
    });
  }

  /**
   * Downloads or copy local version of the console.
   */
  prepareSources() {
    if (this.download) {
      return this.downloadConsoleSource(this.opts.src)
      .then((buffer) => this.writeConsoleSources(buffer))
      .then(() => this.processConsoleSource());
    }
    return this.copyLocalConsole()
    .then(() => {
      if (this.opts.sourceIsZip) {
        return this.processConsoleSource();
      }
    });
  }
  /**
   * Downloads the API console sources from the remote machine.
   * The module expect it to be a zip file with `api-console` element source files, possibly
   * from the release / master branch on GitHub.
   * It will report an error if the file is not available or it;s not a zip file.
   *
   * @param {String} source The URL to the API console sources zip file.
   * @return {Promise} Resolved promise with return a buffer with file contents.
   */
  downloadConsoleSource(source) {
    this.logger.info('Downloading latest console from %s', source);
    return new Promise((resolve, reject) => {
      https.get(source, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400) {
          res.resume();
          this.logger.info('Redirecting...');
          return resolve(this.downloadConsoleSource(res.headers.location));
        }
        if (res.statusCode < 200 && res.statusCode >= 300) {
          reject(new Error('API console source unavailable. Response code: ', res.statusCode));
          res.resume();
          return;
        }
        let rawData;
        res.on('data', (chunk) => {
          if (!rawData) {
            rawData = chunk;
          } else {
            rawData = Buffer.concat([rawData, chunk]);
          }
        });
        res.on('end', () => {
          this.logger.info('API console sources downloaded.');
          resolve(rawData);
        });
      })
      .on('error', (e) => {
        console.error(e);
        reject(new Error(e.message));
      });
    });
  }
  /**
   * It will write the API console source zip file to a temp file.
   *
   * This file doesn't require cleanup since the `tmp` module will cleanup it automatically
   * when program exit.
   *
   * This function will set `this._apiConsoleFd` variable which is a file descriptior for the
   * zip file.
   */
  writeConsoleSources(buffer) {
    this.logger.info('Writing source data to file...');
    return new Promise((resolve, reject) => {
      this.logger.info('Creating temp file for API console sources...');
      tmp.file((err, path, fd) => {
        if (err) {
          console.error(err);
          reject(new Error('Unable to create a temp file: ' + err.message));
          return;
        }
        this.logger.info('Writing API console sources to %s', path);
        this._apiConsoleFd = fd;
        fs.writeFile(path, buffer, (err) => {
          if (err) {
            console.error(err);
            reject(new Error('Unable to write to temp file: ' + err.message));
            return;
          }
          this.logger.info('API console sources saved.');
          resolve();
        });
      });
    });
  }

  /**
   * Unzpips the API console sources to a temp directory.
   */
  processConsoleSource() {
    this.logger.info('Unpacking the API console to %s...', this.tmpDir);
    return new Promise((resolve, reject) => {
      fs.createReadStream(undefined, {
        fd: this._apiConsoleFd
      })
      .pipe(unzip.Extract({
        path: this.tmpDir
      }))
      .on('close', () => {
        this.logger.info('API console sources are ready to build');
        resolve(this.removeZipMainFolder());
      })
      .on('error', function() {
        reject(new Error('Unable to unzip the API console sources'));
      });
    });
  }
  /**
   * GitHub zip (and possibly others) will have source files enclosed in a folder.
   * This will look for a folder in the root path and will copy sources from it.
   */
  removeZipMainFolder() {
    return fs.readdir(this.tmpDir)
    .then((files) => {
      if (files.length > 1) {
        return;
      }
      const dirPath = path.join(this.tmpDir, files[0]);
      return fs.stat(dirPath)
      .then((stats) => {
        if (stats.isDirectory()) {
          return fs.copy(dirPath, this.tmpDir);
        }
      });
    });
  }
  /**
   * Copy console local files into the working directory
   */
  copyLocalConsole() {
    this.logger.info('Copying local files of the console.');
    return fs.stat(this.opts.src)
    .then((stats) => {
      if (stats.isFile()) {
        if (this.opts.sourceIsZip) {
          return this.copyZipFile();
        }
        throw new Error('Source file must be marked as a ZIP file. Use sourceIsZip option.');
      }
      let src = path.resolve(process.cwd(), this.opts.src);
      this.logger.info('Copying files from ', src);
      return fs.copy(src + '/', this.tmpDir);
    });
  }

  copyZipFile() {
    this.logger.info('Copying local zip file of the console.');
    return fs.open(this.opts.src, 'r')
    .then((fd) => {
      this._apiConsoleFd = fd;
    })
    .catch(err => {
      throw new Error('Unable to upen zip file. ' + err);
    });
  }

  /**
   * Execute shell command
   *
   * @param {String} cmd Command to execute
   * @param {String?} dir A directoy where to execute the command.
   * @return {Promise} Promise resolves itself if the command was executed successfully and
   * rejects it there was an error.
   */
  exec(cmd, dir) {
    dir = dir || undefined;
    return new Promise((resolve, reject) => {
      var opts = {};
      if (dir) {
        opts.cwd = dir;
      }
      this.logger.info(`Executing command: ${cmd} in dir: ${dir}`);
      exec(cmd, opts, (err, stdout, stderr) => {
        if (err) {
          let currentDir = process.cwd();
          if (opts.cwd) {
            currentDir = opts.cwd;
          }
          reject(new Error('Unable to execute command: ' + err.message +
            '. Was in dir: ' + currentDir + '. stdout: ', stdout, '. stderr: ', stderr));
          return;
        }
        resolve(stdout);
      });
    });
  }
  /**
   * Installs bower (locally) and  bower components for the API console.
   */
  installBower() {
    this.logger.info('Installing bower and dependencies...');
    // first check if there is a bower file. of not, then don't bother.
    return fs.lstat(path.join(this.tmpDir, 'bower.json'))
    .catch(() => {
      // no bower file, exit.
      this.logger.info('No bower file. Skipping.');
      return true;
    })
    .then((skipBower) => {
      if (skipBower === true) {
        return;
      }
      return this.exec('npm install bower', this.tmpDir)
      .then(() => this.exec('./node_modules/.bin/bower install', this.tmpDir))
      .then(() => {
        var deps = [];
        if (!this.opts.useJson && this.opts.raml) {
          deps[deps.length] = 'advanced-rest-client/raml-js-parser';
          deps[deps.length] = 'advanced-rest-client/raml-json-enhance';
        }
        if (!this.opts.embedded) {
          deps[deps.length] = 'PolymerElements/app-route#^1.0.0';
        }
        if (deps.length) {
          this.logger.info('Installing additional bower dependencies...');
          this.logger.info('Installing: ', deps);
          let cmd = 'bower install ' + deps.join(' ');
          return this.exec(cmd, this.tmpDir);
        }
      });
    });

  }

  /**
   * Part of the initialization process.
   * Will set the template filename to use depending on the options.
   */
  _setTemplateFile() {
    // Do not use templates.
    if (this.opts.mainFile) {
      this.logger.info('Will not use a template.');
      return;
    }
    var filename = this.opts.embedded ? 'embedded-' : 'standalone-';
    if (this.opts.useJson) {
      filename += 'json';
      if (this.opts.inlineJson) {
        filename += '-inline';
      }
    } else if (this.opts.raml) {
      filename += 'raml';
    } else {
      filename += 'plain';
    }
    var exampleFile = this.opts.embedded ? filename + '-example.tpl' : undefined;
    filename += '.tpl';
    this.logger.info('Template to use: ', filename);
    this.template = filename;
    this.exampleFile = exampleFile;
  }

  /**
   * If template is set then copies the template file to a working directory.
   */
  handleTemplates() {
    if (!this.template) {
      return Promise.resolve();
    }
    this.logger.info('Copy the template file to the build dir.');
    this.opts.mainFile = this.opts.embedded ? 'import.html' : 'index.html';
    var src = path.join(__dirname, '..', 'templates', this.template);
    var dest = path.join(this.tmpDir, this.opts.mainFile);

    return fs.copy(src, dest)
    .then(() => {
      if (this.exampleFile) {
        this.logger.info('Copy the example file to the build dir.');
        src = path.join(__dirname, '..', 'templates', this.exampleFile);
        dest = path.join(this.tmpDir, 'example.html');
        this.exampleFile = undefined;
        return fs.copy(src, dest);
      }
    });
  }

  /**
   * Updates variables in the template file, if available.
   *
   * @param {Object} raml Parsed and enhanced RAML.
   * @return {Promise} Resolved pomise whem the template variables are updated.
   */
  updateTemplateVars(raml) {
    if (!this.template) {
      return Promise.resolve();
    }
    this.logger.info('Updating template variables...');
    return this._updateTemplateVars(this.opts.mainFile, raml)
    .then(() => {
      if (this.opts.embedded) {
        this.logger.info('Updating example file.');
        return this._updateTemplateVars('example.html', raml);
      }
    })
    .then(() => {
      this.logger.info('Template variables updated.');
    });
  }

  _updateTemplateVars(templateName, raml) {
    const file = path.join(this.tmpDir, templateName);
    return fs.readFile(file, 'utf8')
    .then((data) => {
      data = this._processTemplateVars(data, raml);
      return data;
    })
    .then((data) => fs.writeFile(file, data, 'utf8'));
  }

  /**
   * Updates variables in the `content` for given options.
   *
   * @param {String} content File content to update
   * @param {Object} raml Parsed and enhanced JSON from the RAML file.
   * @return {String} Updated file content.
   */
  _processTemplateVars(content, raml) {
    this.logger.info('Replacing template variables with raml data...');
    content = content.replace('[[API-TITLE]]', raml.title);
    if (this.opts.useJson && this.opts.inlineJson) {
      let jsonData = JSON.stringify(raml);
      content = content.replace('[[API-DATA]]', jsonData);
    }
    if (!this.opts.useJson && this.opts.raml) {
      content = content.replace('[[API-FILE-URL]]', this.opts.raml);
    }
    return content;
  }
  /**
   * Depending on selected options it will update `<api-console>` alement's
   * attributes.
   */
  processMainFile() {
    this.logger.info('Processing main file for an attributes...');
    var attributes = [];
    if (this.opts.noTryit) {
      attributes.push('no-tryit');
    }
    if (this.opts.narrowView) {
      attributes.push('narrow');
    }
    if (this.opts.proxy) {
      attributes.push(`proxy="${this.opts.proxy}"`);
      if (this.opts.proxyEncodeUrl) {
        attributes.push('proxy-encode-url');
      }
    }
    if (this.opts.appendHeaders) {
      attributes.push(`append-headers="${this.opts.appendHeaders}"`);
    }
    if (attributes.length === 0) {
      this.logger.info('No attributes detected. Skipping.');
      return Promise.resolve();
    }
    attributes = attributes.join(' ');
    // attributes = attributes.replace(/"/gm, '\\"');
    this.logger.info('Setting attributes ', attributes);

    const mainFile = path.join(this.tmpDir, this.opts.mainFile);
    return fs.readFile(mainFile, 'utf8')
    .then((data) => {
      data = data.replace(/<api-console( json-file="api\.json")?>/gm,
        `<api-console data-ac-build$1 ${attributes}>`);
      return data;
    })
    .then((data) => fs.writeFile(mainFile, data, 'utf8'));
  }
}

exports.SourceControl = SourceControl;
