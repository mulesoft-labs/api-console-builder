<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, minimum-scale=1, initial-scale=1, user-scalable=yes">
    <title>My Website</title>
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
  // Copy this to your website to initialize the API console with data.
  function init() {
    document.querySelector('api-console').raml = [[API-DATA]];
  }
  window.addEventListener('WebComponentsReady', function() {
    // Components are already loaded and attached at this point.
    document.querySelector('api-console').path = 'summary';
  });
  init();
  </script>
</body>
</html>
