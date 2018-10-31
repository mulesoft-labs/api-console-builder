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
 * Manages theme definition for API console version 5.
 */
class ThemeManager {
  /**
   * @constructor
   * @param {String} themeFile Location of the theme file. It replaces console's
   * original file.
   * @param {String} buildLocation Build temp directory location
   * @param {String} appMainFile Application main file. It can be `index.html`
   * or `api-console.html`
   * @param {Object} logger Logger object
   */
  constructor(themeFile, buildLocation, appMainFile, logger) {
    this.themeFile = themeFile;
    this.themeFileName = path.basename(themeFile);
    this.buildLocation = buildLocation;
    this.logger = logger;
    this._appLocation = path.join(buildLocation, appMainFile);
  }
  /**
   * Updates theme configuration with user required theme file.
   * @return {Promise}
   */
  updateTheme() {
    this.logger.debug('Updating theme declaration');
    return this.copyTheme()
    .then(() => this.readMainFile())
    .then((content) => this.createAst(content))
    .then((ast) => {
      const head = this.findNode(ast, 'head');
      if (!head) {
        this.log.warn('Unable to locate "head" definition in AST model.');
      }
      this.removeApicTheme(head);
      this.addTheme(head);
      return this.saveAst(ast);
    });
  }
  /**
   * Coppies theme file to a working dir.
   * @return {Promise}
   */
  copyTheme() {
    this.logger.debug('Copying theme file to build directory.');
    const dest = path.join(this.buildLocation, this.themeFileName);
    return fs.copy(this.themeFile, dest);
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
    this.logger.debug('Storing data to application main file.');
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
   * The function that looks for existing theme definition and removes it.
   * @param {Object} head Parsed HTML.
   */
  removeApicTheme(head) {
    if (head.childNodes && head.childNodes.length) {
      const index = head.childNodes.findIndex((node) => {
        if (node.tagName !== 'link' || !node.attrs || !node.attrs.length) {
          return false;
        }
        return !!node.attrs.find((attr) =>
          attr.name === 'href' &&
          attr.value.indexOf('api-console-styles.html') !== -1);
      });
      if (index !== -1) {
        this.logger.info('Removing existing theme from api-console.');
        head.childNodes.splice(index, 1);
      }
    }
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
   * Adds theme import to the head ast.
   * @param {Object} head Head section ast.
   */
  addTheme(head) {
    this.logger.info('Adding user theme file.');
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
        value: this.themeFileName
      }]
    };
    head.childNodes.push(link);
  }
}
exports.ThemeManager = ThemeManager;
