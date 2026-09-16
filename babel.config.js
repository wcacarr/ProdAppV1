module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 ships its babel plugin here, and it has to come last.
    plugins: ['react-native-worklets/plugin'],
  };
};
