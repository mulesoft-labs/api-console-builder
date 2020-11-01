/**
 * Copyright (C) MuleSoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */

import winston from 'winston';

/**
 * Installs dependencies in the working directory
 */
export class DependencyManager {
  workingDir: string;
  logger: winston.Logger;
  tagName?: string;

  /**
   * @param workingDir Build directory location
   * @param logger Logger object
   * @param tagName specific tag name to install
   */
  constructor(workingDir: string, logger: winston.Logger, tagName?: string);
  /**
   * Installs dependencies and specified version of API Console.
   */
  install(): Promise<void>;

  /**
   * Installs dependencies from `package.json` file.
   */
  installNpm(): Promise<void>;

  /**
   * Installs API Console from specified in `tagName` or otherwise latest version.
   */
  installConsole(): Promise<void>;

  /**
   * Runs command in a separated process.
   * @param command The command to execute.
   */
  _runCmd(command: string): Promise<void>;
}
