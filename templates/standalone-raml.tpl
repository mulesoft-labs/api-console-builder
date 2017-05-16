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
      (function() {
        'use strict';
        var onload = function() {
          if (!window.HTMLImports) {
            document.dispatchEvent(
              new CustomEvent('WebComponentsReady', {bubbles: true})
            );
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
          script.src = '/bower_components/webcomponentsjs/webcomponents-lite.min.js';
          script.onload = onload;
          document.head.appendChild(script);
        } else {
          onload();
        }
      })();
    </script>
    <link rel="import" href="api-console.html">
    <link rel="import" href="bower_components/raml-js-parser/raml-js-parser.html">
    <link rel="import" href="bower_components/raml-json-enhance/raml-json-enhance.html">
    <link rel="import" href="bower_components/fetch-polyfill/fetch-polyfill.html">
    <link rel="import" href="bower_components/promise-polyfill/promise-polyfill.html">
    <link rel="import" href="bower_components/app-route/app-location.html">
    <link rel="import" href="bower_components/app-route/app-route.html">
  </head>
<body>
  <app-location route="{{route}}" use-hash-as-path></app-location>
  <app-route id="route" route="{{route}}" pattern="/:page" data="{{routeData}}" tail="{{subroute}}"></app-route>
  <app-route id="subroute" route="{{subroute}}" pattern="/:path" data="{{subrouteData}}"></app-route>

  <api-console page="{{page}}" path="{{path}}"></api-console>
  <raml-js-parser json></raml-js-parser>
  <raml-json-enhance></raml-json-enhance>
  <script>
  var ApiConsole = {
    init: function() {
      this.addListeners();
      document.querySelector('raml-js-parser').loadApi('[[API-FILE-URL]]')
      .catch(function(cause) {
        ApiConsole.notifyInitError(cause.message);
      });
    },

    addListeners: function() {
      window.addEventListener('raml-json-enhance-ready', function(e) {
        var apiConsole = document.querySelector('api-console');
        apiConsole.raml = e.detail.json;
      });
      window.addEventListener('api-parse-ready', function(e) {
        var enhacer = document.querySelector('raml-json-enhance');
        enhacer.json = e.detail.json.specification;
      });
      document.querySelector('raml-json-enhance')
      .addEventListener('error', function(e) {
        ApiConsole.notifyInitError(e.detail.message);
      });
    },

    observeRouteEvents: function() {
      var apiConsole = document.querySelector('api-console');
      var location = document.querySelector('app-location');
      var route = document.getElementById('route');
      var subroute = document.getElementById('subroute');

      apiConsole.addEventListener('path-changed', ApiConsole._pathChanged);
      apiConsole.addEventListener('page-changed', ApiConsole._pageChanged);
      location.addEventListener('route-changed', ApiConsole._routeChanged);
      route.addEventListener('route-changed', ApiConsole._routeChanged);
      route.addEventListener('data-changed', ApiConsole._routeDataChanged);
      route.addEventListener('tail-changed', ApiConsole._subrouteChanged);
      subroute.addEventListener('route-changed', ApiConsole._subrouteChanged);
      subroute.addEventListener('data-changed', ApiConsole._subrouteDataChanged);
    },

    pathChanged: function(e) {

    },

    notifyInitError: function(message) {
      window.alert('Cannot initialize API console. ' + message);
    }
  };
  // Components are already loaded and attached at this point.
  ApiConsole.init();
  </script>
</body>
</html>
