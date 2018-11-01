# api-console-builder

__This version of the module works with API console version 5 only.__
If you use API console version 4, please, install version __0.4.x__.
Documentation for builder options that works with API console version 4 can be found [here](docs/version-0.4.0.md).

```
$ npm i api-console-builder@0.4.8
```
---------------------------

[![Build Status](https://travis-ci.org/mulesoft-labs/api-console-builder.svg?branch=master)](https://travis-ci.org/mulesoft-labs/api-console-builder)

__api-console-builder__ allows you to generate production ready build of
Salesforce (former MuleSoft) API Console.

On a high level, you can build the API console as a standalone application
or as a web component. Web component version is based on version 1 of web components
standard (the one accepted by all browser vendors). Internally it uses
Polymer 2.0 library to sugar the spec.

## Standalone application

Most common use case. Allows you to build documentation portal for your API.
It supports navigation and if `api` option is provided - automatically loads
api data model.

## Embedded web component

If you are planning to embed the console as a part of you existing documentation
you can use it as a web component that behaves as a regular HTML tag.

You can find examples of the build and implementation below.

## Basic usage

### Building standalone application from latest version

```javascript
const builder = require('api-console-builder');

builder({
  destination: 'api-console-build', // Optional, default to "build"
  api: 'path/to/api.raml',
  apiType: 'RAML 1.0'
})
.then(() => console.log('Build complete <3'))
.catch((cause) => console.log('Build error <\\3', cause.message));
```

### Building web component from latest version

```javascript
const builder = require('api-console-builder');

builder({
  destination: 'api-console-build',
  api: 'path/to/api.raml',
  apiType: 'RAML 1.0',
  embedded: true
})
.then(() => console.log('Build complete <3'))
.catch((cause) => console.log('Build error <\\3', cause.message));
```

The script above builds API console (version 5) from latest published version
on GitHub. It also generates data model from RAML 1.0 api spec file.

### Building specific version

```javascript
const builder = require('api-console-builder');

builder({
  api: 'path/to/api.raml',
  apiType: 'RAML 1.0',
  tagName: '5.0.0-preview'
})
.then(() => console.log('Build complete <3'))
.catch((cause) => console.log('Build error <\\3', cause.message));
```

Only tags >= `5.0.0` are supported by this version.

### Building from local copy of API console

```javascript
const builder = require('api-console-builder');

builder({
  api: 'path/to/api.raml',
  apiType: 'RAML 1.0',
  local: 'path/to/api-console.zip' // can be unzipped folder!
})
.then(() => console.log('Build complete <3'))
.catch((cause) => console.log('Build error <\\3', cause.message));
```

## Supported API types

API console accepts AMF `json/ld` model as a data source. AMF by default supports
following API specs:
-   RAML 0.8
-   RAML 1.0
-   OAS 2.0
-   ~~OAS 3.0~~ Support is not yet available.

When specifying `api` option that points to your API spec file you must also
define `apiType` property to one of the values above.

## Configuration options

Please, refer to [builder-options.js](lib/builder-options.js) file for options
list and description.

## API console theme file

With current build process API console's theme file is an optional dependency.
By default it is console's default styles. By setting `themeFile` option
the default theme file is __replaced__ by defined file. Refer to API console
documentation for theming details.

## Build bundles

Build process creates two bundles in the `destination` location:
-   `es5-bundle` - for browsers that support web components natively
-   `es6-bundle` - for browsers that does not support web components

You can perform feasture detection to determine which build to include into
your web page. Note, that standalone application build does it for you.

Below is a script used in MuleSoft products to include the console.

```javascript
(function() {
  'use strict';
  if (!window.apic) {
    window.apic = {};
  }
  if (!window.apic) {
    window.apic.basePath = ''; // This is where bundles are published
  }
  /**
   * Detects ES6 support by testing arrow functions.
   * It has to be executed in eval or otherwise the script would
   * throw syntax error and won't be executed at all.
   *
   * @return {Boolean} True if the browser is a moderm browser.
   */
  function detectEs6() {
    if (typeof Symbol === 'undefined') {
      return false;
    }
    try {
      eval('const foo = (x)=>x+1;');
      eval('class Foo {}');
    } catch (e) {
      return false;
    }
    return true;
  }
  var isEs6 = detectEs6();
  var moduleRoot = window.apic.basePath;
  if (isEs6) {
    moduleRoot += 'es6-bundle';
  } else {
    moduleRoot += 'es5-bundle';
  }

  var script = document.createElement('script');
  // This script loads web components loader library. It is very tiny library
  // that loads polyfills based on feature detection. All moderm browsers support
  // web components spec so in most cases this will do nothing.
  var src = moduleRoot + '/bower_components/webcomponentsjs/webcomponents-loader.js';
  document.head.appendChild(script);
  var importFile = moduleRoot + '/api-console.html';
  var link = document.createElement('link');
  link.setAttribute('rel', 'import');
  link.setAttribute('href', importFile);
  document.head.appendChild(link);

  var polyfills = [];
  if (typeof Array.prototype.find === 'undefined') {
    polyfills.push('arc-polyfills/arc-polyfills.html');
  }
  if (typeof CryptoJS === 'undefined') {
    polyfills.push('cryptojs-lib/cryptojs-lib.html');
  }
  if (polyfills.length) {
    for (var i = 0, len = polyfills.length; i < len; i++) {
      var polyfillSrc = moduleRoot + '/bower_components/' + polyfills[i];
      var pscript = document.createElement('link');
      pscript.setAttribute('rel', 'import');
      pscript.setAttribute('href', polyfillSrc);
      if (document.readyState === 'loading') {
        document.write(pscript.outerHTML);
      } else {
        document.head.appendChild(pscript);
      }
    }
  }
  if (typeof window.URL === 'undefined') {
    var urlScript = document.createElement('script');
    urlScript.src = moduleRoot + '/bower_components/url-polyfill/url.js';
    if (document.readyState === 'loading') {
      document.write(newScript.urlScript);
    } else {
      document.head.appendChild(urlScript);
    }
  }
})();
```
