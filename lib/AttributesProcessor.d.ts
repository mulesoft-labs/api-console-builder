/**
 * Copyright (C) MuleSoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
import parse5 from 'parse5';
import winston from 'winston';

export declare interface ElementAttribute {
  name: string;
  value: string;
}

/**
 * A class that is responsible for processing API Console element
 * attributes.
 * It updates source main file, finds the API Console HTML element
 * and sets attributes passed with options to the module.
 */
export declare class AttributesProcessor {
  attributes: (string|object)[];
  logger: winston.Logger;
  appMainFile: string;
  /**
   * Constructs the processor.
   *
   * @param attributes Attributes to be set on the api console element.
   * @param logger Logger to use to log debug output
   * @param appMainFile Application (build) main file
   */
  constructor(attributes: (string|object)[], logger: winston.Logger, appMainFile: string);

  /**
   * Creates a list of attributes to set on the API console element.
   *
   * @return List objects with `name` and `value` properties.
   */
  listAttributes(): ElementAttribute[];

  /**
   * Sets attributes passed to the module in options to the `<api-console>`
   * element.
   * @return {Promise<void>}
   */
  setAttributes(): Promise<void>;

  /**
   * Creates AST tree from passed content.
   *
   * @param content Read HTML file content.
   * @returns The `parse5` document object.
   */
  createAst(content: string): parse5.DefaultTreeDocument;

  /**
   * Serializes AST and saves content to the `appMainFile`.
   *
   * @param doc Parsed document
   * @returns Resolved promise when file is saved.
   */
  saveAst(doc: parse5.Document): Promise<void>;

  /**
   * Walks through the document tree to find the `api-console` element.
   *
   * @param node Currently iterated node
   * @returns A node of the `api-console` or undefined if there
   * was no API Console element in the document.
   */
  findConsole(node: parse5.DefaultTreeElement|parse5.DefaultTreeDocument): parse5.DefaultTreeElement|undefined;

  /**
   * Updates the list of attributes on the API Console node.
   *
   * @param node API Console node
   * @param attributes List of attributes to set.
   */
  updateAttributes(node: parse5.DefaultTreeElement, attributes: ElementAttribute[]): void;

  /**
   * Updates a single attribute on a node.
   * If an attribute already exists it will be updated. If not, added to the
   * node's attributes list.
   *
   * @param node API Console node
   * @param key Attribute name
   * @param value Attribute value
   * @returns node API Console node
   */
  updateAttribute(node: parse5.DefaultTreeElement, key: string, value: string): parse5.Element;
}
