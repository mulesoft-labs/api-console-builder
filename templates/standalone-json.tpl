<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, minimum-scale=1, initial-scale=1, user-scalable=yes">
    <title>[[API-TITLE]]</title>
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
    <script src="bower_components/webcomponentsjs/webcomponents-lite.min.js"></script>
    <link rel="import" href="api-console.html">
    <link rel="import" href="bower_components/fetch-polyfill/fetch-polyfill.html">
    <link rel="import" href="bower_components/promise-polyfill/promise-polyfill.html">
  </head>
<body>
  <api-console json-file="api.json"></api-console>
</body>
</html>
