'use strict';

const https = require('https');
const tmp = require('tmp');
const unzip = require('unzip');
const del = require('del');
const fs = require('fs');
const exec = require('child_process').exec;

/**
 * Is responsible for downloading / copying and unzipping the API console sources.
 * It also support bower components installation.
 *
 * The API console source will be copied to a temp folder.
 */
class ApiConsoleSourceControl {

  contructor(opts) {
    /**
     * @type {ApiConsoleBuilderOptions}
     */
    this.opts = opts;
    /**
     * If true then the API console sources will be download from the remote location.
     */
    this.download = this.opts.src.indexOf('http') === 0;
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
    .then(() => this.installBower());
  }
  /**
   * Cleans up the temporaty directory.
   */
  cleanup() {
    if (!this.tmpDir) {
      return Promise.resolve();
    }
    return del([this.tmpDir]);
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
        resolve(path);
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
    return this.copyLocalConsole();
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
    this.log('Downloading latest console from %s', source);
    return new Promise((resolve, reject) => {
      https.get(source, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400) {
          res.resume();
          this.log('Redirecting...');
          return resolve(this.getConsoleSource(res.headers.location));
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
          this.log('API console sources downloaded.');
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
    this.log('Writing source data to file...');
    return new Promise((resolve, reject) => {
      this.log('Creating temp file for API console sources...');
      tmp.file((err, path, fd) => {
        if (err) {
          console.error(err);
          reject(new Error('Unable to create a temp file: ' + err.message));
          return;
        }
        this.log('Writing API console sources to %s', path);
        this._apiConsoleFd = fd;
        fs.writeFile(path, buffer, (err) => {
          if (err) {
            console.error(err);
            reject(new Error('Unable to write to temp file: ' + err.message));
            return;
          }
          this.log('API console sources saved.');
          resolve();
        });
      });
    });
  }

  /**
   * Unzpips the API console sources to a temp directory.
   */
  processConsoleSource() {
    this.log('Unpacking the API console to %s...', this.tmpDir);
    return new Promise((resolve, reject) => {
      fs.createReadStream(undefined, {
        fd: this._apiConsoleFd
      })
      .pipe(unzip.Extract({
        path: this.tmpDir
      }))
      .on('close', () => {
        this.log('API console sources are ready to build');
        resolve(this.removeZipMainFolder());
      })
      .on('error', function() {
        reject(new Error('Unable to unzip the API console sources'));
      });
    });
  }
  /**
   * GitHub zip (and possibly others) will have source files enclosed in a folder.
   * This will look for a
   */
  removeZipMainFolder() {
    return new Promise((resolve, reject) => {
      fs.readdir(this.tmpDir, (err, files) => {
        if (err) {
          return reject(new Error('Unable to read unzipped folder: ' + err));
        }
        if (files.length > 1) {
          return resolve();
        }
        fs.stat(files[0], (err, stats) => {
          if (err) {
            return reject(new Error('Unable to stat directory: ' + err));
          }
          if (stats.isDirectory()) {
            this.exec(`cp -r ${files[0]}/* ./`)
            .then(() => resolve())
            .catch((cause) => reject(cause));
          } else {
            resolve();
          }
        });

      });
    });
  }

  copyLocalConsole() {
    return this.exec(`cp -r ${this.opts.src}/* ${this.tmpDir}`);
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
      this.log(`Executing command: ${cmd} in dir: ${dir}`);
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
    return this.exec('npm install bower', this.tmpDir)
    .then(() => this.exec('./node_modules/.bin/bower install', this.tmpDir));
  }
}

exports.ApiConsoleSourceControl = ApiConsoleSourceControl;
