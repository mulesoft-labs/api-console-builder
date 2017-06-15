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
    <!-- The element support "json-file" attribute that will be downloaded after initialization -->
    <api-console json-file="api.json"></api-console>
  </div>
</body>
</html>
