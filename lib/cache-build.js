'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const yauzl = require('yauzl');
/**
 * A class responsible for caching and restoring complete build
 * of the API console.
 * It speeds up the build process on development machines.
 * This should not be used in the CI pipeline as it will prohibit downloading
 * latest version of the components.
 */
class CacheBuild {
  /**
   * @param {Object} opts User options.
   * @param {Object} logger
   */
  constructor(opts, logger) {
    this.opts = opts;
    this.logger = logger;
    if (!this.opts.noCache) {
      this.hash = this.createHash(opts);
      this.logger.debug('Build cache hash', this.hash);
      this.cacheFolder = this.locateAppDir();
    }
  }
  /**
   * Creates a path to cache folder under user data folder.
   *
   * @param {?String} platform Current platform. If not set `process.platform`
   * is used.
   * @return {String}
   */
  locateAppDir(platform) {
    let dir;
    if (!platform) {
      platform = process.platform;
    }
    if (typeof process.env.APPDATA !== 'undefined' && process.env.APPDATA) {
      dir = process.env.APPDATA;
    } else if (platform === 'darwin') {
      dir = path.join(process.env.HOME, 'Library', 'Preferences');
    } else if (platform === 'linux') {
      dir = path.join(process.env.HOME, '.config');
    } else {
      dir = '/var/local';
    }
    dir = path.join(dir, 'api-console', 'cache', 'builds');
    this.logger.debug('Setting builds cache path to ' + dir);
    return dir;
  }
  /**
   * Creates cache file sha256 hash from user options.
   * This should ensure uniques of cached versions of the build.
   *
   * Note, only options that influence final build are considered.
   *
   * @param {Object} opts Builder options
   * @return {String} Cache file sha256 hash.
   */
  createHash(opts) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    const parts = [];
    if (opts.local) {
      parts.push(`local=${opts.local}`);
    }
    if (opts.tagName) {
      parts.push(`tagName=${opts.tagName}`);
    }
    if (opts.api) {
      parts.push('api=true');
    }
    if (opts.embedded) {
      parts.push(`embedded=${opts.embedded}`);
    }
    if (opts.withAmf) {
      parts.push('withAmf=true');
    }
    if (opts.noCryptoJs) {
      parts.push(`noCryptoJs=${opts.noCryptoJs}`);
    }
    if (opts.noJsPolyfills) {
      parts.push(`noJsPolyfills=${opts.noJsPolyfills}`);
    }
    if (opts.noWebAnimations) {
      parts.push(`noWebAnimations=${opts.noWebAnimations}`);
    }
    if (opts.themeFile) {
      parts.push(`themeFile=${opts.themeFile}`);
    }
    if (opts.attributes) {
      try {
        parts.push(`attributes=${JSON.stringify(opts.attributes)}`);
      } catch (_) {}
    }
    hash.update(parts.join('|'));
    return hash.digest('hex');
  }
  /**
   * Checks if cache file exists.
   * @return {Promise<Boolean>}
   */
  hasCache() {
    if (this.opts.noCache) {
      return Promise.resolve(false);
    }
    const location = path.join(this.cacheFolder, `${this.hash}.zip`);
    return fs.pathExists(location);
  }
  /**
   * Restores cached build to `build` location.
   * @param {String} build Build location
   * @return {Promise}
   */
  restore(build) {
    const source = path.join(this.cacheFolder, `${this.hash}.zip`);
    this.logger.debug('Opening cached zip file.');
    return this._processZip(source, build);
  }
  /**
   * Unzips files from the zip file and copy them to the destination folder.
   *
   * @param {String} source File location.
   * @param {String} destination Folder where to put the files.
   * @return {Promise}
   */
  _processZip(source, destination) {
    return new Promise((resolve, reject) => {
      yauzl.open(source, {lazyEntries: true}, (err, zipfile) => {
        if (err) {
          reject(err);
          return;
        }
        zipfile.on('close', () => {
          this.logger.debug('Build copied from cache.');
          resolve();
        });
        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
          this._processZipEntry(zipfile, entry, destination)
          .catch((err) => {
            this.logger.warn(err);
            throw err;
          });
        });
      });
    });
  }

  _processZipEntry(zip, entry, destination) {
    if (/\/$/.test(entry.fileName)) {
      zip.readEntry();
      return Promise.resolve();
    }
    const dir = path.join(destination, path.dirname(entry.fileName));
    return fs.ensureDir(dir)
    .then(() => this._copyZipEntry(zip, entry, destination))
    .then(() => zip.readEntry());
  }

  _copyZipEntry(zip, entry, destination) {
    return new Promise((resolve, reject) => {
      zip.openReadStream(entry, function(err, readStream) {
        if (err) {
          reject(err);
          return;
        }
        const dest = path.join(destination, entry.fileName);
        const writeStream = fs.createWriteStream(dest);
        writeStream.on('close', function() {
          resolve();
        });
        readStream.pipe(writeStream);
      });
    });
  }
  /**
   * Caches build files.
   * @param {String} sources Location of generated build files.
   * @return {Promise} Resolved when file is created
   */
  cacheBuild(sources) {
    if (this.opts.noCache) {
      return Promise.resolve();
    }
    this.logger.debug('Caching build files to ' + this.cacheFolder);
    return fs.ensureDir(this.cacheFolder)
    .then(() => this._createPackage(sources));
  }
  /**
   * Creates a build cache file.
   * @param {String} sources Location of generated build files.
   * @return {Promise} Resolved when file is created
   */
  _createPackage(sources) {
    return new Promise((resolve, reject) => {
      const dest = path.join(this.cacheFolder, `${this.hash}.zip`);
      const output = fs.createWriteStream(dest);
      const archive = archiver('zip', {
        zlib: {
          level: 9
        }
      });
      output.on('close', () => {
        this.logger.debug('Cache build saved.');
        this.logger.debug(archive.pointer() + ' total bytes.');
        resolve();
      });
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          this.logger.warn(err);
        } else {
          reject(err);
        }
      });
      archive.on('error', (err) => {
        reject(err);
      });
      archive.pipe(output);
      archive.directory(path.join(sources, 'es5-bundle'), 'es5-bundle');
      archive.directory(path.join(sources, 'es6-bundle'), 'es6-bundle');
      archive.file(path.join(sources, 'apic-import.js'), {name: 'apic-import.js'});
      if (!this.opts.embedded) {
        archive.file(path.join(sources, 'index.html'), {name: 'index.html'});
      }
      if (this.opts.withAmf) {
        archive.file(path.join(sources, 'amf.js'), {name: 'amf.js'});
      }
      archive.finalize();
    });
  }
}
exports.CacheBuild = CacheBuild;
