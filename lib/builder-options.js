'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */

/**
 * An init options for the API console builder.
 *
 * It sets user settings and apply default settings if needed.
 */
class BuilderOptions {
  /**
   * @constructor
   * @param {?Object} opts User options
   */
  constructor(opts) {
    opts = opts || {};
    opts = Object.assign({}, opts);
  }
}
exports.BuilderOptions = BuilderOptions;
