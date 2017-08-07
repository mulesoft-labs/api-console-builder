'use strict';

const {ApiConsoleProject} = require('./lib/api-console-project.js');
const {BuilderOptions} = require('./lib/builder-options.js');

/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
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
  if (!(options instanceof BuilderOptions)) {
    options = new BuilderOptions(options);
  }

  const project = new ApiConsoleProject(options);
  return project.build();
};

module.exports.ApiConsoleProject = ApiConsoleProject;
module.exports.BuilderOptions = BuilderOptions;
