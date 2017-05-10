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
    var onload = function() {
        window.HTMLImports || document.dispatchEvent(new CustomEvent('WebComponentsReady', {
          bubbles: true
        }));
      },
      webComponentsSupported = "registerElement" in document && "import" in document.createElement("link") && "content" in document.createElement("template");
    if (webComponentsSupported) onload();
    else {
      var script = document.createElement("script");
      script.async = !0;
      script.src = "bower_components/webcomponentsjs/webcomponents-lite.min.js";
      script.onload = onload;
      document.head.appendChild(script)
    };
  })();
  </script>
  <!-- This is bundled build of the API Console sources -->
  <link rel="import" href="import.html">
</head>

<body>
  <api-console></api-console>
  <script>
    // The API console can now accept the `raml` property.
    // Assign this property somehow.
  </script>
</body>

</html>
