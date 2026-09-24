const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block nested node_modules without breaking metro-runtime
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/.*/
];

config.watcher = {
  healthCheck: { enabled: false },
  watchman: false,
};

module.exports = config;
