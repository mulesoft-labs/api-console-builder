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
class ApiConsoleBuilderOptions {
  constructor(opts) {
    opts = opts || {};
    opts = this._setDefaults(opts);

    /**
     * Source directory for the API console.
     * If the `src` is an URL is expect to be a zip file that will be uncopressed.
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
     * Will set `no-tryit` attribute on the `<api-console>` element that will disable
     * request / response panels.
     *
     * Defaults to `false`.
     */
    this.noTryit = opts.noTryit;
    /**
     * Will set the `narrow` attribute on the `<api-console>` element that will force the console
     * to render the mobile like view.
     *
     * Defaults to `false`
     */
    this.narrowView = opts.narrowView;
    /**
     * Will set the `proxy` attribute on the `<api-console>` element.
     * Sets the proxy URL for the HTTP requests sent from the console. If set then all URLs will be
     * altered before sending the data to a transport library by prefixing the URL with this value.
     *
     * Defaults to `undefined`
     */
    this.proxy = opts.proxy;
    /**
     * Will set the `proxy-encode-url` attribute on the `<api-console>` element that will encode
     * the URL value before appending it to the proxy prefix.
     *
     * Defaults to `false`
     */
    this.proxyEncodeUrl = opts.proxyEncodeUrl;
    /**
     * Will set the `append-headers` attribute on the `<api-console>` element.
     * Forces the console to send specific list of headers, overriding user input if needed.
     *
     * Defaults to `undefined`.
     */
    this.appendHeaders = opts.appendHeaders;
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
  }

  _setDefaults(opts) {
    if (!('src' in opts)) {
      opts.src = './';
    }
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
    if (!('noTryit' in opts)) {
      opts.noTryit = false;
    }
    if (!('narrowView' in opts)) {
      opts.narrowView = false;
    }
    if (!('proxy' in opts)) {
      opts.proxy = undefined;
    }
    if (!('proxyEncodeUrl' in opts)) {
      opts.proxyEncodeUrl = false;
    }
    if (!('appendHeaders' in opts)) {
      opts.appendHeaders = undefined;
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
    return opts;
  }
}
exports.ApiConsoleBuilderOptions = ApiConsoleBuilderOptions;
