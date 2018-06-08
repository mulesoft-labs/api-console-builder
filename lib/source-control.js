'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const tmp = require('tmp');
const fs = require('fs-extra');
const path = require('path');
const parse5 = require('parse5');
/**
 * A class responsible for performing basic operations on a source files
 * and build locations.
 */
class SourceControl {
  /**
   * Constructs the processor.
   *
   * @param {BuilderOptions} opts Options passed to the module
   * @param {Winston} logger Logger to use to log debug output
   */
  constructor(opts, logger) {
    /**
     * @type {BuilderOptions}
     */
    this.opts = opts;
    /**
     * Logger to use to print output.
     *
     * @type {Object}
     */
    this.logger = logger;
  }

  /**
   * Clears the directory where the bundled console will be copied.
   * @return {Promise}
   */
  clearOutputDir() {
    return fs.remove(this.opts.destination || 'build');
  }

  /**
   * Creates a working directory where the files will be processed.
   *
   * @return {Promise} Resolved promise when the tmp dire was created
   * with path to the working
   * directory.
   */
  createWorkingDir() {
    return this.createTempDir()
    .then((path) => fs.realpath(path));
  }
  /**
   * Cleans up the temporaty directory.
   *
   * @param {String} dir Path to the temporaty directory.
   * @return {Promise}
   */
  cleanup(dir) {
    if (!dir) {
      return Promise.resolve();
    }
    this.logger.info('Cleaning up temporaty dir...');
    return fs.pathExists(dir)
    .then((exists) => {
      if (exists) {
        this.logger.info('Removing ', dir);
        return fs.remove(dir);
      }
    });
  }
  /**
   * Creates a temp working dir for the console.
   * @return {Promise}
   */
  createTempDir() {
    this.logger.info('Creating working directory...');
    return new Promise((resolve, reject) => {
      tmp.dir((err, _path) => {
        if (err) {
          reject(new Error('Unable to create a temp dir: ' + err.message));
          return;
        }
        this.logger.info('Working directory created: ', _path);
        resolve(_path);
      });
    });
  }

  /**
   * Copy generated files from the temp build folder to
   * the right place defined in `opts.dest`.
   *
   * @param {String} from A folder containing build files.
   * @param {String} buildDir
   * @return {Promise}
   */
  copyOutput(from, buildDir) {
    this.logger.info('Copying generated files to the output folder');

    let source = path.join(from, buildDir);
    let dest = this.opts.destination;

    return fs.copy(source, dest)
    .then(() => {
      this.logger.info('All files copied');
    });
  }
  /**
   * Rewrites bower path in `api-console.html` file.
   * Regular console file has paths starting with `../` to the components.
   * In standalone build it has to be rewritten to `bower_components/`
   *
   * @param {String} workingDir Working directory
   * @return {Promise} Resolved promise when paths were updated.
   */
  rewriteBowerPaths(workingDir) {
    const file = path.join(workingDir, 'api-console.html');
    let doc;
    return fs.readFile(file, 'utf8')
    .then((content) => {
      doc = parse5.parse(content);
      return this._findImportLinks(doc, []);
    })
    .then((links) => {
      if (!links || !links.length) {
        return false;
      }
      return this._updateBowerLinks(links);
    })
    .then((result) => {
      if (!result) {
        return;
      }
      const html = parse5.serialize(doc);
      return fs.writeFile(file, html, 'utf8');
    });
  }
  /**
   * Finds `[rel="import"]` in links AST.
   * @param {Object} node Link node AST
   * @param {Object} container
   * @return {Object}
   */
  _findImportLinks(node, container) {
    if (node.nodeName === 'link') {
      let attr = node.attrs.find((item) => item.name === 'rel' &&
        item.value === 'import');
      if (attr) {
        container.push(node);
      }
      return container;
    }
    if (node.childNodes && node.childNodes.length) {
      for (let i = 0, len = node.childNodes.length; i < len; i++) {
        let res = this._findImportLinks(node.childNodes[i], []);
        if (res && res.length) {
          container = container.concat(res);
        }
      }
    }
    return container;
  }
  /**
   * Updates links to `bower_components` directory.
   *
   * @param {Array} links AST for links
   * @return {Boolean} True if any link has been updated.
   */
  _updateBowerLinks(links) {
    let result = false;
    for (let i = 0, len = links.length; i < len; i++) {
      let link = links[i];
      let attrs = link.attrs;
      for (let j = 0, aLen = attrs.length; j < aLen; j++) {
        if (attrs[j].name === 'href' && attrs[j].value.indexOf('../') === 0) {
          links[i].attrs[j].value = links[i].attrs[j].value.replace('../', 'bower_components/');
          if (!result) {
            result = true;
          }
        }
      }
    }
    return result;
  }
}

exports.SourceControl = SourceControl;
