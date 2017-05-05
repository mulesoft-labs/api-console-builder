<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, minimum-scale=1, initial-scale=1, user-scalable=yes">
    <title>My Website</title>
    <script>
      // This script must be in your website's head section.
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

  <script>
  // This script is an example of how to get generated "api.json" file and sent data
  // to the api-console element
  function fetchApiData() {
    return fetch('./api.json')
    .then(function(response) {
      if (response.ok) {
        return response.json();
      }
    });
  }

  function notifyInitError(message) {
    window.alert('Cannot initialize API console. ' + message);
  }

  function init() {
    fetchApiData()
    .then(function(json) {
      if (json) {
        var apiConsole = document.querySelector('api-console');
        apiConsole.raml = json;
      } else {
        notifyInitError('Data not available.');
      }
    })
    .catch(function(cause) {
      notifyInitError(cause.message);
    });
  }
  init();
  </script>
</body>
</html>
