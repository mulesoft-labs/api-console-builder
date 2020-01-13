# api-console-builder

__This version of the builder only works with API console version 6 and higher.__

[![Build Status](https://travis-ci.org/mulesoft-labs/api-console-builder.svg?branch=master)](https://travis-ci.org/mulesoft-labs/api-console-builder)

__api-console-builder__ allows to generate production ready bundle of MuleSoft [API Console](https://api-console.io).

On a high level, it allows to bundle a stand-alone application of API Console. If you need to embed API Console in your application follow instructions from [Rollup configuration for API Console](https://docs.api-console.io/building/rollup/).

## Usage

The bundler creates a production ready API Console that works in modern web browsers and in IE11 withj polyfilled support for web components.

```javascript
import { ApiConsoleProject } from '@api-components/api-console-builder';
const project = new ApiConsoleProject({
  destination: 'api-console-build',
  api: 'path/to/api.raml',
  apiType: 'RAML 1.0',
  apiMediaType: 'application/raml',
  tagName: '6.0.0'
});
await project.bundle();
```

## Supported API types

API console accepts AMF `json/ld` model as a data source. AMF by default supports the following API formats:

-   RAML 0.8
-   RAML 1.0
-   OAS 2.0
-   OAS 3.0 - Experimental, may be missing some properties.

## Configuration

The configuration is defined in [BuilderOptions.js](lib/BuilderOptions.js) file.

### tagName

Type: `string`

A release tag name to use. With this option the builder uses specific release of the console. If not set and `src` is not set it uses latest release. Note, only versions >= 6.0.0 can be used with this version of the builder.

### destination

Type: `string`

Output directory. Default to `build`.

### api

Type: `string`

__required__

Unlike previous versions of this library, now `api` property is required. The build will fail if this is not set.

Location of API specification main file.

Set `apiType` property to corresponding value (type of the API, see below).

Default to `undefined`.

### apiType

Type: `string`

_required__

Type of an API spec file recognizable by [AMF](https://github.com/mulesoft/amf).

### apiMediaType

Type: `string`

Media type of the API.

For RAML files it is always `application/yaml`. OAS comes with two flavours: `application/yaml` and `application/json`.

Use it when the library can't process API spec file due to processing error.

### verbose

Type: `boolean`

Prints a debug messages.

### attributes

Type: `array`

An array of attributes to be set on the `<api-console>` element.

For boolean attributes just add name of the attribute as string.

For attributes with values add a map where the key is the attribute name
and value is the attribute value.

Note: Do not use camel case notation. It will not work. See the example.

#### Example

```javascript
const attributes = [
 'proxyencodeurl',
 {'proxy': 'https://proxy.domain.com'},
 'notryit',
 {'page': 'request'},
]
```

Example above is the same as:

```javascript
const attributes = [
 'proxyencodeurl',
 'notryit',
 {
   'proxy': 'https://proxy.domain.com',
   'page': 'request'
 }
]
```

and will produce the following output:

```html
<api-console-app
 proxyencodeurl
 notryit
 page="request"
 proxy="https://proxy.domain.com"
></api-console-app>
```

List of all available options can be found here: https://github.com/mulesoft/api-console/blob/master/docs/configuring-api-console.md

Note, you don't need to set this property when providing own `indexFile`. Simply define attributes in the file.


### logger

Type: `object`

A console like object to print debug output. If not set then it creates it's own logger.

### themeFile

Type: `string`

Location to a theme file with styles definition of the console.
It replaces Console's own styles definition. See theming documentation of the API console for more information.

### indexFile

Type: `string`

Location to a custom `index.html` file that will be used instead of the default template.

The template file must include vendor package, API Console sources, and the use of API Console. See `templates/index.html` for an example.

### noCache

Type: `boolean`

By default the builder caches build results in user home folder and uses generated sources to speed up the build process.

Note, options that influence the build process (`tagName`, `themeFile`, `indexFile`, etc) creates new cached file.

API model is never cached.

### exitOnError

Type: `boolean`

Decides whether to finish current process with non-zero exit code on error. Default is `true`.

### strict

Type: `boolean`

When set to `true` it will stop build process with error when a minor issue has been detected, like missing theme file in declared location which is normally ignored.

### appTitle

Type: `string`

Optional application title put into HTML's `<title>` tag. By default it uses API title or `API Console` if missing.
