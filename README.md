# api-console-builder

__This version of the builder only works with API console version 6 and up.__

[![Build Status](https://travis-ci.org/mulesoft-labs/api-console-builder.svg?branch=master)](https://travis-ci.org/mulesoft-labs/api-console-builder)

__api-console-builder__ allows to generate production ready bundle of MuleSoft API Console.

On a high level, it allows to bundle a stand-alone application of API Console. If you need to embed API Console in your application follow instructions from [Rollup configuration for API Console](https://docs.api-console.io/building/rollup/).

## Usage

The bundler creates a production ready API Console that works in modern web browsers as well in IE11.

```javascript
import { ApiConsoleProject } from '@api-components/api-console-builder';
const project = new ApiConsoleProject({
  destination: 'api-console-build', // Optional, default to "build"
  api: 'path/to/api.raml',
  apiType: 'RAML 1.0',
  apiMediaType: 'application/raml', // this is default value
  tagName: '6.0.0'
});
await project.bundle();
```

## Supported API types

API console accepts AMF `json/ld` model as a data source. AMF by default supports following API formats:

-   RAML 0.8
-   RAML 1.0
-   OAS 2.0
-   OAS 3.0 - Experimental, not fully supported.
