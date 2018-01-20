/**
 * Plugin.js file, set configs, routes, hooks and events here
 */

const path = require('path');

module.exports = function loadPlugin(projectPath, Plugin) {
  const plugin = new Plugin(__dirname);

  plugin.fastLoader = function fastLoader(we, done) {
    done();
  };

  plugin.events.on('we:after:load:express', (we)=> {
    const adminFiles = path.join( __dirname, 'prod');
    we.express.use('/admin', we.utils.express.static(adminFiles));
  });

  return plugin;
};