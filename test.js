const npm = require('npm');

npm.load({
  loaded: false
}, function(err) {
  console.log(err);
  // // catch errors
  npm.commands.install(['mulesoft/api-console#6.0.0-preview.1'], function(er, data) {
    // log the error or data
    console.log(er, data);
    debugger
  });
  npm.on('log', function(message) {
    // log the progress of the installation
    console.log(message);
  });
});
