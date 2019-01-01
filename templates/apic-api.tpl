<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1, user-scalable=yes">
  <title>[[API-TITLE]]</title>
  <script src="apic-import.js"></script>
  <custom-style>
    <style>
    html,
    body {
      height: 100%;
      background-color: #fff;
      margin: 0;
      padding: 0;
      min-height: 100vh;
    }

    api-console {
      background-color: #fff;
    }
    </style>
  </custom-style>
</head>
<body unresolved>
  <app-location use-hash-as-path></app-location>
  <api-console></api-console>
  <script>
  /**
   * The following script will handle API console routing when using the
   * console as a standalone application.
   *
   * It uses native JavaScript APIs so it can be used outside Polymer scope.
   *
   * @author Pawel Psztyc <pawel.psztyc@mulesoft.com>
   */
  (function() {
    'use strict';
    // API Console namespace.
    var apic = {};
    // Namespace for standalone application.
    apic.app = {};
    /**
     * Initialize event listeners for console's path and page properties
     * and observers router data change.
     */
    apic.app.init = function() {
      apic.app.setInitialRouteData();
      apic.app.observeRouteEvents();
    };
    /**
     * Reads inital route data from the `app-location` component.
     * If the route has any data the it is stored as a apic.app.__initial*
     * propertues which are eventually restored after AMF model is set.
     *
     * Note that setting amfModel automatically resets navigation to
     * `/summary`
     */
    apic.app.setInitialRouteData = function() {
      // sets the initial path for routing from external source.
      // The API console sets default path to `summary` after AMF data change.
      var location = document.querySelector('app-location');
      var locationPath = location.path;
      if (!locationPath) {
        return;
      }
      if (locationPath[0] === '/') {
        locationPath = locationPath.substr(1);
      }
      var _route = locationPath.split('/');
      var page = _route[0];
      var type = _route[1];
      var selected = _route[2];
      if (page) {
        apic.app.__initialPage = page;
      }
      if (type) {
        apic.app.__initialType = type;
      }
      if (selected) {
        apic.app.__initialSelected = decodeURIComponent(selected);
      }
    };
    /**
     * A function to be called to load when model is ready and the app can
     * be initialized.
     *
     * TODO: This is not yet supported by builder.
     * When AMF web version is ready this will be supported.
     *
     * @param {Array} model AMF json/ld model
     */
    apic.app.loadModel = function(model) {
      var ac = document.querySelector('api-console');
      ac.amfModel = model;
      ac.resetLayout();
      if (apic.app.__initialType && apic.app.__initialSelected) {
        apic.app.selectionChanged(
          apic.app.__initialSelected,
          apic.app.__initialType,
          apic.app.__initialPage
        );
      } else {
        var hash = location.hash;
        var type, page, selected;
        if (hash && hash.length > 1) {
          hash = hash.substr(1);
          var parts = hash.split('/');
          if (parts[0]) {
            page = parts[0];
          }
          if (parts[1]) {
            type = parts[1];
          }
          if (parts[2]) {
            selected = decodeURIComponent(parts[2]);
          }
        }
        if (!page) {
          page = 'docs';
        }
        if (!type) {
          type = 'summary';
        }
        if (!selected) {
          selected = 'summary';
        }
        apic.app.selectionChanged(selected, type, page);
      }
      apic.app.__initialPage = undefined;
      apic.app.__initialSelected = undefined;
      apic.app.__initialType = undefined;
    };
    /**
     * Adds event listeres to elements that are related to the routing:
     * app-location, app-route and api-console.
     */
    apic.app.observeRouteEvents = function() {
      var ac = document.querySelector('api-console');
      var location = document.querySelector('app-location');
      ac.addEventListener('api-navigation-selection-changed', apic.app._selectionChanged);
      ac.addEventListener('page-changed', apic.app._pageChanged);
      location.addEventListener('route-changed', apic.app._routeChanged);
    };
    // Event handler for the selection change.
    apic.app._selectionChanged = function(e) {
      if (e.detail.passive === true) {
        return;
      }
      apic.app.selectionChanged(e.detail.selected, e.detail.type, e.target.page);
    };
    // Called when path changed from the api-console.
    apic.app.selectionChanged = function(selected, type, page) {
      if (!selected || !type) {
        return;
      }
      page = page || 'docs';
      var location = document.querySelector('app-location');
      if (!location || location.set) {
        var apic = document.querySelector('api-console');
        apic.page = page;
        apic.selectedShape = selected;
        apic.selectedShapeType = type;
        return;
      }
      var newPath = [page, type, selected].join('/');
      if (newPath !== location.path) {
        location.set('path', newPath);
      }
    };
    // Event handler for the page change.
    apic.app._pageChanged = function(e) {
      apic.app.selectionChanged(e.target.selectedShape, e.target.selectedShapeType, e.detail.value);
      apic.app.pageChanged(e.detail.value);
    };
    // Called when page change.
    apic.app.pageChanged = function(page) {
      var ac = document.querySelector('api-console');
      if (ac.page !== page) {
        ac.page = page;
      }
    };
    // Event handler for the route change.
    apic.app._routeChanged = function(e) {
      apic.app.routeChanged(e.detail.value);
    };
    // Updates api console path if different than curent URL
    apic.app.routeChanged = function(route) {
      var locationPath = route.path;
      if (!locationPath || locationPath === '/') {
        document.querySelector('app-location').set('path', '/docs');
        return;
      }
      if (locationPath[0] === '/') {
        locationPath = locationPath.substr(1);
      }
      var _route = locationPath.split('/');
      var page = _route[0];
      var type = _route[1];
      var selected = _route[2];
      if (selected) {
        selected = decodeURIComponent(selected);
      }
      var ac = document.querySelector('api-console');
      if (ac.page !== page) {
        ac.page = page;
      }
      if (ac.selectedShapeType !== type) {
        ac.selectedShapeType = type;
      }
      if (ac.selectedShape !== selected) {
        ac.selectedShape = selected;
      }
    };
    /**
     * Reads page name and the path from location path.
     *
     * @param {String} locationPath Current path read from path change event or
     * read fomr the `app-location` element.
     * @return {Object}
     */
    apic.app._readPagePath = function(locationPath) {
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
    apic.app.notifyInitError = function(message) {
      window.alert('Cannot initialize API console. ' + message);
    };
    if (window.WebComponents && window.WebComponents.ready) {
      apic.app.init();
    } else {
      window.addEventListener('WebComponentsReady', apic.app.init);
    }
  })();
  </script>
</body>
</html>
