/**
 * Copyright (C) MuleSoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */

import winston from 'winston';

/**
 * A class that handles module's templates, copy them to working directory
 * and processes variables in the templates.
 */
export class TemplateManager {
  workingDir: string;
  logger: winston.Logger;
  /**
   * Constructs the processor.
   *
   * @param workingDir Path to the working directory with API console build.
   * @param logger Logger to use to log debug output. Can be any object
   * with the interface compatible platform's console object.
   */
  constructor(workingDir: string, logger: winston.Logger);

  /**
   * Copies version 6 template to the working directory.
   */
  copyTemplate(): Promise<void>;
}
