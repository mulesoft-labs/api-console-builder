const amf = require('../node_modules/amf-client-js/amf.js');

/* global self */
if (typeof window === 'undefined') {
  // Web worker environment.
  self.amf = amf;
} else {
  window.amf = amf;
}
