import semver from 'semver';
/**
 * Copyright (C) MuleSoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */

/** @typedef {import('./BuilderOptions').ProjectConfiguration} ProjectConfiguration */

/**
 * An init options for the API console builder.
 *
 * It sets user settings and apply default settings if needed.
 */
export class BuilderOptions {
  /**
   * @param {ProjectConfiguration=} opts User options
   */
  constructor(opts={}) {
    this.validationErrors = [];
    this.validationWarnings = [];
    this.validate(opts);
    opts = this._setDefaults(opts);
    /**
     * A release tag name to use. With this option the builder uses specific
     * release of the console. If not set and `src` is not set it uses latest
     * release. Note, only versions >= 6.0.0 can be used with this builder.
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
     * Unlike previous versions of this library, now `api` property is required.
     * The build will fail if this is not set.
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
     * - `OAS 2.0`
     * - `OAS 3.0`
     *
     * @type {String}
     */
    this.apiType = opts.apiType;
    /**
     * Media type of the API.
     * For RAML files it is always `application/yaml`.
     * OAS comes with two flavours: `application/yaml` and `application/json`.
     *
     * Use it when the library can't process API spec file due to processing error.
     *
     * @default application/raml
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
     * An array of attributes to be set on the `<api-console>` element.
     *
     * For boolean attributes just add name of the attribute as string.
     *
     * For attributes with values add a map where the key is the attribute name
     * and value is the attribute value.
     *
     * Note: Do not use camel case notation. It will not work. See the example.
     *
     * ### Example
     *
     * ```
     * const attributes = [
     *  'proxyEncodeUrl',
     *  {'proxy': 'https://proxy.domain.com'},
     *  'noTryIt',
     *  {'page': 'request'},
     * ]
     * ```
     *
     * Example above is the same as:
     *
     * ```
     * const attributes = [
     *  'proxyEncodeUrl',
     *  'noTryIt',
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
     *  proxyEncodeUrl
     *  noTryIt
     *  page="request"
     *  proxy="https://proxy.domain.com"
     * ></api-console>
     * ```
     *
     * List of all available options can be found here:
     * https://github.com/mulesoft/api-console/blob/master/docs/configuring-api-console.md
     *
     * Note, you don't need to set this property when providing own `indexFile`.
     * Simply define attributes in the file.
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
     * It replaces Console's own styles definition.
     * See theming documentation of the API console for more information.
     *
     * @type {String}
     */
    this.themeFile = opts.themeFile;
    /**
     * Location to a custom `index.html` file that will be used instead of the
     * default template.
     *
     * The template file must include vendor package, API Console sources, and
     * the use of API Console. See `templates/index.html` for an example.
     *
     * @type {String}
     */
    this.indexFile = opts.indexFile;
    /**
     * By default the builder caches build results in user home folder and uses generated
     * sources to speed up the build process.
     *
     * Note, options that influence the build process (`tagName`,
     * `themeFile`, `indexFile`, etc) creates new cached file.
     *
     * API model is never cached.
     *
     * @type {Boolean}
     */
    this.noCache = opts.noCache;
    /**
     * Decides whether to finish current process with non-zero exit code on
     * error.
     *
     * @default true
     * @type {Boolean}
     */
    this.exitOnError = opts.exitOnError;
    /**
     * When set to `true` it will stop build process with error when a minor
     * issue has been detected, like missing theme file in declared location
     * which is normally ignored.
     *
     * @default false
     * @type {Boolean}
     */
    this.strict = opts.strict;
    /**
     * Optional application title put into HTML's `<title>` tag.
     * By default it uses API title or `API Console` if missing.
     *
     * @type {String}
     */
    this.appTitle = opts.appTitle;
  }

  /**
   * @return {Object} Map of options with data types
   */
  get validOptions() {
    return {
      tagName: String,
      destination: String,
      api: String,
      apiType: String,
      apiMediaType: String,
      attributes: Object,
      verbose: Boolean,
      logger: Object,
      themeFile: String,
      indexFile: String,
      noCache: Boolean,
      exitOnError: Boolean,
      strict: Boolean,
      appTitle: String,
    };
  }

  /**
   * @return {string[]} List of supported API spec formats
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
   * @return {boolean} True if there's no error messages.
   */
  get isValid() {
    return this.validationErrors.length === 0;
  }

  /**
   * Validates passed user options for data type and names.
   * @param {ProjectConfiguration} userOpts
   */
  _validateOptionsList(userOpts) {
    const keys = Object.keys(userOpts);
    const known = this.validOptions;
    const knownKeys = Object.keys(known);
    const unknown = [];
    const typeMismatch = [];
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
        typeMismatch.push({
          key,
          expectedType,
          userType,
        });
      }
    }
    if (unknown.length) {
      let message = 'Unknown option';
      if (unknown.length > 1) {
        message += 's';
      }
      message += `: ${ unknown.join(', ')}`;
      this.validationErrors.push(message);
    }
    if (typeMismatch.length) {
      typeMismatch.forEach((error) => {
        let msg = `Property ${error.key} expected to be ${error.expectedType}`;
        msg += ` but found ${error.userType}.`;
        this.validationErrors.push(msg);
      });
    }
  }

  /**
   * Validates user option for the `logger` property.
   *
   * @param {ProjectConfiguration} userOpts Passed user options.
   */
  _validateLogger(userOpts) {
    if (!userOpts.logger) {
      return;
    }
    const { logger } = userOpts;
    if (!logger.log || !logger.info || !logger.warn || !logger.error) {
      this.validationWarnings.push(
        'Invalid logger passed as an option. Will use own logger.',
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
   * @param {ProjectConfiguration} opts
   * @return {ProjectConfiguration}
   */
  _setDefaults(opts) {
    if (typeof opts.destination !== 'string') {
      opts.destination = 'build';
    }
    if (typeof opts.verbose !== 'boolean') {
      opts.verbose = false;
    }
    if (typeof opts.exitOnError !== 'boolean') {
      opts.exitOnError = true;
    }
    if (typeof opts.strict !== 'boolean') {
      opts.strict = false;
    }
    if (typeof opts.noCache !== 'boolean') {
      opts.noCache = false;
    }
    return opts;
  }

  /**
   * Validates user input options.
   * Sets `_validationErrors` and `_validationWarnings` arrays on this object
   * containing corresponding messages.
   *
   * @param {ProjectConfiguration} userOpts User options to check.
   */
  validate(userOpts={}) {
    this._validateOptionsList(userOpts);
    this._validateLogger(userOpts);
    this._validateApiOptions(userOpts);
    this._validateTagName(userOpts);
  }

  /**
   * Validates `api` and `apiType` properties
   * @param {ProjectConfiguration} userOpts User options
   */
  _validateApiOptions(userOpts) {
    if (!userOpts.api && !userOpts.apiType) {
      this.validationErrors.push(
        'Both "api" and "apiType" properties are required.',
      );
      return;
    }
    if (!userOpts.api) {
      this.validationErrors.push(
        'The "apiType" property is set but no "api" given.' +
        ' Set "api" property to point to your API spec file.',
      );
    }
    const types = this.supportedApiTypes;
    if (!userOpts.apiType) {
      this.validationErrors.push(
        `${'The "api" property is set but no "apiType" given.' +
        ' Set one of: '}${ types.join(', ')}`,
      );
    } else if (types.indexOf(userOpts.apiType) === -1) {
      this.validationErrors.push(
        `${`Unsupported apiType: ${userOpts.apiType}. ` +
        'Use one of: '}${ types.join(', ')}`,
      );
    }
  }

  /**
   * Validates whether passed tagName is in supported by this version range.
   * @param {ProjectConfiguration} userOpts User options
   */
  _validateTagName(userOpts) {
    const { tagName } = userOpts;
    if (!tagName) {
      return;
    }
    if (String(tagName).indexOf('6.0.0-preview') === 0) {
      // For the time being until the console is released.
      return;
    }
    let result;
    try {
      result = semver.satisfies(tagName, '6.x');
    } catch (e) {
      result = false;
    }
    if (!result) {
      this.validationErrors.push(
        `Unsupported tagName ${tagName}. ` +
        'This version works with API Console >= 6.0.0.',
      );
    }
  }
}
