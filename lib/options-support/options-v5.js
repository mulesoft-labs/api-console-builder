'use strict';
const {BaseOptions} = require('./base-options');
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
/**
 * An init options for the API console (version 4) builder.
 *
 * It sets user settings and apply default settings if needed.
 */
class BuilderOptions5 extends BaseOptions {
  /**
   * @constructor
   * @param {Object} opts User options
   */
  constructor(opts) {
    super();
    opts = opts || {};
    this.validateOptions(opts);
    if (!this.isValid) {
      return;
    }
    opts = this._setDefaults(opts);
    /**
     * Path to local directory or file with API console sources.
     *
     * Defaults to `undefined` and it downloads the latest release
     * of the console.
     *
     * @type {String}
     */
    this.local = opts.local;
    /**
     * A release tag name to use. With this option the builder uses specific
     * release of the console. If not set and `src` is not set it uses latest
     * release. Note, only versions >= 4.0.0 can be used with this tool.
     *
     * @type {String}
     */
    this.tagName = opts.tagName;
    /**
     * Output directory.
     *
     * Defaults to `build`.
     *
     * @type {String}
     */
    this.destination = opts.destination;
    /**
     * Location of API specification main file.
     * AMF by default supports OAS (1, 2, 3) and RAML (0.8, 1.0) formats.
     *
     * If not set an empty API console is build without data source attached.
     *
     * Set `apiType` property to corresponding value (type of the API,
     * see below).
     *
     * Defaults to `undefined`.
     *
     * @type {String}
     */
    this.api = opts.api;
    /**
     * Type of an API spec file recognizable by [AMF](https://github.com/mulesoft/amf).
     * To be set with `api` property.
     *
     * By default AMF supports following types:
     * - `RAML 0.8`
     * - `RAML 1.0`
     * - `OAS 1.0`
     * - `OAS 2.0`
     * - `OAS 3.0`
     *
     * @type {String}
     */
    this.apiType = opts.apiType;
    /**
     * If true it will generate an import file for the web components that
     * can be used in any web application. It will not generate a standalone
     * application.
     *
     * Generated source file will contain an example of using the api-console
     * in any web page.
     *
     * Defaults to `false`.
     *
     * @type {Boolean}
     */
    this.embedded = opts.embedded;
    /**
     * Prints a debug messages.
     *
     * @type {Boolean}
     */
    this.verbose = opts.verbose;
    /**
     * If set, the AMF library is included into the build.
     *
     * Note, it significantly increases size of the bundle.
     *
     * @type {Boolean}
     */
    this.withAmf = opts.withAmf;
    /**
     * If set an OAuth 1 and OAuth2 authorization library is not included
     * into the bundle.
     *
     * Use it if you web app embedding the console already use OAuth library
     * that can handle API console auth events.
     * Setting this option with standalone version (`embedded` is false) has
     * no effect.
     *
     * @type {Boolean}
     */
    this.noOauth = opts.noOauth;
    /**
     * If set the CryptoJS library is not included into the build.
     * Use it if you web app embedding the console already use CryptoJS.
     * Setting this option with standalone version (`embedded` is false) has
     * no effect.
     *
     * @type {Boolean}
     */
    this.noCryptoJs = opts.noCryptoJs;
    /**
     * Prevents from adding a polyfill library to ES5 builds.
     * Use it if you web app embedding the console already has polyfills.
     * Setting this option with standalone version (`embedded` is false) has
     * no effect.
     *
     * @type {Boolean}
     */
    this.noJsPolyfills = opts.noJsPolyfills;
    /**
     * If your application handles `api-request` event set it to true to
     * not include default HTTP transport for API console.
     * Setting this option with standalone version (`embedded` is false) has
     * no effect.
     *
     * @type {Boolean}
     */
    this.noXhr = opts.noXhr;
    /**
     * Prohibits from adding Web Animations polyfill.
     * At the moment of documenting this API there is no bnrowser thaty supports
     * Web Animations API natively. This is for future use.
     *
     * @type {Boolean}
     */
    this.noWebAnimations = opts.noWebAnimations;
    /**
     * An array of attributes to set on the `<api-console>` element.
     *
     * For boolean attributes add a string if attribute name.
     * For attributes with values add a map where the key is attribute name
     * and value is attribute value.
     *
     * Note: Do not set `raml` property here. It will be ignored. This option
     * mast be set in general options.
     *
     * Note: Do not use camel case notation. It will not work. See the example.
     *
     * ### Example
     *
     * ```
     * const attributes = [
     *  'proxy-encodeUrl',
     *  {'proxy': 'https://proxy.domain.com'},
     *  'no-try-it',
     *  {'page': 'request'},
     * ]
     * ```
     *
     * Example above is the same as:
     *
     * ```
     * const attributes = [
     *  'proxy-encodeUrl',
     *  'no-try-it',
     *  {
     *    'proxy': 'https://proxy.domain.com',
     *    'page': 'request'
     *  }
     * ]
     * ```
     *
     * and will produce the following output:
     *
     * ```
     * <api-console
     *  proxy-encodeUrl
     *  no-try-it
     *  page="request"
     *  proxy="https://proxy.domain.com"></api-console>
     * ```
     *
     * List of all available options can be found here:
     * https://github.com/mulesoft/api-console/blob/master/docs/configuring-api-console.md
     *
     * Setting this option with standalone version (`embedded` is false) has
     * no effect.
     *
     * @type {Array}
     */
    this.attributes = opts.attributes;
    /**
     * A console like object to print debug output.
     * If not set and `verbose` option is set then it creates it's own logger.
     */
    this.logger = opts.logger;
  }
  /**
   * @return {Object} Map of options with data types
   */
  get validOptions() {
    return {
      local: String,
      tagName: String,
      destination: String,
      api: String,
      apiType: String,
      embedded: Boolean,
      withAmf: Boolean,
      noOauth: Boolean,
      noCryptoJs: Boolean,
      noJsPolyfills: Boolean,
      noXhr: Boolean,
      noWebAnimations: Boolean,
      attributes: Array,
      verbose: Boolean,
      logger: Object
    };
  }
  /**
   * Creates default values for passed options.
   * @param {Object} opts
   * @return {Object}
   */
  _setDefaults(opts) {
    if (!('destination' in opts)) {
      opts.destination = 'build';
    }
    if ('tagName' in opts) {
      opts.tagName = opts.tagName;
    }
    if (!('embedded' in opts)) {
      opts.embedded = false;
    }
    if (!('verbose' in opts)) {
      opts.verbose = false;
    }
    if (!('withAmf' in opts)) {
      opts.withAmf = false;
    }
    if (!('noOauth' in opts)) {
      opts.noOauth = false;
    }
    if (!('noCryptoJs' in opts)) {
      opts.noCryptoJs = false;
    }
    if (!('noJsPolyfills' in opts)) {
      opts.noJsPolyfills = false;
    }
    if (!('noXhr' in opts)) {
      opts.noXhr = false;
    }
    if (!('noWebAnimations' in opts)) {
      opts.noWebAnimations = false;
    }
    return opts;
  }
  /**
   * Validates user input options.
   * Sets `_validationErrors` and `_validationWarnings` arrays on this object
   * conteining corresponing messages.
   *
   * @param {Object} userOpts User options to check.
   */
  validateOptions(userOpts) {
    userOpts = userOpts || {};
    this._validateOptionsList(userOpts);
    this._validateLogger(userOpts);
    this._validateEmbeddableOptions(userOpts);
    this._validateConsoleSource(userOpts);
  }
  /**
   * Validates options that are only available for `embedded` version.
   *
   * @param {Object} opts User options
   */
  _validateEmbeddableOptions(opts) {
    if (opts.embedded) {
      return;
    }
    const msg = 'has no effect with the standalone build.';
    if (opts.noOauth) {
      this.validationWarnings.push(`noOauth ${msg}.`);
      opts.noOauth = false;
    }
    if (opts.noCryptoJs) {
      this.validationWarnings.push(`noCryptoJs ${msg}.`);
      opts.noCryptoJs = false;
    }
    if (opts.noJsPolyfills) {
      this.validationWarnings.push(`noJsPolyfills ${msg}.`);
      opts.noJsPolyfills = false;
    }
    if (opts.noXhr) {
      this.validationWarnings.push(`noXhr ${msg}.`);
      opts.noXhr = false;
    }
    if (opts.attributes) {
      this.validationWarnings.push(`attributes ${msg}.`);
      opts.attributes = undefined;
    }
  }
  /**
   * Validates API consaole source options.
   * @param {Object} userOpts User options
   */
  _validateConsoleSource(userOpts) {
    if (userOpts.local && userOpts.tagName) {
      this.validationErrors.push(
        'The "local" and "tagName" are options are mutually exclusive.' +
        ' Choose only one option.'
      );
    }
  }
}
exports.BuilderOptions5 = BuilderOptions5;
