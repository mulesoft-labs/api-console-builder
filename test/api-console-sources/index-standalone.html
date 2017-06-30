<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, minimum-scale=1, initial-scale=1, user-scalable=yes">
    <title>API Console</title>
    <script src="bower_components/webcomponentsjs/webcomponents-lite.min.js"></script>
    <script>
      window.Polymer = {
        dom: 'shadow'
      };
      if (!window.HTMLImports) {
        document.dispatchEvent(
          new CustomEvent('WebComponentsReady', {bubbles: true})
        );
      }
    </script>
    <link rel="import" href="api-console.html">
    <link rel="import" href="bower_components/fetch-polyfill/fetch-polyfill.html">
    <link rel="import" href="bower_components/app-route/app-location.html">
    <link rel="import" href="bower_components/promise-polyfill/promise-polyfill.html">
    <style is="custom-style">
    .powered {
      @apply(--layout-horizontal);
      @apply(--layout-center-center);
      padding: 12px 0px;
      border-top: 1px rgba(0,0,0,0.24) solid;
      margin: 8px 12px 0 12px;
    }
    </style>
  </head>
<body>
  <app-location use-hash-as-path></app-location>
  <api-console>
    <div class="powered" nav-addon>
      <a href="https://github.com/mulesoft/api-console" target="_blank"><img src="data:image/png;base64,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" /></a>
    </div>
  </api-console>
  <script>
  /**
   * The following script will handle API console routing when using the console as a standalone
   * application.
   *
   * It uses native JavaScript APIs so it can be used outside Polymer scope.
   */
  (function() {
    'use strict';
    // API Console namespace.
    var apiconsole = {};
    // Namespace for standalone application.
    apiconsole.app = {};
    /**
     * Initialize event listeners for console's path and page properties and observers
     * router data change.
     */
    apiconsole.app.init = function() {
      // here is a good place to load the API data.
      // Note that this version do not contain raml parser and enhancer.
    };
    window.addEventListener('WebComponentsReady', function() {
      // Components are already loaded and attached at this point.
      apiconsole.app.init();
    });
  })();
  </script>
</body>
</html>
