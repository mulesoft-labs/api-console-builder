'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const {BuilderOptions} = require('./builder-options');
const {Transport} = require('./transport');
const fs = require('fs-extra');
const path = require('path');
const unzip = require('unzip');
const tmp = require('tmp');
const githubHeaders = {
  'user-agent': 'mulesoft-labs/api-console-builder'
};
/**
 * A class responsible for getting the API Console correct sources
 * and copy it to desired location.
 */
class ApiConsoleSources {
  /**
   * Constructs a builder.
   *
   * @param {BuilderOptions} opts Options passed to the module
   * @param {Winston} logger Logger to use to log debug output
   * @param {GithubResolver} githubResolver A reference to GithubResolver
   * instance.
   */
  constructor(opts, logger, githubResolver) {
    if (!(opts instanceof BuilderOptions)) {
      opts = new BuilderOptions(opts);
    }
    /**
     * @type {BuilderOptions}
     */
    this.opts = opts;
    this.logger = logger;
    this.githubResolver = githubResolver;
  }

  /**
   * Gets a console from source described in module passed options to a location described in
   * `destination` attribute.
   *
   * Console can be downloaded from mulesoft main repository as a latest release or tagged release.
   * It can be copied from a local path or downloaded from a zip file. This can be controlled
   * by the options.
   *
   * @param {String} destination A place where to copy the console.
   * @return {Promise}
   */
  sourcesTo(destination) {
    // define a flow.
    var tag = this.opts.tagVersion;
    var src = this.opts.src;
    this.isGithubRelease = tag || (!tag && !src);
    this.isDownload = src && src.indexOf('http') === 0;
    var promise;
    if (!tag && !src) {
      promise = this._downloadLatest(destination);
    } else if (tag) {
      promise = this._downloadTagged(tag, destination);
    } else if (this.isDownload) {
      promise = this._downloadAny(src, destination);
    } else {
      promise = this._copyLocal(src, destination);
    }
    return promise;
  }
  /**
   * Copy locally store API Console sources.
   * The `from` can be either directory to copy contents from or a zip file.
   * If the `from` is a file and `sourceIsZip` is not set then this function
   * will throw an error.
   *
   * @param {String} from Location of the sources.
   * @param {String} to Destination where to copy the files.
   * @return {Promise} Promise resolved when all files were copied.
   */
  _copyLocal(from, to) {
    this.logger.info('Copying local API Console files to the working dir.');

    return fs.stat(from)
    .then((stats) => {
      if (stats.isFile()) {
        if (this.opts.sourceIsZip) {
          return this._openZipFile(from, to)
          .then((fd) => this._processZip(fd, to));
        }
        let message = 'Source is a file but sourceIsZip option is not set. ';
        message += 'Please, set this option to determine how to handle the source file.';
        throw new Error(message);
      }

      let src = path.resolve(process.cwd(), from);
      this.logger.info('Copying files from ', src);
      return fs.copy(src + '/', to);
    });
  }
  /**
   * Downloads information about latest release, downloads content of the
   * release, unzips the file and copies content to the destination.
   *
   * @param {String} destination A place where to place unzipped files.
   * @return {Promise} Promise resolved when all files were copied to the
   * `destination`.
   * The promise will reject when:
   *
   * - GitHub rate limit has been exceeded
   * - Couldn't download either release information or the zip file
   * - Couldn't process downloaded sources.
   */
  _downloadLatest(destination) {
    this.logger.info('Downloading latest release info...');
    return this.githubResolver.getLatestInfo()
    .then((info) => {
      let tagName = info.tag_name;
      let zipUrl = info.zipball_url;
      this.logger.info('Downloading release tagged as: ', tagName);
      return this._downloadAndProcess(zipUrl, destination);
    });
  }
  /**
   * Downloads information about tagged release, downloads content of the
   * release, unzips the file and copies content to the destination.
   *
   * @param {String} tag Release tag name.
   * @param {String} destination A place where to place unzipped files.
   * @return {Promise} Promise resolved when all files were copied to the
   * `destination`.
   * The promise will reject when:
   *
   * - GitHub rate limit has been exceeded
   * - Release number is lower than 4.0.0
   * - The tag doesn't exists
   * - Couldn't download either release information or the zip file
   * - Couldn't process downloaded sources.
   */
  _downloadTagged(tag, destination) {
    this.logger.info('Getting ' + tag + ' release info...');

    return this.githubResolver.getTagInfo(tag)
    .then(info => {
      let zipUrl = info.zipball_url;
      this.logger.info('Downloading release tagged as: ', tag);
      return this._downloadAndProcess(zipUrl, destination);
    });
  }
  /**
   * Downloads api console from any source.
   *
   * @param {String} from The URL of the API console source zip file.
   * @param {String} destination A place where to place unzipped files.
   * @return {Promise} Promise resolved when all files were copied to the
   * `destination`.
   * The promise will reject when:
   *
   * - Couldn't download the zip file
   * - Couldn't process downloaded sources.
   */
  _downloadAny(from, destination) {
    this.logger.info('Downloading API Console sources from ', from);
    return this._downloadAndProcess(from, destination);
  }
  /**
   * Downloads an proceses the API Console sources zip file from a remote
   * location.
   *
   * @param {String} url An URL from where to download file. It must be secure
   * location.
   * @param {String} destination A place where to place unzipped files.
   * @return {Promise} Promise resolved when all files were copied to the
   * `destination`.
   */
  _downloadAndProcess(url, destination) {
    let transport = new Transport();

    return transport.get(url, githubHeaders)
    .then(buffer => this._writeDownloadedSources(buffer))
    .then((fd) => this._processZip(fd, destination));
  }
  /**
   * Opens the zip file to read.
   * @param {String} source A path to a file.
   * @return {Promise} Resolved to a file descriptor.
   */
  _openZipFile(source) {
    this.logger.info('Opening local zip file of the console.');

    return fs.open(source, 'r');
  }
  /**
   * Unzips files from the zip file and copy them to the destination folder.
   *
   * @param {Number} fd File descriptor of opened zip file.
   * @param {String} destination Folder where to put the files.
   * @return {Promise}
   */
  _processZip(fd, destination) {
    return new Promise((resolve, reject) => {
      fs.createReadStream(undefined, {
        fd: fd
      })
      .pipe(unzip.Extract({
        path: destination
      }))
      .on('close', () => {
        this.logger.info('Zip file has been extracted.');
        resolve(this._removeZipMainFolder(destination));
      })
      .on('error', function() {
        reject(new Error('Unable to unzip the API console sources'));
      });
    });
  }

  /**
   * GitHub's zip (and possibly others too) will have source files enclosed in a folder.
   * This will look for a folder in the root path and will copy sources from it.
   *
   * @param {String} destination A place where the zip sources has been extracted.
   * @return {Promise}
   */
  _removeZipMainFolder(destination) {
    return fs.readdir(destination)
    .then((files) => {
      if (files.length > 1) {
        return Promise.resolve();
      }
      const dirPath = path.join(destination, files[0]);
      return fs.stat(dirPath)
      .then((stats) => {
        if (stats.isDirectory()) {
          return fs.copy(dirPath, destination);
        }
      });
    });
  }
  /**
   * Writes downloaded data to a temportaty file.
   *
   * @param {buffer} buffer Downloaded data buffer.
   * @return {Promise} Promise resolved to a file descriptor of newly created
   * file.
   */
  _writeDownloadedSources(buffer) {
    this.logger.info('Writing source data to temporaty file...');

    return new Promise((resolve, reject) => {
      tmp.file((err, path, fd) => {
        if (err) {
          reject(new Error('Unable to create a temporary file: ' + err.message));
          return;
        }

        this.logger.info('Writing API console sources to %s', path);
        fs.writeFile(path, buffer, (err) => {
          if (err) {
            console.error(err);
            reject(new Error('Unable to write to a temporaty file: ' +
              err.message));
            return;
          }

          this.logger.info('API console sources saved in temporaty location.');
          resolve(fd);
        });
      });
    });
  }
  /**
   * Moved copied files to a `to` destination.
   *
   * @param {String} workingDir Working directory where the files are.
   * @param {String} to Relative location from the `workingDir`. Note, Polymer
   * build will fail if dependencies are outside project's root folder.
   */
  moveConsoleToBower(workingDir) {
    return fs.ensureDir(path.join(workingDir, 'bower_components'))
    .then(() => {
      return fs.copy(workingDir, path.join(workingDir, 'bower_components',
        'api-console'), {
        filter: this.filterCopyFiles.bind(this)
      });
    });
  }
  /**
   * Filter for the copy function.
   * Allows any file that are not in `bower_components` or `node_modules`
   * directory or staring with a dot.
   */
  filterCopyFiles(src) {
    var basename = path.basename(src);
    if (basename[0] === '.') {
      return false;
    }
    return src.indexOf('bower_components') === -1 &&
      src.indexOf('node_modules') === -1;
  }
}

exports.ApiConsoleSources = ApiConsoleSources;
