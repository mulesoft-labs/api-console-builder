/**
 * Copyright (C) MuleSoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
import winston from 'winston';
import amf from 'amf-client-js';
import { SourceControl } from './SourceControl';
import { BuilderOptions, ProjectConfiguration } from './BuilderOptions';
import { CacheBuild } from './CacheBuild';

/**
 * A class that manages the project build process.
 * It splits for project v4 and v5 depending on configuration.
 */
export declare class ApiConsoleProject {
  /**
   * A class that manages API Console sources
   */
  readonly sourceControl: SourceControl;
  opts: BuilderOptions;
  logger: winston.Logger;
  cache: CacheBuild;
  apiDataFile: string;
  apiModel: amf.model.document.BaseUnitWithDeclaresModelAndEncodesModel;

  /**
   * @param opts User configuration
   */
  constructor(opts?: ProjectConfiguration|BuilderOptions);

  /**
   * Creates a logger object to log debug output.
   */
  __setupLogger(opts: BuilderOptions): winston.Logger;

  /**
   * Prints warning messages to the logger.
   */
  printValidationWarnings(): void;

  /**
   * Prints error messages to the logger.
   */
  printValidationErrors(): void;

  /**
   * Bundles API console.
   */
  bundle(): Promise<void>;

  /**
   * Restores cached build and generates API data model.
   */
  buildFromCache(): Promise<void>;

  /**
   * Builds API console from sources.
   * This is called when cache file is not found.
   *
   * @param workingDir The temporary working dir
   */
  buildFromSources(workingDir: string): Promise<void>;

  /**
   * Contains all the tasks that have to be executed before running the builder.
   * @param workingDir The temporary working dir
   * @returns Resolved promise when all pre-build work has been
   * completed.
   */
  prepareBuild(workingDir: string): Promise<void>;

  /**
   * Installs console's dependencies and if needed copies console source
   * files to `bower_components` directory.
   *
   * @param workingDir The temporary working dir
   */
  installDependencies(workingDir: string): Promise<void>;

  /**
   * Copies template files to the working directory.
   *
   * @param workingDir The temporary working dir
   */
  processTemplates(workingDir: string): Promise<void>;

  /**
   * Reads the API data.
   *
   * @param workingDir Location where to put model file.
   */
  processApi(workingDir: string): Promise<void>;

  /**
   * Overrides default theme with user specified theme file.
   *
   * @param workingDir The temporary working dir
   */
  ensureTheme(workingDir: string): Promise<void>;

  /**
   * Overrides default `index.html` with user specified index file.
   *
   * @param workingDir The temporary working dir
   */
  ensureApplicationIndexFile(workingDir: string): Promise<void>;

  /**
   * Reads API title if available.
   */
  getApiTitle(): string|undefined;

  /**
   * Updates application's index file variables.
   *
   * Currently it only updates `<title>` tag contents.
   *
   * @param workingDir The temporary working dir
   */
  updateTemplateVariables(workingDir: string): Promise<void>;

  /**
   * Runs build library to bundle the application.
   *
   * @param workingDir The temporary working dir
   */
  performBuild(workingDir: string): Promise<void>;

  /**
   * Sets attributes to the `index.html` file for standalone build.
   *
   * @param workingDir The temporary working dir
   */
  setApplicationAttributes(workingDir: string): Promise<void>;

  /**
   * Action to perform after the build is complete.
   *
   * @param workingDir The temporary working dir
   */
  postBuild(workingDir: string): Promise<void>;

  /**
   * Creates a `vendor.js` file in the build directory.
   * @param workingDir The temporary working dir
   */
  buildVendorPackage(workingDir: string): Promise<void>;

  /**
   * Prints end message to the user.
   */
  sayGoodbye(): void;
}
