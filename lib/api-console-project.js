const winston = require('winston');
const path = require('path');
const {SourceControl} = require('./source-control');
const {ApiConsoleSources} = require('api-console-sources-resolver');
const {ApiConsoleTransport} = require('api-console-github-resolver');
const {ApiConsoleGithubResolver} = require('api-console-github-resolver');
const consoleDependencies = require('api-console-dependency-manager');
const colors = require('colors/safe');
const {AmfSource} = require('./amf-source');
const {AttributesProcessor} = require('./attributes');
const fs = require('fs-extra');
const {BuilderOptions} = require('./builder-options');
/**
 * A class that manages the project build process.
 * It splits for project v4 and v5 depending on configuration.
 */
class ApiConsoleProject {
  /**
   * @constructor
   * @param {?Object} opts User configuration
   */
  constructor(opts) {
    if (!(opts instanceof BuilderOptions)) {
      opts = new BuilderOptions(opts);
    }
    this.opts = opts;
    this.logger = this.__setupLogger(opts);
    this.printValidationWarnings();
    if (!this.opts.isValid) {
      this.printValidationErrors();
      throw new Error('Options did not passes validation.');
    }
    opts.logger = this.logger;
    // Working dir from which the command was executed.
    this.startDir = process.cwd();
    this.workingBuildOutput = 'build';
  }
  /**
   * Creates a logger object to log debug output.
   *
   * @param {Object} opts
   * @return {Object}
   */
  __setupLogger(opts) {
    if (opts.logger) {
      return opts.logger;
    }
    const level = this.opts.verbose ? 'debug' : 'error';
    return new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({level: level}),
        new (winston.transports.File)({
          filename: path.join(process.cwd(), 'api-console-debug.log'),
          level: 'error'
        })
      ]
    });
  }

  /**
   * Prints varning messages to the logger.
   */
  printValidationWarnings() {
    const warnings = this.opts.validationWarnings;
    if (!warnings || !warnings.length) {
      return;
    }
    warnings.forEach((warning) => {
      this.logger.warn(warning);
    });
  }

  /**
   * Prints error messages to the logger.
   */
  printValidationErrors() {
    this.opts.validationErrors.forEach((error) => {
      this.logger.error(error);
    });
  }
  /**
   * A class that manages API Console sources
   *
   * @return {SourceControl}
   */
  get sourceControl() {
    if (!this.__sourceControl) {
      this.__sourceControl = new SourceControl(this.opts, this.logger);
    }
    return this.__sourceControl;
  }
  /**
   * Returns a reference to an ApiConsoleSources.
   *
   * @return {ApiConsoleSources}
   */
  get consoleSources() {
    if (!this.__consoleSources) {
      const resolver = new ApiConsoleGithubResolver({
        token: process.env.GITHUB_TOKEN
      });
      const transport = new ApiConsoleTransport();
      const opts = {};
      if (typeof this.opts.tagName !== 'undefined') {
        opts.tagName = this.opts.tagName;
      }
      if (typeof this.opts.local !== 'undefined') {
        opts.src = this.opts.local;
      }
      const sources = new ApiConsoleSources(
        opts,
        resolver,
        transport,
        this.logger);
      this.__consoleSources = sources;
    }
    return this.__consoleSources;
  }

  /**
   * Builds the API console.
   * @return {Promise}
   */
  build() {
    this._setup();
    return this._prepareBuild()
    .then(() => this._performBuild())
    .then(() => this._postBuild())
    .then(() => this.clearDebugFile())
    .catch((cause) => {
      this.logger.error('');
      this.logger.error(colors.red(cause.message));
      this.logger.error(colors.red(cause.stack));
      this.logger.error('');

      return this.sourceControl.cleanup(this.workingDir)
      .then(() => {
        process.exit(1);
      });
    });
  }
  /**
   * Sets up variables used in the build process so it is not computed
   * all over again.
   */
  _setup() {
    this._setupBuildType();
    this._setupApiDataModelFile();
    this._setUpAppMainFile();
  }
  /**
   * Sets up the `buildType` property.
   */
  _setupBuildType() {
    let buildType;
    if (this.opts.api && this.opts.withAmf) {
      buildType = 'api';
    } else if (this.opts.api && !this.opts.withAmf) {
      buildType = 'model';
    } else {
      buildType = 'plain';
    }
    this.buildType = buildType;
  }
  /**
   * Sets up `apiDataFile` property that describes API data source.
   * It is either a RAML/OAS file that is used by the AMF parser to render
   * the API dynamically or it is generated AMF json/ld data model file.
   */
  _setupApiDataModelFile() {
    if (this.opts.withAmf) {
      this.apiDataFile = this.opts.api;
    } else {
      this.apiDataFile = 'api-model.json';
    }
  }
  /**
   * Sets up the name of the main file.
   * For embedded console the main file is `api-console.html` and it
   * is downloaded console's main file.
   *
   * The standalone build uses predefined template (from
   * api-console-builder-templates module) that produces `index.html` file.
   */
  _setUpAppMainFile() {
    if (!this.opts.embedded) {
      this.appMainFile = 'index.html';
    } else {
      this.appMainFile = 'api-console.html';
    }
  }
  /**
   * Contains all the tasks that have to be executed before running the builder.
   * @return {Promise} Resolved promise when all pre-build work has been
   * completed.
   */
  _prepareBuild() {
    this.logger.info('Preparing build process...');
    return this._sourcesToWorkingDirectory()
    .then(() => this._manageDependencies())
    .then(() => this._setApi())
    .then(() => this._prebuildTemplates());
  }

  /**
   * Creates a working directory and copies console's sources to it.
   * Also clears build dir.
   *
   * The function sets `this.workingDir` property when working directory is
   * created.
   *
   * @return {Promise} Resolved promise on success.
   */
  _sourcesToWorkingDirectory() {
    return this.sourceControl.clearOutputDir()
    .then(() => this.sourceControl.createWorkingDir())
    .then((workingDir) => {
      this.workingDir = workingDir;
      return this.consoleSources.sourcesTo(this.workingDir);
    });
  }
  /**
   * Installs console's dependencies and if needed copies console source
   * files to `bower_components` directory.
   *
   * @return {Promise}
   */
  _manageDependencies() {
    const standalone = !this.opts.embedded;
    let opts = {
      verbose: this.opts.verbose,
      app: standalone,
      isV4: false
    };
    opts.optionalDependencies = this._prepareDependenciesList(standalone);
    const dir = this.workingDir;
    return consoleDependencies.installDependencies(dir, opts, this.logger)
    .then(() => {
      if (standalone) {
        let msg = 'Moving console sources to a bower_components';
        msg += ' for standalone build';
        this.logger.log(msg);
        return this.consoleSources.moveConsoleToBower(dir);
      }
    });
  }
  /**
   * Prepares a list of dependencies to be installed with this build.
   * @param {Boolean} standalone True if this is "standalone" build.
   * @return {Array<String>}
   */
  _prepareDependenciesList(standalone) {
    let dependencies = [
      // oauth popup is always copied
      'advanced-rest-client/oauth-authorization#^2.0.0'
    ];
    if (standalone || this.opts.noCryptoJs !== true) {
      dependencies.push('advanced-rest-client/cryptojs-lib');
    }
    if (standalone || !this.opts.noJsPolyfills) {
      dependencies.push('advanced-rest-client/arc-polyfills');
    }
    if (standalone || !this.opts.noXhr) {
      dependencies.push('advanced-rest-client/xhr-simple-request#^2.0.0');
    }
    if (standalone || !this.opts.noWebAnimations) {
      dependencies.push('web-animations/web-animations-js#^2.3');
    }
    return dependencies;
  }
  /**
   * Copies templates to the working directory and updates path to bower
   * components if needed.
   *
   * @return {Promise}
   */
  _prebuildTemplates() {
    if (this.opts.embedded) {
      return Promise.resolve();
    }
    const {ApiConsoleTemplatesProcessor} =
      require('api-console-builder-templates');
    const processor = new ApiConsoleTemplatesProcessor(
      this.workingDir,
      this.logger,
      {
        isV5: true,
        api: this.opts.api,
        embedded: this.opts.embedded,
        buildType: this.buildType
      }
    );
    return processor.copyV5()
    .then(() => {
      const vars = {
        apiTitle: this._getApiTitle(),
        apiFile: this.apiDataFile
      };
      return processor.processV5Template(vars);
    });
  }
  /**
   * Reads the API data if needed.
   *
   * @return {Promise}
   */
  _setApi() {
    if (this.opts.withAmf || this.opts.embedded) {
      return Promise.resolve();
    }
    const processor = new AmfSource();
    return processor.getModel(this.opts.api, this.opts.apiType)
    .then((model) => {
      this.apiModel = model;
      if (!this.opts.withAmf) {
        return processor.saveModel(model, this.workingDir, this.apiDataFile);
      }
    });
  }
  /**
   * Reads API title if available.
   * @return {String|undefined}
   */
  _getApiTitle() {
    let model = this.apiModel;
    if (!model) {
      return;
    }
    if (!model.encodes || !model.encodes.name || !model.encodes.name.value) {
      return;
    }
    return model.encodes.name.value();
  }
  /**
   * Runs Polymer build library to build the application.
   * @return {Promise}
   */
  _performBuild() {
    if (!this.opts.embedded) {
      if (!this.opts.attributes) {
        this.opts.attributes = [];
      }
      if (this.opts.attributes.indexOf('app') === -1) {
        this.logger.info('Adding "app" attribute for the standalone build.');
        this.opts.attributes.push('app');
      }
    }
    const processor = new AttributesProcessor(this.opts, this.logger,
      path.join(this.workingDir, this.appMainFile));
    const {ApiConsoleBuilder} = require('./builder');
    const builder = new ApiConsoleBuilder(
      this.opts,
      this.logger,
      this.workingDir,
      this.workingBuildOutput,
      this.appMainFile
    );
    return processor.setAttributes()
    .then(() => builder.build())
    .then(() => this.sourceControl.copyOutput(this.workingDir,
      this.workingBuildOutput));
  }

  /**
   * Action to perform after the build is complete.
   * @return {Promise}
   */
  _postBuild() {
    return this.sourceControl.cleanup(this.workingDir);
  }

  /**
   * Removes debug file.
   * @return {Promise}
   */
  clearDebugFile() {
    return fs.remove('api-console-debug.log');
  }
}
exports.ApiConsoleProject = ApiConsoleProject;
