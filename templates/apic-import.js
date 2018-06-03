/**
 * This file is to be included into the Exchange or other application
 * main page that serves the console so it can detect which build
 * to use.
 * ES6 enabled browsers will use es6 build and ES5 otherwise.
 */
(function() {
  'use strict';
  if (!window.apic) {
    window.apic = {};
  }
  if (!window.apic.basePath) {
    window.apic.basePath = '';
  }
  /**
   * Detects ES6 support by testing arrow functions.
   * It has to be executed in eval or otherwise the script would
   * throw syntax error and won't be executed at all.
   *
   * @return {Boolean} True if the browser is a moderm browser.
   */
  function detectEs6() {
    if (typeof Symbol === 'undefined') {
      return false;
    }
    try {
      eval('const foo = (x)=>x+1;');
      eval('class Foo {}');
    } catch (e) {
      return false;
    }
    return true;
  }
  var isEs6 = detectEs6();
  var moduleRoot = window.apic.basePath;
  if (isEs6) {
    moduleRoot += 'es6-bundle';
  } else {
    moduleRoot += 'es5-bundle';
  }
  // First import loader that imports polyufills if nescesary
  var script = document.createElement('script');
  var src = moduleRoot + '/bower_components/webcomponentsjs/webcomponents-loader.js';
  script.src = src;
  document.head.appendChild(script);
  var importFile = moduleRoot + '/api-console.html';
  var link = document.createElement('link');
  link.setAttribute('rel', 'import');
  link.setAttribute('href', importFile);
  if (document.readyState === 'loading') {
    document.write(link.outerHTML);
  } else {
    document.head.appendChild(link);
  }
  var imports = [
    '/api-console-styles.html'
  ];
  for (var i = 0, len = imports.length; i < len; i++) {
    var polyfillSrc = moduleRoot + imports[i];
    var pscript = document.createElement('link');
    pscript.setAttribute('rel', 'import');
    pscript.setAttribute('href', polyfillSrc);
    if (document.readyState === 'loading') {
      document.write(pscript.outerHTML);
    } else {
      document.head.appendChild(pscript);
    }
  }
})();
