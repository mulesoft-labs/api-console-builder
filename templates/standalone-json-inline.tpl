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
          script.src = 'bower_components/webcomponentsjs/webcomponents-lite.min.js';
          script.onload = onload;
          document.head.appendChild(script);
        } else {
          onload();
        }
      })();
    </script>
    <link rel="import" href="api-console.html">
    <link rel="import" href="bower_components/fetch-polyfill/fetch-polyfill.html">
    <link rel="import" href="bower_components/promise-polyfill/promise-polyfill.html">
    <link rel="import" href="bower_components/app-route/app-location.html">
  </head>
<body>
  <app-location use-hash-as-path></app-location>
  <api-console></api-console>
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
      apiconsole.app.observeRouteEvents();
      var apiConsole = document.querySelector('api-console');
      apiConsole.raml = [[API-DATA]];
      if (apiconsole.app.__initialPage && apiconsole.app.__initialPage !== apiConsole.page) {
        apiconsole.app.pageChanged(apiconsole.app.__initialPage);
        apiconsole.app.__initialPage = undefined;
      }
      if (apiconsole.app.__initialPath && apiconsole.app.__initialPath !== apiConsole.path) {
        apiconsole.app.pathChanged(apiconsole.app.__initialPath);
        apiconsole.app.__initialPath = undefined;
      }
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
    // Components are already loaded and attached at this point.
    apiconsole.app.init();
  })();
  </script>
</body>
</html>
