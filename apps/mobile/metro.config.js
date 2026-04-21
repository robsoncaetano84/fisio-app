const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /[\\/]android[\\/]app[\\/]\\.cxx[\\/].*/,
  /[\\/]android[\\/]app[\\/]build[\\/].*/,
];

module.exports = config;
