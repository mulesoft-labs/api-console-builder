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
  constructor(opts) {
    opts = opts || {};

    this.validateOptions(opts);
    if (!this.isValid) {
      return;
    }
    opts = this._setDefaults(opts);
    /**
     * Source directory for the API console.
     * If the `src` is an URL it expect to be a zip file that will be uncopressed.
     * If it points to a local destination and it is a zip file, set `sourceIsZip` option to true.
     *
     * Defaults to current directory ("./") to build plain API console.
     */
    this.src = opts.src;
    /**
     * Source index file, an entry point to the application.
     * Don't set when downloading the `api-console` source code from GitHub. Then it will use one
     * of the build-in templates.
     *
     * Defaults to `undefined`. Should point to a file that contains web components imports.
     */
    this.mainFile = opts.mainFile;
    /**
     * Set to true if the API console source (`this.src`) points to a zip file that should be
     * uncopressed.
     *
     * If the `this.src` is an URL then it will be set to `true`. Defaults to `false`.
     */
    this.sourceIsZip = opts.sourceIsZip;
    /**
     * Output directory.
     *
     * Defaults to `build`.
     */
    this.dest = opts.dest;
    /**
     * If set, it will generate a JSON file out of the RAML file and will use pre-generated data
     * in the console.
     *
     * Use this option to optimize console's load time. It will not include `raml-json-enhance` and
     * `raml-js-parser` elements into the build and will use pre-generated JSON to load it into the
     * console.
     *
     * Note that you will have to regenerate the API console each time your API spec changes.
     *
     * Defaults to `false`.
     *
     * @type {Boolean}
     */
    this.useJson = opts.useJson;
    /**
     * Set to true to inline pre-generated JSON data in the main file instead of creating
     * and downloading external JSON file.
     *
     * Only valid if `this.embedded` is not set to `true` and with `useJson` set to true.
     * Embeded version of the API console always require external JSON file.
     *
     * Defaults to `false`.
     */
    this.inlineJson = opts.inlineJson;
    /**
     * If true it will generate an import file for the web components that can be used in any
     * web application. It will not generate a standalone application.
     *
     * Generated source file will contain an example of using the api-console in any web page.
     *
     * Defaults to `false`.
     */
    this.embedded = opts.embedded;
    /**
     * Prints a debug messages.
     */
    this.verbose = opts.verbose;
    /**
     * The RAML file from which produce the documentation.
     * If not set then it will generate a plain API console application without any documentation
     * attached.
     *
     * Defaults to `undefined`.
     */
    this.raml = opts.raml;
    /**
     * Level of compilation passed to the Google Closure Compiler.
     * Possible options are WHITESPACE_ONLY and SIMPLE. Never use ADVANCED option available for
     * the compiler.
     *
     * Option SIMPLE will make the build process longer than WHITESPACE_ONLY but it will produce
     * less code.
     *
     * @type String
     * Defaults to WHITESPACE_ONLY
     */
    this.jsCompilationLevel = opts.jsCompilationLevel;
    /**
     * If set it will not perform any code optimization. It will disable:
     * - comments removal
     * - JS minification
     * - HTML minification
     * - CSS minification
     *
     * It should be used only for development to reduce build time. Output will contain more data
     * and therefore will be bigger.
     *
     * Defaults to `false`.
     */
    this.noOptimization = opts.noOptimization;
    /**
     * Disables CSS minification (CSS files and `<style>` declarations).
     *
     * Defaults to `false`.
     */
    this.noCssOptimization = opts.noCssOptimization;
    /**
     * Disables HTML minification. Also disables comments removal.
     *
     * Defaults to `false`.
     */
    this.noHtmlOptimization = opts.noHtmlOptimization;
    /**
     * Disables JavaScript compilation with Google Closure Compiler.
     *
     * Defaults to `false`.
     */
    this.noJsOptimization = opts.noJsOptimization;
    /**
     * A release version to use. This can be udndefined for the lates release.
     * Otherwise it will try to dowload the console for specific version.
     */
    this.tagVersion = opts.tagVersion;
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
     * and will produce the follwing output:
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
     * @type {Array}
     */
    this.attributes = opts.attributes;
  }

  get validOptions() {
    return [
      'src', 'dest', 'useJson', 'inlineJson', 'sourceIsZip', 'embedded',
      'verbose', 'raml', 'jsCompilationLevel', 'noOptimization',
      'noOptimization', 'noCssOptimization', 'noHtmlOptimization',
      'noJsOptimization', 'tagVersion', 'mainFile', 'attributes'
    ];
  }

  get isValid() {
    return this.validationErrors.length === 0;
  }

  _setDefaults(opts) {
    // Will use latest release version.
    // if (!('src' in opts)) {
    //   opts.src = './';
    // }
    if (!('dest' in opts)) {
      opts.dest = 'build';
    }
    if (!('useJson' in opts)) {
      opts.useJson = false;
    }
    if (!('inlineJson' in opts)) {
      opts.inlineJson = false;
    }
    if (!('sourceIsZip' in opts)) {
      opts.sourceIsZip = false;
    }
    if (!('embedded' in opts)) {
      opts.embedded =  false;
    }
    if (!('verbose' in opts)) {
      opts.verbose =  false;
    }
    if (!('raml' in opts)) {
      opts.raml = false;
    }
    if (!('jsCompilationLevel' in opts)) {
      opts.jsCompilationLevel = 'WHITESPACE_ONLY';
    }
    if (!('noOptimization' in opts)) {
      opts.noOptimization = false;
    }
    if (!('noCssOptimization' in opts)) {
      opts.noCssOptimization = false;
    }
    if (!('noHtmlOptimization' in opts)) {
      opts.noHtmlOptimization = false;
    }
    if (!('noJsOptimization' in opts)) {
      opts.noJsOptimization = false;
    }
    if ('tagVersion' in opts) {
      opts.tagVersion = opts.tagVersion;
    }

    var jsonFileAttribute = this._findAttribute('json-file');
    if (!jsonFileAttribute && opts.raml && opts.useJson && !opts.inlineJson) {
      if (!opts.attributes) {
        opts.attributes = [];
      }
      opts.attributes.push({
        'json-file': 'api.json'
      });
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

    this.validationErrors = [];
    this.validationWarnings = [];

    this._validateOptionsList(userOpts);
    this._validateCompilerLevel(userOpts);
    this._validateSourceOptions(userOpts);
    this._validateNoCompilationOptions(userOpts);
    this._validateAttributes(userOpts);
    this._validateApiFileOptions(userOpts);
  }

  _validateOptionsList(userOpts) {
    var keys = Object.keys(userOpts);
    var known = this.validOptions;
    var unknown = keys.filter((property) => known.indexOf(property) !== -1);

    if (unknown.length) {
      let message = 'Unknown option';
      if (unknown.length > 1) {
        message += 's';
      }
      message += ': ' + unknown.join(', ');
      this.validationErrors.push(message);
    }
  }

  _validateCompilerLevel(userOpts) {
    if (!('jsCompilationLevel' in userOpts)) {
      return;
    }
    var level = userOpts.jsCompilationLevel;
    if (level === 'ADVANCED') {
      let msg = 'ADVANCED compilation level will probably broke the ';
      msg = 'application code. Use it on your own risk.';
      this.validationWarnings.push(msg);
      return;
    }
    if (!~['SIMPLE', 'WHITESPACE_ONLY'].indexOf(level)) {
      let msg = 'Unknown JavaScript compilation level ' + level;
      this.validationErrors.push(msg);
    }
  }

  _validateSourceOptions(userOpts) {
    if (userOpts.src && userOpts.tagVersion) {
      this.validationErrors.push(
        'The src and tagVersion are options are mutually exclusive. Choose ' +
        'only one option.'
      );
    }

    if (userOpts.sourceIsZip && !userOpts.src) {
      this.validationWarnings.push(
        'sourceIsZip is unnecessary when src is not set'
      );
    }

    if (userOpts.sourceIsZip && userOpts.tagVersion) {
      this.validationWarnings.push(
        'sourceIsZip is unnecessary when tagVersion is set'
      );
    }
  }

  _validateNoCompilationOptions(userOpts) {
    if (!userOpts.noOptimization) {
      return;
    }
    if (userOpts.noJsOptimization) {
      this.validationWarnings.push(
        'noJsOptimization is redundant with noOptimization set'
      );
    }
    if (userOpts.noCssOptimization) {
      this.validationWarnings.push(
        'noCssOptimization is redundant with noOptimization set'
      );
    }
    if (userOpts.noHtmlOptimization) {
      this.validationWarnings.push(
        'noHtmlOptimization is redundant with noOptimization set'
      );
    }
  }

  _validateAttributes(userOpts) {
    if (!userOpts.attributes) {
      return;
    }
    if (!(userOpts.attributes instanceof Array)) {
      this.validationErrors.push(
        'The attributes option is not an array.'
      );
    }
  }

  _validateApiFileOptions(userOpts) {
    var jsonFileAttribute = this._findAttribute('json-file');
    if (!jsonFileAttribute) {
      return;
    }
    var value = jsonFileAttribute.value;
    var type = typeof value;
    if (type !== 'string') {
      this.validationErrors.push(
        'The jsonFile option must be a string. ' + type + ' was given.'
      );
      return;
    }
    // Allow plain build with JSON file attribute set.
    if (userOpts.raml && !userOpts.useJson) {
      this.validationWarnings.push(
        'The jsonFile option is set without useJson option. It will be ' +
        'ignored.'
      );
    }
  }

  _findAttribute(userOpts, name) {
    if (!userOpts.attributes || !(userOpts.attributes instanceof Array)) {
      return;
    }
    for (let i = 0, len = userOpts.attributes.length; i < len; i++) {
      let item = userOpts.attributes[i];
      if (typeof item === 'string') {
        if (item === name) {
          return item;
        }
        continue;
      }
      let keys = Object.keys(item);
      for (let j = 0, lenKeys = keys.length; j < lenKeys; j++) {
        if (keys[j] === name) {
          return {
            name: keys[j],
            value: item[keys[j]]
          };
        }
      }
    }
  }
}
exports.BuilderOptions = BuilderOptions;
