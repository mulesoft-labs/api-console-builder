/**
 * Copyright (C) MuleSoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
import parse5 from 'parse5';
import fs from 'fs-extra';

/** @typedef {import('winston').Logger} Winston */
/** @typedef {import('./AttributesProcessor').ElementAttribute} ElementAttribute */

/**
 * A class that is responsible for processing API Console element
 * attributes.
 * It updates source main file, finds the API Console HTML element
 * and sets attributes passed with options to the module.
 */
export class AttributesProcessor {
  /**
   * Constructs the processor.
   *
   * @param {(string|object)[]} attributes Attributes to be set on the api console element.
   * @param {Winston} logger Logger to use to log debug output
   * @param {string} appMainFile Application (build) main file
   */
  constructor(attributes, logger, appMainFile) {
    /**
     * @type {Array}
     */
    this.attributes = attributes;
    this.logger = logger;
    /**
     * The main file where the API Console element is expected to be.
     *
     * @type {String}
     */
    this.appMainFile = appMainFile;
  }

  /**
   * Creates a list of attributes to set on the API console element.
   *
   * @return {ElementAttribute[]} List objects with `name` and `value` properties.
   */
  listAttributes() {
    const attributes = [];
    const opt = this.attributes;
    if (!opt || !opt.length) {
      return attributes;
    }
    for (let i = 0, len = opt.length; i < len; i++) {
      const item = opt[i];
      if (typeof item === 'string') {
        attributes.push({
          name: item,
          value: '',
        });
        continue;
      }
      const keys = Object.keys(item);
      for (let j = 0, lenKeys = keys.length; j < lenKeys; j++) {
        attributes.push({
          name: keys[j],
          value: item[keys[j]],
        });
      }
    }
    return attributes;
  }

  /**
   * Sets attributes passed to the module in options to the `<api-console>`
   * element.
   * @return {Promise<void>}
   */
  async setAttributes() {
    const list = this.listAttributes();
    list.push({
      name: 'by-api-console-builder',
      value: '',
    });

    const content = await fs.readFile(this.appMainFile, 'utf8');
    const doc = this.createAst(content);
    const node = this.findConsole(doc);
    if (!node) {
      this.logger.warn('The "api-console-app" element not found in the main file. Skipping attribute setting');
      return;
    }
    this.updateAttributes(node, list);
    await this.saveAst(doc);
  }

  /**
   * Creates AST tree from passed content.
   *
   * @param {string} content Read HTML file content.
   * @return {parse5.DefaultTreeDocument} The `parse5` document object.
   */
  createAst(content) {
    this.logger.debug('Main file read. Parsing content');
    return /** @type parse5.DefaultTreeDocument */ (parse5.parse(content));
  }

  /**
   * Serializes AST and saves content to the `appMainFile`.
   *
   * @param {parse5.Document} doc Parsed document
   * @return {Promise<void>} Resolved promise when file is saved.
   */
  async saveAst(doc) {
    const html = parse5.serialize(doc);
    await fs.writeFile(this.appMainFile, html, 'utf8');
  }

  /**
   * Walks through the document tree to find the `api-console` element.
   *
   * @param {parse5.DefaultTreeElement|parse5.DefaultTreeDocument} node Currently iterated node
   * @return {parse5.DefaultTreeElement|undefined} A node of the `api-console` or undefined if there
   * was no API Console element in the document.
   */
  findConsole(node) {
    if (node.nodeName === 'api-console-app') {
      return /** @type parse5.DefaultTreeElement */ (node);
    }
    if (node.childNodes && node.childNodes.length) {
      for (let i = 0, len = node.childNodes.length; i < len; i++) {
        const item = /** @type parse5.DefaultTreeElement */ (node.childNodes[i]);
        const res = this.findConsole(item);
        if (res) {
          return res;
        }
      }
    }
  }

  /**
   * Updates the list of attributes on the API Console node.
   *
   * @param {parse5.DefaultTreeElement} node API Console node
   * @param {ElementAttribute[]} attributes List of attributes to set.
   */
  updateAttributes(node, attributes) {
    for (let i = 0, len = attributes.length; i < len; i++) {
      const attr = attributes[i];
      this.updateAttribute(node, attr.name, attr.value);
    }
  }

  /**
   * Updates a single attribute on a node.
   * If an attribute already exists it will be updated. If not, added to the
   * node's attributes list.
   *
   * @param {parse5.DefaultTreeElement} node API Console node
   * @param {string} key Attribute name
   * @param {string} value Attribute value
   * @return {parse5.Element} node API Console node
   */
  updateAttribute(node, key, value) {
    const attrs = (node.attrs = node.attrs || []);
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
      value,
    });
    return node;
  }
}
