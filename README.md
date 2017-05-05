# api-console-builder

The node module to build the API console from the 
[api-console element](https://github.com/mulesoft/api-console/tree/release/4.0.0).

This module will bundle required elements (web components and libraries) into the main file where 
the `<link rel="import">` is defined.

## Using the module

This module provides you with tools to: 
- build your own version of the API Console
- generate API documentation from the RAML file using latest version of the console
- tweak the build process to optymise loading time of the API console

### Basic usage

```javascript
const builder = require('api-console-builder');

builder({
  src: 'https://github.com/mulesoft/api-console/archive/release/4.0.0.zip',
  dest: 'build',
  raml: 'path/to/api.raml'
})
.then(() => console.log('Build complete'))
.catch((cause) => console.log('Build error', cause.message));
```

### Options

All available options are defined in the [ApiConsoleBuilderOptions](lib/api-console-source-control.js)
class. You can initialize options using simple map or options class, that is setting app defaults:

```javascript
const builder = require('api-console-builder');
const options = new builder.ApiConsoleBuilderOptions({
  dest: 'build',
  raml: 'path/to/api.raml'
});
options.src = 'https://github.com/mulesoft/api-console/archive/release/4.0.0.zip';
console.log(options.useJson); // prints false
builder(options);
```

| Option | Type | Description |
| --- | --- | --- |
| `src` | String | Source of the API console. If the `src` is an URL then it expects it to be a zip file that will be uncopressed to a working directory. If it points to a local destination and it is a zip file, set `sourceIsZip` option to true. Defaults to current directory ("./") to build plain API console. |
| `mainFile` | String | Source index file, an entry point to the application. Don't set when downloading the `api-console` source code from GitHub. Then it will use one of the build-in templates depending on options. Should point to a file that contains web components imports. |
| `sourceIsZip` | Boolean | Set to true if the API console source (`src`) points to a zip file that should be uncopressed. If the `src` is an URL then it will be set to `true`. Defaults to `false`. |
| `dest` | String | Output directory. Defaults to `./build`. |
| `useJson` | Boolean | If set, it will generate a JSON file out of the RAML file and will use pre-generated data in the console. Use this option to optymise console's load time. It will not include `raml-json-enhance` and `raml-js-parser` elements into the build and will use pre-generated JSON to load it into the console. Note that you will have to regenerate the API console each time your API spec changes. Defaults to `false`. |
| `inlineJson` | Boolean | Set to true to inline pre-generated JSON data in the main file instead of creating external JSON file. Only valid if `embedded` is not set to `true` and with `useJson` set to true. Embeded version of the API console always require external JSON file. Defaults to `false`. |
| `embedded` | Boolean | If true it will generate an import file for the web components that can be used in any web application. It will not generate a standalone application. Generated source file will contain an example of using the api-console on any web page. Defaults to `false`. |
| `raml` | String | The RAML file from which produce the documentation. If not set then it will generate a plain API console application without any documentation attached. Defaults to `undefined`. |
| `noTryit` | Boolean | Will set `no-tryit` attribute on the `<api-console>` element that will disable request / response panels. Defaults to `false`. |
| `narrowView` | Boolean | Will set the `narrow` attribute on the `<api-console>` element that will force the console to render the mobile like view. Defaults to `false` |
| `proxy` | String | Will set the `proxy` attribute on the `<api-console>` element. Sets the proxy URL for the HTTP requests sent from the console. If set then all URLs will be altered before sending the data to a transport library by prefixing the URL with this value. Defaults to `undefined` |
| `proxyEncodeUrl` | Boolean | Will set the `proxy-encode-url` attribute on the `<api-console>` element that will encode the URL value before appending it to the proxy prefix. Defaults to `false` |
| `appendHeaders` | String | Will set the `append-headers` attribute on the `<api-console>`  element. Forces the console to send specific list of headers, overriding user input if needed.  Defaults to `undefined`. |
| `jsCompilationLevel` | String | Level of JavaScript compilation used by [Google Closure Compiler](https://developers.google.com/closure/compiler/). Possible options are `WHITESPACE_ONLY` and `SIMPLE`. Don not use `ADVANCED` level. Option `SIMPLE` will make the build process longer than WHITESPACE_ONLY but it will produce less code. Defaults to `WHITESPACE_ONLY` |
| `noOptimisation` | Boolean | If set it will not perform any code optimisation. It will disable: comments removal, JS compilation, HTML minification, and CSS minification. It should be used only for development to reduce build time. Output will contain more data and therefore will be bigger. Defaults to `false`. |
| `noCssOptimisation` | Boolean | Disables CSS minification (CSS files and `<style>` declarations). Defaults to `false`. |
| `noHtmlOptimisation` | Boolean | Disables HTML minification. Also disables comments removal. Defaults to `false`. |
| `noJsOptimisation` | Boolean | Disables JavaScript compilation with Google Closure Compiler. Defaults to `false`. |

## Building embeddable console

The API console can be embedded in your website or blog post. To build the console out of the RAML spec, use the `embedded` option.

The output will containt two main files:
- import.html - bundled source code of the console
- example.html - working example of use

**To embed the console on your website**
1. You have to include polyfill in the website's `<head>` section.
2. You have to import the `import.html` file as regular web component
3. Place the `<api-console></api-console>` anywhere on your website
4. Initialize data depening on the build method. Examples of initialization you will find in the `example.html` file.

#### 1. Polyfill

Include the following polyfil in the `<head>` section
```html
<head>
  ...
  <script>
  (function() {
    'use strict';
    var onload=function(){window.HTMLImports||document.dispatchEvent(new CustomEvent("WebComponentsReady",{bubbles:!0}))},webComponentsSupported="registerElement"in document&&"import"in document.createElement("link")&&"content"in document.createElement("template");if(webComponentsSupported)onload();else{var script=document.createElement("script");script.async=!0;script.src="bower_components/webcomponentsjs/webcomponents-lite.min.js";script.onload=onload;document.head.appendChild(script)};
  })();
  </script>
</head>
```

#### 2. Import bundle

```html
<head>
  ...
  <script>
  ...
  </script>
  <link rel="import" href="import.html">
</head>
```

#### 3. Place the console

```html
<div style="position:relative; height:500px;">
  <api-console></api-console>
</div>
```

The API console should be placed in a relatively positioned parent element with explicitly set height. Otherwise it won't renders correctly.
By explicitly set height meaning either use of the height value in pixels or by using [flex layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout/Using_CSS_flexible_boxes).

#### 4. Initialize the data

This step depends on selected build method (with JSON or not, is JSON is inlined). See build example to see how to do it.

## Custom build

You can customize the API Console by creating your own html file that contains the `<api-console>` element.

### Example source file

As defined in the [api-console element](https://github.com/mulesoft/api-console/tree/release/4.0.0) readme file.

```html
<!-- index.html -->
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, minimum-scale=1, initial-scale=1, user-scalable=yes">
    <script>
        window.Polymer = {
          dom: 'shadow'
        };
        // Load webcomponentsjs polyfill if browser does not support native Web Components
        (function() {
          'use strict';
          var onload = function() {
            // For native Imports, manually fire WebComponentsReady so user code
            // can use the same code path for native and polyfill'd imports.
            if (!window.HTMLImports) {
              document.dispatchEvent(new CustomEvent('WebComponentsReady', {bubbles: true}));
            }
          };
          var webComponentsSupported = (
            'registerElement' in document &&
            'import' in document.createElement('link') &&
            'content' in document.createElement('template')
          );
          if (!webComponentsSupported) {
            var script = document.createElement('script');
            script.async = true;
            script.src = 'bower_components/webcomponentsjs/webcomponents-lite.min.js';
            script.onload = onload;
            document.head.appendChild(script);
          } else {
            document.addEventListener('DOMContentLoaded', function() {
              onload();
            });
          }
        })();
    </script>
    <link rel="import" href="bower_components/api-console/api-console.html">
    <link rel="import" href="bower_components/iron-flex-layout/iron-flex-layout-classes.html">
    <style is="custom-style" include="iron-flex iron-flex-alignment"></style>
</head>
<body>
  <api-console></api-console>
</body>
</html>
```

This example omits the way of passing data to the `api-console`. This has been described in the [Passing the raml data](https://github.com/mulesoft/api-console/tree/release/4.0.0#passing-the-raml-data) section.

```javascript
const builder = require('api-console-builder');

builder({
  src: './',
  dest: 'build',
  raml: 'https://domain.com/api.raml',
  useJson: true,
  mainFile: 'index.html'
})
.then(() => {
  console.log('Build complete');
  // run polymer serve build/ --open
})
.catch((cause) => console.log('Build error', cause.message));
```

The module will replace imports section:
```html
<link rel="import" href="bower_components/api-console/api-console.html">
<link rel="import" href="bower_components/iron-flex-layout/iron-flex-layout-classes.html">
```
with actual content of imported files and their dependencies.

Because the API console is build out of the elements that require resources from the `bower_components` folder (for example not directly linked javascript files like libraries or web workers) this module will generate a `bower_components` folder with files that may be required by the application. Scripts from this folder will be loaded on demand.

## Optimisation

Application based on the API Console loads a RAML file(s), parses it and generates JSON data that are recognizable by the console. This process can be slow and consumes lot of computing power. This can affect user experience, especially on mobile devices.

If the API spec doesn't change very often you can tell the builder to generate a JSON file out of the RAML spec and use it instead of parsing RAML content all over again. You have to set `useJson` option when initializing the builder. It will generate a `api.json` file that will be used by the API console.

If you are creating custom build then your application should handle JSON file load. See the [standalone-json.tpl](templates/standalone-json.tpl) file for example.

If you don't want the console to download the JSON file but rather use a JavaScript object embedded in the source file, then you can set `inlineJson` builder option. Note that this option currently is not working with custom builds.

## Alpha version notice
This is pre-relase version of the `api-console-builder` and this module **will** change in the future.

File an issue report for issues, feature requests and improvements.
