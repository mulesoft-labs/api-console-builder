'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
const parse5 = require('parse5');
const fs = require('fs-extra');
const path = require('path');
/**
 * A class that is responsible for processing API Console element
 * attributes.
 * It updates source main file, finds the API Console HTML element
 * and sets attributes passed with options to the module.
 */
class AttributesProcessor {
  /**
   * Constructs the processor.
   *
   * @param {BuilderOptions} opts Options passed to the module
   * @param {Winston} logger Logger to use to log debug output
   * @param {String} workingDir Path to a working directory instance.
   */
  constructor(opts, logger, workingDir) {
    if (!workingDir) {
      throw new Error('Required workingDir argument is not set.');
    }
    /**
     * @type {BuilderOptions}
     */
    this.opts = opts;
    this.logger = logger;
    /**
     * A directory where all operations will be performed
     *
     * @type {String}
     */
    this.workingDir = workingDir;
    /**
     * The main file where the API Console element is expected to be.
     * This is be set when `setMainFile()` function is called.
     *
     * Note: This can be different than options' mainFile property if
     * `embedded` option is set.
     *
     * @type {String}
     */
    this.mainFile = undefined;
  }
  /**
   * Creates a list of attributes to set on the API console element.
   *
   * @return {Array} List objects with `name` and `value` properties.
   */
  listAttributes() {
    const attributes = [];
    const opt = this.opts.attributes;
    if (!opt || !opt.length) {
      return attributes;
    }
    for (let i = 0, len = opt.length; i < len; i++) {
      let item = opt[i];
      if (typeof item === 'string') {
        attributes.push({
          name: item,
          value: ''
        });
        continue;
      }
      let keys = Object.keys(item);
      for (let j = 0, lenKeys = keys.length; j < lenKeys; j++) {
        attributes.push({
          name: keys[j],
          value: item[keys[j]]
        });
      }
    }
    return attributes;
  }
  /**
   * Sets attributes passed to the module in options to the `<api-console>`
   * element.
   * @return {Promise}
   */
  setAttributes() {
    const list = this.listAttributes();
    list.push({
      name: 'by-api-console-builder',
      value: ''
    });

    let doc;
    return this.readMainFile()
    .then((content) => this.createAst(content))
    .then((ast) => {
      doc = ast;
      return this.findConsole(doc);
    })
    .then((node) => {
      if (!node) {
        this.logger.warn(
          'The api-console element not found in the main file. ' +
          'Skipping attribute setting'
        );
        return;
      }
      return this.updateAttributes(node, list);
    })
    .then((node) => {
      if (!node) {
        return;
      }
      return this.saveAst(doc);
    });
  }
  /**
   * Sets the `mainFile` property with full path to the main file to parse.
   */
  setMainFile() {
    const main = this.opts.embedded ? 'example.html' : this.opts.mainFile;
    this.mainFile = path.join(this.workingDir, main);
  }
  /**
   * Reads a content of the main file. It calls `setMainFile()` function.
   *
   * @return {Promise} Promise resolved to file content as a string.
   */
  readMainFile() {
    this.setMainFile();
    return fs.readFile(this.mainFile, 'utf8');
  }
  /**
   * Creates AST tree from passed content.
   *
   * @param {String} content Read HTML file content.
   * @return {Object} The `parse5` document object.
   */
  createAst(content) {
    this.logger.info('Main file read. Parsing content');
    return parse5.parse(content);
  }
  /**
   * Serializes AST and saves content to the `mainFile`.
   *
   * @param {Object} doc Parsed document
   * @return {Promise} Resolved promise when file is saved.
   */
  saveAst(doc) {
    const html = parse5.serialize(doc);
    return fs.writeFile(this.mainFile, html, 'utf8');
  }
  /**
   * Walks through the document tree to find the `api-console` element.
   *
   * @param {Node} node Currently iterated node
   * @return {Node|undefined} A node of the `api-console` or undefined if there
   * was no API Console element in the document.
   */
  findConsole(node) {
    if (node.nodeName === 'api-console') {
      return node;
    }
    if (node.childNodes && node.childNodes.length) {
      for (let i = 0, len = node.childNodes.length; i < len; i++) {
        let res = this.findConsole(node.childNodes[i]);
        if (res) {
          return res;
        }
      }
    }
  }
  /**
   * Updates the list of attributes on the API Console node.
   *
   * @param {Node} node API Console node
   * @param {Array} attributes List of attributes to set.
   * @return {Node} The same node.
   */
  updateAttributes(node, attributes) {
    for (let i = 0, len = attributes.length; i < len; i++) {
      const attr = attributes[i];
      this.updateAttribute(node, attr.name, attr.value);
    }
    return node;
  }
  /**
   * Updates a single attribute on a node.
   * If an attribute already exists it will be updated. If not, added to the
   * node's attributes list.
   *
   * @param {Node} node API Console node
   * @param {String} key Attribute name
   * @param {String} value Attribute value
   * @return {Node} node API Console node
   */
  updateAttribute(node, key, value) {
    const attrs = node.attrs = node.attrs || [];
    // change the attribute
    for (let i = 0, len = attrs.length; i < len; i++) {
      const attr = attrs[i];
      if (attr.name !== key) {
        continue;
      }
      attr.value = value;
      return node;
    }
    // add the attribute
    attrs.push({
      name: key,
      value: value
    });
    return node;
  }
}
exports.AttributesProcessor = AttributesProcessor;
