/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */

import winston from 'winston';
import { BuilderOptions, ProjectConfiguration } from './BuilderOptions';

/**
 * A class responsible for performing basic operations on a source files
 * and build locations.
 */
export declare class SourceControl {
  logger: winston.Logger;
  opts: BuilderOptions|ProjectConfiguration;
  /**
   * Constructs the processor.
   *
   * @param opts Options passed to the module
   * @param logger Logger to use to log debug output
   */
  constructor(opts: BuilderOptions|ProjectConfiguration, logger: winston.Logger);

  /**
   * Clears the directory where the bundled console will be copied.
   * @return {Promise<void>}
   */
  clearOutputDir(): Promise<void>;

  /**
   * Creates a working directory where the files will be processed.
   *
   * @return Resolved promise when the tmp dire was created with path to the working directory.
   */
  createWorkingDir(): Promise<string>;

  /**
   * Cleans up the temporaty directory.
   *
   * @param dir Path to the temporaty directory.
   * @returns
   */
  cleanup(dir: string): Promise<void>;

  /**
   * Creates a temp working dir for the console.
   * @returns A path to created temporary directory.
   */
  createTempDir(): Promise<string>;

  /**
   * Copy generated files from the temp build folder to
   * the right place defined in `opts.dest`.
   *
   * @param from A folder containing build files.
   * @param buildDir Build output directory
   */
  copyOutput(from: string, buildDir: string): Promise<void>;
}
