/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */
import amf from 'amf-client-js';
import winston from 'winston';

/** @typedef {import('winston').Logger} Winston */

declare function validateDoc(type: string, doc: amf.model.document.BaseUnit, logger: winston.Logger): Promise<void>;

/**
 * A class to generate AMF json/ld data model.
 * It is using the "editing" pipeline created for the console
 * by the AMF team.
 */
export class AmfSource {
  constructor(logger: winston.Logger);

  /**
   * Generates the json/ld model from an API file.
   * @param location API file location
   * @param type API type.
   * @param contentType API mime type.
   * @return Promise resolved to a model.
   */
  getModel(location: string, type: string, contentType?: string): Promise<amf.model.document.BaseUnitWithDeclaresModelAndEncodesModel>;

  /**
   * Saves the model to a file.
   * @param model json/ld model
   * @param file Path to a file where to savbe the model.
   */
  saveModel(model: amf.model.document.BaseUnitWithDeclaresModelAndEncodesModel, file: string): Promise<void>;
}
