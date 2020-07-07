/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
import winston from 'winston';

/**
 * Bundles the console sources.
 */
export declare class Bundler {
  /**
   * The destination location for the build
   */
  readonly dest: string;
  workingDir: string;
  logger: winston.Logger;
  constructor(workingDir: string, logger: winston.Logger);

  /**
   * Creates API Console bundles.
   */
  bundle(): Promise<void>;

  /**
   * Removes build destination output directory.
   */
  cleanOutput(): Promise<void>;

  /**
   * Bundles the console.
   */
  runBundler(): Promise<void>;

  /**
   * Runs command in a separated process.
   * @param command The command to execute.
   */
  _runCmd(command: string): Promise<void>;
}
