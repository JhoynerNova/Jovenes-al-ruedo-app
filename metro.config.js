const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable package exports to prevent importing Node-only modules like 'stream' and 'ws'
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
