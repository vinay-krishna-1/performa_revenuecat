module.exports = ({ config }) => {
  const apiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    config.android?.config?.googleMaps?.apiKey ||
    'AIzaSyAvoSTbnjM-YzyNBSOJpkv9_RGRsKQWW9Q';

  const plugins = config.plugins || [];
  const hasMapsPlugin = plugins.some(
    (p) => (Array.isArray(p) ? p[0] : p) === 'react-native-maps'
  );

  const updatedPlugins = hasMapsPlugin
    ? plugins
    : [
        ...plugins,
        [
          'react-native-maps',
          {
            androidGoogleMapsApiKey: apiKey,
          },
        ],
      ];

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey,
        },
      },
    },
    plugins: updatedPlugins,
  };
};
