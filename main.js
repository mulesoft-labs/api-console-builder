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
 * Usage:
 *
 * ```
 * const builder = require('api-console-builder');
 *
 * builder({
 *   dest: 'build'
 * })
 * .then(() => console.log('Build complete'));
 *
 * @param {Object} options
 * @return {Promise}
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
