# api-console-builder

The node module to build an API console from a static web page that is using
[api-console element](https://github.com/mulesoft/api-console/tree/release/4.0.0).

This module will bundle most of the required elements (web components and libraries) into the main file where the `<link rel="import">` is defined.

### Example source file

As defined in the [api-console element](https://github.com/mulesoft/api-console/tree/release/4.0.0) readme file.

```html
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
    <link rel="import" href="bower_components/raml-js-parser/raml-js-parser.html">
    <link rel="import" href="bower_components/raml-json-enhance/raml-json-enhance.html">
    <link rel="import" href="bower_components/anypoint-styles/typography.html">
    <link rel="import" href="bower_components/iron-flex-layout/iron-flex-layout-classes.html">
    <style is="custom-style" include="iron-flex iron-flex-alignment"></style>
</head>
<body>
  <api-console></api-console>
</body>
</html>

```

This exampel omit a way of passing data to the `api-console`. This has been described in the [Passing the raml data](https://github.com/mulesoft/api-console/tree/release/4.0.0#passing-the-raml-data) section.

The script will replace
```html
<link rel="import" href="bower_components/api-console/api-console.html">
<link rel="import" href="bower_components/raml-js-parser/raml-js-parser.html">
<link rel="import" href="bower_components/raml-json-enhance/raml-json-enhance.html">
<link rel="import" href="bower_components/anypoint-styles/typography.html">
<link rel="import" href="bower_components/iron-flex-layout/iron-flex-layout-classes.html">
```
with actual content of this files also resolving their dependencies and inserting it into the main file.

Because the API console is build out of the elements that require resources from the `bower_components` folder (like not directly linked javascript files like libraries or web workers) this module will generate a `bower_components` folder with required files that may be required by the application. Scripts from this folder will be loaded on demand.

## Usage

Install module

```
npm install --save-dev api-console-builder
```

use it in your build pipeline

```javascript
const builder = require('api-console-builder');

builder({
  src: './',
  dest: 'build',
  mainFile: 'index.html'
})
.then(() => console.log('Build complete'))
.catch((cause) => console.log('Build error', cause.message));
```

Values for object passed to the `builder` function are the default values.

**src** - Source directory of the application. Its a place when the application files are stored in the filesystem.

**dest** - Output directory.

**mainFile** - Entry point to the application. Usually is the `index.html` file.

## Alpha version notice
This is pre-relase version of the `api-console-builder` and this module **will** change in the future.

File an issue report for issues, feature requests and improvements.
