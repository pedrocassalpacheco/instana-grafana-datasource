import prunk from 'prunk';
import chai from 'chai';

// Mock Grafana modules that are not available outside of the core project
// Required for loading module.js
prunk.mock('app/plugins/sdk', {
  QueryCtrl: null,
  loadPluginCss: () => {}
});

// Setup Chai
chai.should();
global.assert = chai.assert;
global.expect = chai.expect;
