/** @typedef {import('winston').Logger} Winston */

/* eslint-disable no-empty-function */
/**
 * @return {void}
 */
const f = () => {};

/**
 * @return {Winston}
 */
export function dummyLogger() {
  // @ts-ignore
  return { info: f, log: f, warn: f, error: f, debug: f };
}
