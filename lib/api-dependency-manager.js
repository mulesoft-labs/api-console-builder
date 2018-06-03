const parse5 = require('parse5');
const fs = require('fs-extra');
const path = require('path');
/**
 * Manages dependencies inclusion in the main file.
 */
class ApiDependencyManager {
  /**
   * @constructor
   * @param {Object} opts Build configuration.
   * @param {String} buildLocation Build temp directory location
   * @param {String} appMainFile Application main file. It can be `index.html`
   * or `api-console.html`
   * @param {Object} logger Logger object
   */
  constructor(opts, buildLocation, appMainFile, logger) {
    this.opts = opts;
    this.buildLocation = buildLocation;
    this.logger = logger;
    this._appLocation = path.join(buildLocation, appMainFile);
  }
  /**
   * Updates import list in the main file.
   * @return {Promise}
   */
  updateImports() {
    this.logger.info('Updating dependencies declaration');
    return this.readMainFile()
    .then((content) => this.createAst(content))
    .then((ast) => {
      const head = this.findNode(ast, 'head');
      if (!head) {
        this.log.warn('Unable to locate "head" definition in AST model.');
      }
      this.rewritePaths(head);
      const dependencies = this.listDependencies();
      if (dependencies.length) {
        this.addDependencies(head, dependencies);
      }
      return this.saveAst(ast);
    });
  }
  /**
   * Reads a content of the main file.
   *
   * @return {Promise} Promise resolved to file content as a string.
   */
  readMainFile() {
    this.logger.debug('Reading app main file...');
    return fs.readFile(this._appLocation, 'utf8');
  }
  /**
   * Serializes AST and saves content to the `mainFile`.
   *
   * @param {Object} doc Parsed document
   * @return {Promise} Resolved promise when file is saved.
   */
  saveAst(doc) {
    this.logger.info('Storing data to application main file.');
    const html = parse5.serialize(doc);
    return fs.writeFile(this._appLocation, html, 'utf8');
  }
  /**
   * Creates AST tree from passed content.
   *
   * @param {String} content Read HTML file content.
   * @return {Object} The `parse5` document object.
   */
  createAst(content) {
    this.logger.debug('Parsing main file content...');
    return parse5.parse(content);
  }
  /**
   * Finds first node in the tree that matches the name.
   * @param {Object} ast Parse5 Element object
   * @param {String} nodeName Node name to find.
   * @return {Object|undefined} Node definition or undefined.
   */
  findNode(ast, nodeName) {
    if (ast.tagName === nodeName) {
      return ast;
    }
    if (ast.childNodes && ast.childNodes.length) {
      for (let i = 0, len = ast.childNodes.length; i < len; i++) {
        const res = this.findNode(ast.childNodes[i], nodeName);
        if (res) {
          return res;
        }
      }
    }
  }
  /**
   * Adds api console dependencies to the head of the console.
   * @param {Object} head Head section ast.
   * @param {Arra<String>} deps List of dependencies location to add.
   */
  addDependencies(head, deps) {
    this.logger.info('Adding dependencies to the main file.');
    this.logger.debug(deps);
    deps.forEach((item) => this.addDependency(head, item));
  }
  /**
   * Adds theme import to the head ast.
   * @param {Object} head Head section ast.
   * @param {String} dependency A location of a library to add.
   */
  addDependency(head, dependency) {
    const link = {
      tagName: 'link',
      parentNode: head,
      nodeName: 'link',
      namespaceURI: 'http://www.w3.org/1999/xhtml',
      childNodes: [],
      attrs: [{
        name: 'rel',
        value: 'import'
      }, {
        name: 'href',
        value: dependency
      }]
    };
    head.childNodes.push(link);
  }
  /**
   * Rewrites "include" link location for embedded build.
   * @param {Object} head
   */
  rewritePaths(head) {
    for (let i = 0, len = head.childNodes.length; i < len; i++) {
      const link = head.childNodes[i];
      if (link.tagName !== 'link' || !link.attrs || !link.attrs.length) {
        continue;
      }
      const attr = link.attrs.find((attr) =>
        attr.name === 'href');
      if (!attr) {
        continue;
      }
      attr.value = attr.value.replace('../', 'bower_components/');
    }
  }
  /**
   * Lists all dependencies to be added to the main file.
   * @return {Array<String>}
   */
  listDependencies() {
    const standalone = !this.opts.embedded;
    const root = 'bower_components/';
    const result = [];
    if (standalone || !this.opts.noCryptoJs) {
      result.push(`${root}cryptojs-lib/cryptojs-lib.html`);
    }
    if (standalone || !this.opts.noJsPolyfills) {
      result.push(`${root}arc-polyfills/arc-polyfills.html`);
    }
    if (standalone || !this.opts.noXhr) {
      result.push(`${root}xhr-simple-request/xhr-simple-request.html`);
    }
    if (standalone || !this.opts.noWebAnimations) {
      result.push(`${root}web-animations-js/web-animations-next-lite.min.html`);
    }
    return result;
  }
}
exports.ApiDependencyManager = ApiDependencyManager;
