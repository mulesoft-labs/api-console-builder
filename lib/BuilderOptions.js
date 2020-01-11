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
export class BuilderOptions {
  /**
   * @constructor
   * @param {Object} opts User options
   */
  constructor(opts={}) {
    this.validationErrors = [];
    this.validationWarnings = [];
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
     * AMF by default supports RAML (0.8, 1.0) and OAS (2, 3) formats.
     *
     * If not set an empty API console is build without data source attached.
     *
     * Set `apiType` property to corresponding value (type of the API,
     * see below).
     *
     * When used with `withAmf` it may be an absolute web URL to the API file
     * location or name of the file relative to the build location. Copy API files
     * manually if the path is relative.
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
     * - `OAS 2.0`
     * - `OAS 3.0`
     *
     * @type {String}
     */
    this.apiType = opts.apiType;
    /**
     * Media type of the API.
     * For RAML files it is always `application/yaml`.
     * OAS comes with two flavors: `application/yaml` and `application/json`.
     * When API model is being generated with the console the parser will figure
     * out the data model of OAS file. However when using `withAmf` option this will
     * tell the web parser what is the type of the file before processing begins.
     *
     * Use it whhen the application build can't process API spec file due to
     * processing error.
     * @type {String}
     */
    this.apiMediaType = opts.apiMediaType;
    /**
     * Prints a debug messages.
     *
     * @type {Boolean}
     */
    this.verbose = opts.verbose;
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
    /**
     * Location to a theme file with styles definition of the console.
     * It replaces console's own styles definition.
     * See theming documentation of the API console for more information.
     *
     * @type {String}
     */
    this.themeFile = opts.themeFile;
    /**
     * Build process can take a lot of time and computing power. Therefore the
     * builder caches build results in user home holder and uses generated
     * sources to speed up the build. This is enabled by default.
     *
     * In CI pipeline where new version of the console should be published
     * this option should be set to `true` to skip caching and generate newest
     * version of the console.
     *
     * Note, options that influence the build process (local, tagName,
     * themeFile, noXhr etc) creates new cached file.
     *
     * API model (if used) is never cached.
     * @type {[type]}
     */
    this.noCache = opts.noCache;
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
      apiMediaType: String,
      attributes: Object,
      verbose: Boolean,
      logger: Object,
      themeFile: String,
      noCache: Boolean
    };
  }
  /**
   * @return {Array<String>} List of supported API spec formats
   */
  get supportedApiTypes() {
    return [
      'RAML 0.8',
      'RAML 1.0',
      'OAS 2.0',
      'OAS 3.0',
    ];
  }
  /**
   * @return {Boolean} True if there's no error messages.
   */
  get isValid() {
    return this.validationErrors.length === 0;
  }
  /**
   * Validates passed user options for data type and names.
   * @param {Object} userOpts
   */
  _validateOptionsList(userOpts) {
    const keys = Object.keys(userOpts);
    const known = this.validOptions;
    const knownKeys = Object.keys(known);
    const unknown = [];
    const typeMissmatch = [];
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      if (knownKeys.indexOf(key) === -1) {
        unknown.push(key);
        continue;
      }
      const expectedType = known[key].name.toLowerCase();
      const userValue = userOpts[key];
      const userType = typeof userValue;
      if (userType !== expectedType && userType !== 'undefined') {
        typeMissmatch.push({
          key,
          expectedType,
          userType
        });
      }
    }
    if (unknown.length) {
      let message = 'Unknown option';
      if (unknown.length > 1) {
        message += 's';
      }
      message += ': ' + unknown.join(', ');
      this.validationErrors.push(message);
    }
    if (typeMissmatch.length) {
      typeMissmatch.forEach((error) => {
        let msg = `Property ${error.key} expected to be ${error.expectedType}`;
        msg += ` but found ${error.userType}.`;
        this.validationErrors.push(msg);
      });
    }
  }
  /**
   * Validates user option for the `logger` property.
   *
   * @param {Object} userOpts Passed user options.
   */
  _validateLogger(userOpts) {
    if (!userOpts.logger) {
      return;
    }
    const logger = userOpts.logger;
    if (!logger.log || !logger.info || !logger.warn || !logger.error) {
      this.validationWarnings.push(
        'Invalid logger passed as an option. Will use own logger.'
      );
      try {
        delete userOpts.logger;
      } catch (_) {
        // ..
      }
    }
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
    if (!('verbose' in opts)) {
      opts.verbose = false;
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
  validateOptions(userOpts={}) {
    this._validateOptionsList(userOpts);
    this._validateLogger(userOpts);
    this._validateConsoleSource(userOpts);
    this._validateApiOptions(userOpts);
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
  /**
   * Validates `api` and `apiType` properties
   * @param {Object} userOpts User options
   */
  _validateApiOptions(userOpts) {
    if (!userOpts.api && !userOpts.apiType) {
      return;
    }
    if (!userOpts.api) {
      this.validationErrors.push(
        'The "apiType" property is set but no "api" given.' +
        ' Set "api" property to point to your API spec file.'
      );
    }
    const types = this.supportedApiTypes;
    if (!userOpts.apiType) {
      this.validationErrors.push(
        'The "api" property is set but no "apiType" given.' +
        ' Set one of: ' + types.join(', ')
      );
    } else if (types.indexOf(userOpts.apiType) === -1) {
      this.validationErrors.push(
        `Unsuported apiType: ${userOpts.apiType}. ` +
        'Use one of: ' + types.join(', ')
      );
    }
  }
}
