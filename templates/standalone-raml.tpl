<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, minimum-scale=1, initial-scale=1, user-scalable=yes">
  <title>[[API-TITLE]]</title>
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
  <link rel="import" href="bower_components/raml-js-parser/raml-js-parser.html">
  <link rel="import" href="bower_components/raml-json-enhance/raml-json-enhance.html">
  <link rel="import" href="bower_components/fetch-polyfill/fetch-polyfill.html">
  <link rel="import" href="bower_components/promise-polyfill/promise-polyfill.html">
  <link rel="import" href="bower_components/app-route/app-location.html">
</head>
<body>
  <app-location use-hash-as-path></app-location>
  <raml-js-parser json></raml-js-parser>
  <raml-json-enhance></raml-json-enhance>

  <api-console page="{{page}}" path="{{path}}"></api-console>
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
      apiconsole.app.setInitialRouteData();
      apiconsole.app.addParserListeners();
      apiconsole.app.observeRouteEvents();
      document.querySelector('raml-js-parser').loadApi('[[API-FILE-URL]]')
      .catch(function(cause) {
        apiconsole.app.notifyInitError(cause.message);
      });
    };

    apiconsole.app.setInitialRouteData = function() {
      // sets the initial path for routing from external source.
      // The API console sets default path to `summary` after RAML change.
      var location = document.querySelector('app-location');
      var locationPath = location.path;
      if (!locationPath) {
        return;
      }
      var parsedPath = locationPath.replace(/\-/g, '.');
      if (parsedPath[0] === '/') {
        parsedPath = parsedPath.substr(1);
      }
      var _route = parsedPath.split('/');
      var page = _route[0];
      var path = _route[1];

      apiconsole.app.__initialPage = page;
      apiconsole.app.__initialPath = path;
    };
    /**
     * Adds event listeres to elements that are related to RAML dataq parsing.
     */
    apiconsole.app.addParserListeners = function() {
      window.addEventListener('raml-json-enhance-ready', function(e) {
        var apiConsole = document.querySelector('api-console');
        apiConsole.raml = e.detail.json;
        if (apiconsole.app.__initialPage && apiconsole.app.__initialPage !== apiConsole.page) {
          apiconsole.app.pageChanged(apiconsole.app.__initialPage);
          apiconsole.app.__initialPage = undefined;
        }
        if (apiconsole.app.__initialPath && apiconsole.app.__initialPath !== apiConsole.path) {
          apiconsole.app.pathChanged(apiconsole.app.__initialPath);
          apiconsole.app.__initialPath = undefined;
        } else {
          apiconsole.app.pathChanged('summary');
        }
      });
      window.addEventListener('api-parse-ready', function(e) {
        var enhacer = document.querySelector('raml-json-enhance');
        enhacer.json = e.detail.json.specification;
      });
      document.querySelector('raml-json-enhance')
      .addEventListener('error', function(e) {
        apiconsole.app.notifyInitError(e.detail.message);
      });
    };
    /**
     * Adds event listeres to elements that are related to the routing:
     * app-location, app-route and api-console.
     */
    apiconsole.app.observeRouteEvents = function() {
      var apiConsole = document.querySelector('api-console');
      var location = document.querySelector('app-location');

      apiConsole.addEventListener('path-changed', apiconsole.app._pathChanged);
      apiConsole.addEventListener('page-changed', apiconsole.app._pageChanged);
      location.addEventListener('route-changed', apiconsole.app._routeChanged);
    };
    // Event handler for the path change.
    apiconsole.app._pathChanged = function(e) {
      apiconsole.app.pathChanged(e.detail.value);
    };
    // Called when path changed from the api-console.
    apiconsole.app.pathChanged = function(path) {
      if (!path) {
        return;
      }
      var location = document.querySelector('app-location');
      var parsedPath = path.replace(/\./g, '-');
      var newPath = '/docs/' + parsedPath;
      if (newPath !== location.path) {
        location.set('path', newPath);
      }
    };
    // Event handler for the page change.
    apiconsole.app._pageChanged = function(e) {
      apiconsole.app.pageChanged(e.detail.value);
    };
    // Called when page change.
    apiconsole.app.pageChanged = function(page) {
      var apiConsole = document.querySelector('api-console');
      if (apiConsole.page !== page) {
        apiConsole.page = page;
      }
    };
    // Event handler for the route change.
    apiconsole.app._routeChanged = function(e) {
      apiconsole.app.routeChanged(e.detail.value);
    };
    // Updates api console path if different than curent URL
    apiconsole.app.routeChanged = function(route) {
      var locationPath = route.path;
      if (!locationPath || locationPath === '/') {
        document.querySelector('app-location').set('path', '/docs');
        return;
      }
      var parsedPath = locationPath.replace(/\-/g, '.');
      if (parsedPath[0] === '/') {
        parsedPath = parsedPath.substr(1);
      }
      var _route = parsedPath.split('/');
      var page = _route[0];
      var path = _route[1];
      var apiConsole = document.querySelector('api-console');
      if (apiConsole.page !== page) {
        apiConsole.page = page;
      }
      if (apiConsole.path !== path) {
        apiConsole.path = path;
      }
    };
    /**
     * Reads page name and the path from location path.
     *
     * @param {String} locationPath Current path read from path change event or read fomr the
     * `app-location` element.
     */
    apiconsole.app._readPagePath = function(locationPath) {
      var parsedPath = locationPath.replace(/\-/g, '.');
      if (parsedPath[0] === '/') {
        parsedPath = parsedPath.substr(1);
      }
      var _route = parsedPath.split('/');
      var page = _route[0];
      var path = _route[1];
      return {
        page: page,
        path: path
      };
    };

    // Notifys user when something went wrong...
    apiconsole.app.notifyInitError = function(message) {
      window.alert('Cannot initialize API console. ' + message);
    };
    window.addEventListener('WebComponentsReady', function() {
      // Components are already loaded and attached at this point.
      apiconsole.app.init();
    });
  })();
  </script>
</body>

</html>
