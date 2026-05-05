const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix: Zustand's ESM build uses import.meta.env which causes
// "Cannot use 'import.meta' outside a module" on web because
// Metro bundles as regular scripts, not ES modules.
// Force zustand to resolve to its CJS build which avoids import.meta.
const originalResolveRequest = config.resolver?.resolveRequest;

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (platform === 'web') {
      // Zustand ESM uses import.meta.env — redirect to CJS
      if (moduleName === 'zustand' || moduleName === 'zustand/middleware') {
        const cjsMap = {
          'zustand': path.resolve(__dirname, 'node_modules/zustand/index.js'),
          'zustand/middleware': path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
        };
        if (cjsMap[moduleName]) {
          return { type: 'sourceFile', filePath: cjsMap[moduleName] };
        }
      }
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
