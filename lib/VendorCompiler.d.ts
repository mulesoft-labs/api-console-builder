import winston from 'winston';

/**
 * A class responsible for creating the `vendor.js` file.
 */
export class VendorCompiler {
  logger: winston.Logger;
  workingDir: string;
  /**
   * @param workingDir Build directory location
   * @param logger Logger object
   */
  constructor(workingDir: string, logger: winston.Logger);

  /**
   * Creates the `vendor.js` file.
   * @returns Promise resolved when the vendor file is created.
   */
  compile(): Promise<void>;
}
