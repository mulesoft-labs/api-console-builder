import winston from 'winston';

/**
 * API Console project configuration options.
 * These options are to be passed to the main module as a user configuration.
 */
export declare interface ProjectConfiguration {
  /**
   * A release tag name to use. With this option the builder uses specific
   * release of the console. If not set and `src` is not set it uses latest
   * release. Note, only versions >= 6.0.0 can be used with this builder.
   */
  tagName?: string;

  /**
   * Output directory.
   *
   * @default `build`.
   */
  destination?: string;

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
   * @default `undefined`.
   */
  api?: string;

  /**
   * Type of an API spec file recognizable by [AMF](https://github.com/mulesoft/amf).
   * To be set with `api` property.
   *
   * By default AMF supports following types:
   * - `RAML 0.8`
   * - `RAML 1.0`
   * - `OAS 2.0`
   * - `OAS 3.0`
   */
  apiType?: string;

  /**
   * Media type of the API.
   * For RAML files it is always `application/yaml`.
   * OAS comes with two flavours: `application/yaml` and `application/json`.
   *
   * Use it when the library can't process API spec file due to processing error.
   *
   * @default application/raml
   */
  apiMediaType?: string;

  /**
   * Prints a debug messages.
   */
  verbose?: boolean;

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
   */
  attributes?: (string|object)[];

  /**
   * A console like object to print debug output.
   * If not set and `verbose` option is set then it creates it's own logger.
   */
  logger?: winston.Logger;

  /**
   * Location to a theme file with styles definition of the console.
   * It replaces Console's own styles definition.
   * See theming documentation of the API console for more information.
   */
  themeFile?: string;

  /**
   * Location to a custom `index.html` file that will be used instead of the
   * default template.
   *
   * The template file must include vendor package, API Console sources, and
   * the use of API Console. See `templates/index.html` for an example.
   */
  indexFile?: string

  /**
   * By default the builder caches build results in user home folder and uses generated
   * sources to speed up the build process.
   *
   * Note, options that influence the build process (`tagName`,
   * `themeFile`, `indexFile`, etc) creates new cached file.
   *
   * API model is never cached.
   */
  noCache?: boolean;

  /**
   * Decides whether to finish current process with non-zero exit code on
   * error.
   *
   * @default true
   */
  exitOnError?: boolean;

  /**
   * When set to `true` it will stop build process with error when a minor
   * issue has been detected, like missing theme file in declared location
   * which is normally ignored.
   *
   * @default false
   */
  strict?: boolean;

  /**
   * Optional application title put into HTML's `<title>` tag.
   * By default it uses API title or `API Console` if missing.
   */
  appTitle?: string;
}

export declare interface BuilderOptions extends ProjectConfiguration {}
/**
 * An init options for the API console builder.
 *
 * It sets user settings and apply default settings if needed.
 */
export declare class BuilderOptions {

  /**
   * Map of options with data types
   */
  readonly validOptions: object;

  /**
   * List of supported API spec formats
   */
  readonly supportedApiTypes: string[];

  /**
   * True if there's no error messages.
   */
  readonly isValid: boolean;

  /**
   * A list of configuration error messages
   */
  validationErrors: string[];

  /**
   * A list of configuration warning messages
   */
  validationWarnings: string[];

  /**
   * @param opts User options
   */
  constructor(opts?: ProjectConfiguration|BuilderOptions);

  /**
   * Validates passed user options for data type and names.
   */
  _validateOptionsList(userOpts: ProjectConfiguration): void;

  /**
   * Validates user option for the `logger` property.
   *
   * @param userOpts Passed user options.
   */
  _validateLogger(userOpts: ProjectConfiguration): void;

  /**
   * Creates default values for passed options.
   */
  _setDefaults(opts: ProjectConfiguration): ProjectConfiguration;

  /**
   * Validates user input options.
   * Sets `_validationErrors` and `_validationWarnings` arrays on this object
   * containing corresponding messages.
   *
   * @param userOpts User options to check.
   */
  validate(userOpts?: ProjectConfiguration): void;

  /**
   * Validates `api` and `apiType` properties
   * @param userOpts User options
   */
  _validateApiOptions(userOpts: ProjectConfiguration): void;

  /**
   * Validates whether passed tagName is in supported by this version range.
   * @param userOpts User options
   */
  _validateTagName(userOpts: ProjectConfiguration): void;
}
