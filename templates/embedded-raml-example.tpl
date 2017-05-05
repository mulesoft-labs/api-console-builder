<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, minimum-scale=1, initial-scale=1, user-scalable=yes">
    <title>My Website</title>
    <script>
      // This script must be in your website head section.
      window.Polymer = {
        dom: 'shadow'
      };
      (function() {
        'use strict';
        var onload=function(){window.HTMLImports||document.dispatchEvent(new CustomEvent("WebComponentsReady",{bubbles:!0}))},webComponentsSupported="registerElement"in document&&"import"in document.createElement("link")&&"content"in document.createElement("template");if(webComponentsSupported)onload();else{var script=document.createElement("script");script.async=!0;script.src="bower_components/webcomponentsjs/webcomponents-lite.min.js";script.onload=onload;document.head.appendChild(script)};
      })();
    </script>
    <!-- This is bundled build of the API Console sources -->
    <link rel="import" href="import.html">
  </head>
<body>
  <!-- You can use your own markup -->
  <h1>My api console</h1>
  <h2>[[API-TITLE]]</h2>

  <!-- The API console should be placed in a relatively positioned parent with explicitly set height -->
  <div style="position:relative; height:500px; max-width: 1200px;">
    <api-console></api-console>
  </div>

  <raml-js-parser json></raml-js-parser>
  <raml-json-enhance></raml-json-enhance>
  <script>
  // This script is an example of how to load RAML file to the parser, enhance JSON and
  // set data to the console.
  function notifyInitError(message) {
    window.alert('Cannot initialize API console. ' + message);
  }

  function init() {
    var parser = document.querySelector('raml-js-parser');
    parser.addEventListener('api-parse-ready', function(e) {
      var enhacer = document.querySelector('raml-json-enhance');
      enhacer.json = e.detail.json.specification;
    });
    document.querySelector('raml-json-enhance')
    .addEventListener('error', function(e) {
      notifyInitError(e.detail.message);
    });
    window.addEventListener('raml-json-enhance-ready', function(e) {
      var apiConsole = document.querySelector('api-console');
      apiConsole.raml = e.detail.json;
    });
    parser.loadApi('[[API-FILE-URL]]')
    .catch(function(cause) {
      notifyInitError(cause.message);
    });
  }
  init();
  </script>
</body>
</html>
