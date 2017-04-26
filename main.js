'use strict';

const {ACBuilder} = require('./lib/api-console-builder.js');

/**
 * Copyrigt (C) Mulesoft
 * All rights reserved.
 *
 * @author Pawel Psztyc
 */

/**
 * The API console build script.
 *
 * Generates a bundle file with web components included in the API console.
 * Also copyies all dependencies not directly included by the `<link rel="import">` directive
 * like web workers and 3rd party libraries.
 *
 * Usage:
 * ```
 * const builder = require('api-console-builder');
 *
 * builder({
 *   src: './',
 *   dest: 'build'
 * })
 * .then(() => console.log('Build complete'));
 */
module.exports = function(options) {
  const builder = new ACBuilder(options);
  return builder.build();
};
