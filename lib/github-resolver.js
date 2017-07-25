'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc
 */

const {Transport} = require('./transport.js');
/**
 * A classs to resolve GitHub repositories versions.
 * It allows to get latest release version and the ZIP url or list available versions.
 */
class GithubResolver {
  constructor() {
    /**
     * Number of requests that this client can perform.
     * -1 if the status is not known
     *
     * @type {Number}
     */
    this.rateLimitRemaining = -1;
    /**
     * A timestamp weh ncurrent limit resets.
     * -1 if the status is not known
     *
     * @type {Number}
     */
    this.resetTime = -1;
    /**
     * A base URL for the releases API
     *
     * @type {String}
     */
    this._githubReleasesUrl = 'https://api.github.com/repos/mulesoft/api-console/releases';
    /**
     * URL to the latest released version
     *
     * @type {String}
     */
    this._latestReleaseUrl = this._githubReleasesUrl + '/latest';
    /**
     * URL to information about particular tag.
     * Before use replace %s with tag name
     *
     * @type {String}
     */
    this._lagReleaseUrl = this._githubReleasesUrl + '/tags/%s';
    /**
     * The transport library.
     *
     * @type {Transport}
     */
    this._transport = new Transport();
    /**
     * Hase headers to be sent to all GitHub requests.
     *
     * @type {Object}
     */
    this._baseHeader = {
      'user-agent': 'mulesoft-labs/api-console-builder'
    };
    /**
     * List of headers to be send when requesting information in JSON.
     * @type {Object}
     */
    this._infoHeaders = Object.assign({}, {
      'Accept': 'application/vnd.github.loki-preview+json'
    }, this._baseHeader);
  }
  /**
   * Computes time to next reset of limit rates in seconds.
   *
   * @return {Number} Number of seconds until GitHub reset time.
   */
  _getResetTime() {
    if (this.resetTime === -1) {
      return -1;
    }
    var now = Date.now();
    return Math.floor((now - this.resetTime) / 1000);
  }
  /**
   * Asserts if the user can make a request to GitHub.
   * If recorded requests limit exceeded the limit it will throw an error with a message that
   * should be displayed to the user.
   *
   * @throws {Error} If the limits has been exceeded
   */
  _assertCanMakeRequest() {
    if (this.rateLimitRemaining === -1) {
      return;
    }
    if (this.rateLimitRemaining === 0) {
      let time = this._getResetTime();
      let message = 'You have used GitHub limit for this hour. ';
      if (time !== -1) {
        message = 'Your limit resets in ' + time + ' seconds.';
      } else {
        message = 'Try again soon.';
      }
      throw new Error(message);
    }
  }
  /**
   * Makes an request to GitHub's endpoint.
   *
   * @param {String} url URL of the resource to get
   * @param {?Object} headers List of headers to send
   * @return {Promise} Promise resolved to an Object or buffer depending on content type.
   */
  _makeRequest(url, headers) {
    try {
      this._assertCanMakeRequest();
    } catch (e) {
      return Promise.reject(e);
    }
    return this._transport.get(url, headers)
    .then((result) => {
      this._handleResponseHeaders();
      return result;
    });
  }
  /**
   * Sets rates limit after current response.
   */
  _handleResponseHeaders() {
    var headers = this._transport.latestHeaders;
    if (!headers) {
      return;
    }
    var remaining = headers['X-RateLimit-Remaining'];
    var reset = headers['X-RateLimit-Reset'];
    if (remaining) {
      remaining = Number(remaining);
      if (remaining === remaining) {
        this.rateLimitRemaining = remaining;
      }
    }
    if (reset) {
      reset = Number(reset);
      if (reset === reset) {
        this.resetTime = reset;
      }
    }
  }

  /**
   * Gets information about latest release.
   *
   * @return {Promise} Returns a JavaScript object with a response from GitHub.
   */
  getLatestInfo() {
    return this._makeRequest(this._githubReleasesUrl, this._infoHeaders)
    .then(info => {
      info = this._filterSupportedTags(info);
      info.sort(this._sortTags.bind(this));
      return info[0];
    });
  }
  /**
   * From the list of releases filters out not supported by the builder.
   * @param {Array} json JSON response from GitHub
   * @return {Array} List of supported releases.
   */
  _filterSupportedTags(json) {
    return json.filter(item => {
      if (item.prerelease) {
        return false;
      }
      try {
        this._assertTag(item.tag_name);
        return true;
      } catch (e) {
        return false;
      }
    });
  }
  /**
   * Function to be used to sort releses information by tag release.
   */
  _sortTags(a, b) {
    var aTagInfo = this._getTagInfo(a.tag_name);
    var bTagInfo = this._getTagInfo(b.tag_name);
    if (aTagInfo.major < bTagInfo.major) {
      return 1;
    }
    if (aTagInfo.major > bTagInfo.major) {
      return -1;
    }

    if (aTagInfo.minor < bTagInfo.minor) {
      return 1;
    }
    if (aTagInfo.minor > bTagInfo.minor) {
      return -1;
    }

    if (aTagInfo.patch < bTagInfo.patch) {
      return 1;
    }
    if (aTagInfo.patch > bTagInfo.patch) {
      return -1;
    }

    return 0;
  }

  _getTagInfo(tag) {
    tag = tag.replace('v', '0');
    var parts = tag.split('.');
    var major = Number(parts[0]);
    var minor = Number(parts[1]);
    var sufix;
    if (parts[2].indexOf('-') !== -1) {
      sufix = parts[2].split('-');
      parts[2] = sufix[0];
      sufix = sufix[1];
    }
    var patch = Number(parts[2]);
    return {
      major: major,
      minor: minor,
      patch: patch,
      sufix: sufix
    };
  }
  /**
   * Gets information about past releases.
   * GitHub allows 30 items per page by default and this is exactly how much you will get
   * by calling this function.
   *
   * @return {Promise} Promise resolves to an array of releases information.
   */
  getReleasesList() {
    return this._makeRequest(this._githubReleasesUrl, this._infoHeaders);
  }
  /**
   * Gets release information about tagged release.
   *
   * @param {String} tag Release tag name
   * @return {Promise} Resolved promise with an `Object` with release information.
   */
  getTagInfo(tag) {
    try {
      this._assertTag(tag);
    } catch (e) {
      return Promise.reject(e);
    }
    var url = this._lagReleaseUrl.replace('%s', tag);
    return this._makeRequest(url, this._infoHeaders)
    .then((result) => {
      if (this._transport.latestStatus === 404) {
        return this.getReleasesList()
        .then((list) => this._getReleasesListErrorMessage(tag, list))
        .then((message) => {
          throw new Error(message);
        });
      }
      return result;
    })
    .catch((e) => {
      if (this._transport.latestStatus === 404) {
        return this.getReleasesList()
        .then((list) => this._getReleasesListErrorMessage(tag, list))
        .then((message) => {
          throw new Error(message);
        });
      } else {
        throw e;
      }
    });
  }
  /**
   * Creates an error message about missing tag with the list if existing tags.
   *
   * @param {String} tag Originally requested tag.
   * @param {array} releases List of releases to the repository.
   * @return {String} Message to throw in error.
   */
  _getReleasesListErrorMessage(tag, releases) {
    var message = 'Tag for release ' + tag + ' do not exists in API Console repository. ';
    message += 'Please, check if you are requesting valid tag in our GitHub repository. ';
    message += 'Available tags are: ';
    //jscs:disable
    var tags = releases.map((item) => item.tag_name);
    //jscs:enable
    tags = tags.filter((name) => {
      try {
        this._assertTag(name);
        return true;
      } catch (e) {
        return false;
      }
    });
    message += tags.join(', ');
    return message;
  }
  /**
   * Asserts if the tag is in valid range to handle the operation.
   * It expects tags values in format `vX.Y.Z` or `X.Y.Z`. Both formats were used when releasing
   * the API Console.
   *
   * @param {String} tag Tag version to check.
   * @return {[type]}
   */
  _assertTag(tag) {
    tag = tag.replace('v', '0');
    var parts = tag.split('.');
    var major = Number(parts[0]);
    if (major !== major) {
      throw new Error('Invalid tag. Major version is not a number: ' + tag);
    }
    if (major < 4) {
      throw new Error('This tools will not work with API Console release prior version 4.0.0');
    }
  }
}
exports.GithubResolver = GithubResolver;
