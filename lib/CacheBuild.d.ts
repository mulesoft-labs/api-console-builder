/**
 * Copyright (C) MuleSoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
import yauzl from 'yauzl';
import winston from 'winston';
import { BuilderOptions, ProjectConfiguration } from './BuilderOptions';

/**
 * A class responsible for caching and restoring complete build
 * of the API console.
 * It speeds up the build process on development machines.
 * This should not be used in the CI pipeline as it will prohibit downloading
 * latest version of the components.
 */
export class CacheBuild {
  opts: BuilderOptions|ProjectConfiguration;
  logger: winston.Logger;
  hash?: string;
  cacheFolder?: string;
  /**
   * @param opts User options.
   */
  constructor(opts: BuilderOptions|ProjectConfiguration, logger: winston.Logger);

  /**
   * Creates a path to cache folder under user data folder.
   *
   * @param platform Current platform. If not set `process.platform`
   * is used.
   */
  locateAppDir(platform?: string): string;

  /**
   * Creates cache file sha256 hash from user options.
   * This should ensure uniques of cached versions of the build.
   *
   * Note, only options that influence final build are considered.
   *
   * @param opts Builder options
   * @returns Cache file sha256 hash.
   */
  createHash(opts: BuilderOptions|ProjectConfiguration): string;

  /**
   * Checks if cache file exists.
   */
  hasCache(): Promise<boolean>;

  /**
   * Restores cached build to `build` location.
   * @param build Build location
   */
  restore(build: string): Promise<void>;

  /**
   * Unzips files from the zip file and copy them to the destination folder.
   *
   * @param source File location.
   * @param destination Folder where to put the files.
   */
  _processZip(source: string, destination: string): Promise<void>;

  /**
   * Copies a file to the destination file.
   * @param zip The source zip file
   * @param entry A currently iterated entry
   * @param destination Folder where to put the file.
   */
  _processZipEntry(zip: yauzl.ZipFile, entry: yauzl.Entry, destination: string): Promise<void>;

  /**
   * Copies entry of a zip file to the destination.
   * @param zip The source zip file
   * @param entry A currently iterated entry
   * @param destination Folder where to put the file.
   */
  _copyZipEntry(zip: yauzl.ZipFile, entry: yauzl.Entry, destination: string): Promise<void>;

  /**
   * Caches build files.
   * @param sources Location of generated build files.
   * @returns Resolved when file is created
   */
  cacheBuild(sources: string): Promise<void>;

  /**
   * Creates a build cache file.
   * @param sources Location of generated build files.
   * @returns Resolved when file is created
   */
  _createPackage(sources: string): Promise<void>;
}
