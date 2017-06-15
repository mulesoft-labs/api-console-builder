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
  <api-console></api-console>
  <script>
    // The API console can now accept the `raml` property.
    // Assign this property somehow.
  </script>
</body>

</html>
