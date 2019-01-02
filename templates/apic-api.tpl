<!DOCTYPE html><html><head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1, user-scalable=yes">
  <title>[[API-TITLE]]</title>
  <script src="amf.js"></script>
  <script src="apic-import.js"></script>
  <style>body,html{height:100%;margin:0;padding:0;min-height:100vh}.loader-container{position:absolute;top:0;left:0;right:0;bottom:0;background-color:rgba(255,255,255,.54);display:-ms-flexbox;display:-webkit-flex;display:flex;-ms-flex-align:center;-webkit-align-items:center;align-items:center;-ms-flex-pack:center;-webkit-justify-content:center;justify-content:center;-ms-flex-direction:column;-webkit-flex-direction:column;flex-direction:column;z-index:1}.loader-container p{color:#777}.loader{font-size:10px;margin:30px auto;text-indent:-9999em;width:9em;height:9em;border-radius:50%;background:#7288ff;background:-moz-linear-gradient(left,#7288ff 10%,rgba(114,136,255,0) 42%);background:-webkit-linear-gradient(left,#7288ff 10%,rgba(114,136,255,0) 42%);background:-o-linear-gradient(left,#7288ff 10%,rgba(114,136,255,0) 42%);background:-ms-linear-gradient(left,#7288ff 10%,rgba(114,136,255,0) 42%);background:linear-gradient(to right,#7288ff 10%,rgba(114,136,255,0) 42%);position:relative;-webkit-animation:load3 1.4s infinite linear;animation:load3 1.4s infinite linear;-webkit-transform:translateZ(0);-ms-transform:translateZ(0);transform:translateZ(0)}.loader:after,.loader:before{content:'';position:absolute;top:0;left:0}.loader:before{width:50%;height:50%;background:#7288ff;border-radius:100% 0 0}.loader:after{background:#fff;width:75%;height:75%;border-radius:50%;margin:auto;bottom:0;right:0}@-webkit-keyframes load3{0%{-webkit-transform:rotate(0);transform:rotate(0)}100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes load3{0%{-webkit-transform:rotate(0);transform:rotate(0)}100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}</style>
  </head>
  <div id="loader" class="loader-container">
    <p>Loading your API experience</p>
    <div class="loader">Loading...</div>
  </div>
  <app-location use-hash-as-path=""></app-location>
  <api-console app="" by-api-console-builder=""></api-console>
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
    /* global amf */
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
      amf.plugins.document.WebApi.register();
      amf.plugins.document.Vocabularies.register();
      amf.Core.init()
      .then(() => apic.app.loadApi('[[AMF-API-FILE]]', '[[AMF-API-TYPE]]', '[[AMF-API-CONTENT-TYPE]]'))
      .then((model) => {
        model = JSON.parse(model);
        apic.app.loadModel(model);
      })
      .catch((cause) => {
        apic.app.notifyInitError(cause.message);
        throw cause;
      });
    };
    /**
     * Removes loader when API console is ready.
     */
    apic.app.removeLoader = function() {
      const node = document.getElementById('loader');
      if (!node) {
        return;
      }
      node.parentNode.removeChild(node);
    };
    /**
     * Loads API file and runs AMF library.
     * @param {String} url Location of the file with AMF model
     * @param {String} type API type
     */
    apic.app.loadApi = function(url, from, contentType) {
      var type;
      var ct;
      switch (from) {
        case 'RAML 0.8':
        case 'RAML 1.0':
          ct = 'application/yaml';
          type = from;
          break;
        case 'OAS 2.0':
        case 'OAS 3.0':
          type = from;
          if (contentType) {
            ct = contentType;
          } else if (url.indexOf('.json')) {
            ct = 'application/json';
          } else {
            ct = 'application/yaml';
          }
          break;
        case 'AMF Graph':
          type = from;
          ct = 'application/ld+json';
          break;
        default: throw new Error('Unknown API format.');
      }
      const parser = amf.Core.parser(type, ct);
      url = apic.app.processApiUrl(url);
      return parser.parseFileAsync(url)
      .then((doc) => apic.app.generateModel(doc, from));
    };
    /**
     * AMF requires valid URL scheme to be added to the file location.
     * This checks if the url is absolute and if not then it creates absolute
     * url using current location.
     * @param {String} url API file location.
     * @return {String} Parsed URL
     */
    apic.app.processApiUrl = function(url) {
      if (url.indexOf('http') === 0) {
        return;
      }
      return new URL(url, location.href).toString();
    };
    /**
     * Generates JSON+LD data model from parsed API document.
     * This model is used by the console to render the view.
     * @param {Object} doc AMF instance, parsed API spec.
     * @param {String} from API spec format
     * @return {Promise<String>}
     */
    apic.app.generateModel = function(doc, from) {
      var resolver;
      switch (from) {
        case 'RAML 1.0':
        case 'RAML 0.8':
        case 'OAS 2.0':
        case 'OAS 3.0':
          resolver = amf.Core.resolver(from);
          break;
      }
      if (resolver) {
        doc = resolver.resolve(doc, 'editing');
      }
      var opts = amf.render.RenderOptions().withSourceMaps.withCompactUris;
      var generator = amf.Core.generator('AMF Graph', 'application/ld+json');
      return generator.generateString(doc, opts);
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
     * @param {Array} model AMF json/ld model
     */
    apic.app.loadModel = function(model) {
      var ac = document.querySelector('api-console');
      ac.amfModel = model;
      ac.resetLayout();
      apic.app.removeLoader();
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
      if (!location || !location.set) {
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
</body></html>
