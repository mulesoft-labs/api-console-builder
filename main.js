'use strict';

const {ApiConsoleBuilder} = require('./lib/api-console-builder.js');
const {ApiConsoleBuilderOptions} = require('./lib/api-console-builder-options.js');

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
 *
 * You can also pass the options in the `ApiConsoleBuilderOptions` object.
 * See the `lib/lib/api-console-builder-options` for list of available options.
 */
module.exports = function(options) {
  if (!(options instanceof ApiConsoleBuilderOptions)) {
    options = new ApiConsoleBuilderOptions(options);
  }
  const builder = new ApiConsoleBuilder(options);
  return builder.build();
};

module.exports.ApiConsoleBuilderOptions = ApiConsoleBuilderOptions;
