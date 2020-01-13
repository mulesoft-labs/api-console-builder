/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';
import colors from 'colors/safe.js';
import { SourceControl } from './SourceControl.js';
import { AmfSource } from './AmfSource.js';
import { AttributesProcessor } from './AttributesProcessor.js';
import { BuilderOptions } from './BuilderOptions.js';
import { CacheBuild } from './CacheBuild.js';
import { TemplateManager } from './TemplateManager.js';
import { DependencyManager } from './DependencyManager.js';
import { Bundler } from './Bundler.js';
import { VendorCompiler } from './VendorCompiler.js';

const debugFile = 'api-console-builder-debug.log';

/**
 * A class that manages the project build process.
 * It splits for project v4 and v5 depending on configuration.
 */
export class ApiConsoleProject {
  /**
   * @constructor
   * @param {Object?} opts User configuration
   */
  constructor(opts={}) {
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
    this.cache = new CacheBuild(opts, this.logger);
    this.apiDataFile = 'api-model.json';
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
    const level = this.opts.verbose ? 'debug' : 'warn';
    this.debugFile = path.join(process.cwd(), debugFile);
    const format = winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    );
    const logger = winston.createLogger({
      level,
      format,
      exitOnError: false,
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: this.debugFile, level: 'error' })
      ]
    });
    return logger;
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
   * Bundles API console.
   *
   * @return {Promise<void>}
   */
  async bundle() {
    try {
      await this.sourceControl.clearOutputDir();
      const exists = await this.cache.hasCache();
      if (exists) {
        await this.buildFromCache();
      } else {
        this.workingDir = await this.sourceControl.createWorkingDir();
        await this.buildFromSources(this.workingDir);
      }
      if (this.debugFile) {
        await fs.remove(this.debugFile);
      }
      this.sayGoodbye();
    } catch (e) {
      this.logger.error('');
      this.logger.error(colors.red(e.message));
      this.logger.error(colors.red(e.stack));
      this.logger.error('');
      if (this.workingDir) {
        await this.sourceControl.cleanup(this.workingDir);
      }
      if (this.opts.exitOnError) {
        process.exit(1);
      }
    }
  }

  /**
   * Restores cached build and generates API data model.
   *
   * @return {Promise}
   */
  async buildFromCache() {
    const { logger } = this;
    const { destination } = this.opts;
    logger.info('Re-using cached build.');
    try {
      await this.cache.restore(destination);
      await this.processApi(destination);
    } catch (e) {
      logger.warn('Unable to restore cache file');
      logger.log(e);
      logger.warn('Building from sources.');
      await this.buildFromSources();
    }
  }

  /**
   * Builds API console from sources.
   * This is called when cache file is not found.
   *
   * @param {String} workingDir
   * @return {Promise}
   */
  async buildFromSources(workingDir) {
    await this.processApi(workingDir);
    await this.prepareBuild(workingDir);
    await this.buildVendorPackage(workingDir);
    await this.performBuild(workingDir);
    await this.postBuild(workingDir);
    await this.clearDebugFile();
  }

  /**
   * Contains all the tasks that have to be executed before running the builder.
   * @param {String} workingDir
   * @return {Promise} Resolved promise when all pre-build work has been
   * completed.
   */
  async prepareBuild(workingDir) {
    this.logger.debug('Preparing build process...');
    await this.processTemplates(workingDir);
    await this.installDependencies(workingDir);
    await this.ensureTheme(workingDir);
    await this.ensureApplicationIndexFile(workingDir);
    await this.setApplicationAttributes(workingDir);
    await this.updateTemplateVariables(workingDir);
  }

  /**
   * Installs console's dependencies and if needed copies console source
   * files to `bower_components` directory.
   *
   * @param {String} workingDir
   * @return {Promise}
   */
  async installDependencies(workingDir) {
    const { logger, opts } = this;
    const dm = new DependencyManager(workingDir, logger, opts.tagName);
    await dm.install();
  }

  /**
   * Copies template files to the working directory.
   *
   * @param {String} workingDir
   * @return {Promise<void>}
   */
  async processTemplates(workingDir) {
    const processor = new TemplateManager(
      workingDir,
      this.logger
    );
    await processor.copyTemplate();
  }

  /**
   * Reads the API data.
   *
   * @param {String} workingDir Location where to put model file.
   * @return {Promise<void>}
   */
  async processApi(workingDir) {
    const processor = new AmfSource(this.logger);
    const { api, apiType, apiMediaType } = this.opts;
    const model = await processor.getModel(api, apiType, apiMediaType);
    this.apiModel = model;
    await fs.ensureDir(workingDir);
    const dest = path.join(workingDir, this.apiDataFile);
    await fs.remove(dest);
    await processor.saveModel(model, dest);
  }

  /**
   * Overrides default theme with user specified theme file.
   *
   * @param {String} workingDir
   * @return {Promise<void>}
   */
  async ensureTheme(workingDir) {
    const { logger } = this;
    const { themeFile, strict } = this.opts;
    if (!themeFile) {
      return;
    }
    logger.debug(`Processing custom theme file ${themeFile}...`);
    const exists = await fs.pathExists(themeFile);
    if (!exists) {
      if (strict) {
        throw new TypeError(`Theme file ${themeFile} does not exists. Aborting.`);
      }
      logger.warn('Theme file does not exists. Ignoring.');
      return;
    }
    logger.debug('Overriding default theme file...');
    const dest = path.join(workingDir, 'styles.css');
    await fs.copy(themeFile, dest);
  }

  /**
   * Overrides default `index.html` with user specified index file.
   *
   * @param {String} workingDir
   * @return {Promise<void>}
   */
  async ensureApplicationIndexFile(workingDir) {
    const { logger } = this;
    const { indexFile, strict } = this.opts;
    if (!indexFile) {
      return;
    }
    logger.debug(`Processing custom application index file ${indexFile}...`);
    const exists = await fs.pathExists(indexFile);
    if (!exists) {
      if (strict) {
        throw new TypeError(`Index file ${indexFile} does not exists. Aborting.`);
      }
      logger.warn('Index file does not exists. Ignoring.');
      return;
    }
    logger.debug('Overriding default index file...');
    const dest = path.join(workingDir, 'index.html');
    await fs.copy(indexFile, dest);
  }

  /**
   * Reads API title if available.
   * @return {String|undefined}
   */
  getApiTitle() {
    const { apiModel } = this;
    if (!apiModel) {
      return;
    }
    if (!apiModel.encodes || !apiModel.encodes.name || !apiModel.encodes.name.value) {
      return;
    }
    return apiModel.encodes.name.value();
  }

  /**
   * Updates application's index file variables.
   *
   * Currently it only updates `<title>` tag contents.
   *
   * @param {String} workingDir
   * @return {Promise<void>}
   */
  async updateTemplateVariables(workingDir) {
    let title = this.opts.appTitle || this.getApiTitle();
    if (!title) {
      title = 'API Console';
    }
    const file = path.join(workingDir, 'index.html');
    let contents = await fs.readFile(file, 'utf8');
    contents = contents.replace('[[API-TITLE]]', title);
    await fs.writeFile(file, contents, 'utf8');
  }

  /**
   * Runs build library to bundle the application.
   *
   * @param {String} workingDir
   * @return {Promise<void>}
   */
  async performBuild(workingDir) {
    const { logger } = this;
    const builder = new Bundler(workingDir, logger);
    await builder.bundle();
  }

  /**
   * Sets attributes to the `index.html` file for standalone build.
   *
   * @param {String} workingDir
   * @return {Promise}
   */
  async setApplicationAttributes(workingDir) {
    const { attributes } = this.opts;
    if (!attributes || !attributes.length) {
      return;
    }
    const { logger } = this;
    const file = path.join(workingDir, 'index.html');
    const processor = new AttributesProcessor(attributes, logger, file);
    await processor.setAttributes();
  }

  /**
   * Action to perform after the build is complete.
   *
   * @param {String} workingDir
   * @return {Promise}
   */
  async postBuild(workingDir) {
    let { destination } = this.opts;
    if (!destination) {
      destination = 'dest';
    }
    await fs.remove(destination);
    const src = path.join(workingDir, 'dist');
    await fs.copy(src, destination);
    await this.sourceControl.cleanup(workingDir);
    if (!this.opts.noCache) {
      await this.cache.cacheBuild(destination);
    } else {
      this.logger.debug('Ignoring caching result.');
    }
  }

  /**
   * Creates a `vendor.js` file in the build directory.
   * @param {String} workingDir
   * @return {Promise}
   */
  async buildVendorPackage(workingDir) {
    const compiler = new VendorCompiler(workingDir, this.logger);
    await compiler.compile();
  }

  /**
   * Removes debug file.
   * @return {Promise}
   */
  async clearDebugFile() {
    await fs.remove(debugFile);
  }

  /**
   * Prints end message to the user.
   */
  sayGoodbye() {
    let message = '\n\nAPI console build ready.\n';
    message += 'Thank you for using our API tools!\n';
    /* eslint-disable-next-line no-console */
    console.log(message);
  }
}
