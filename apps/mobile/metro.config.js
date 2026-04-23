const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo so Metro picks up changes in packages/shared.
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];

// Let Metro find modules in the app's node_modules first, then fall back to
// the workspace root. Hierarchical lookup stays ENABLED because pnpm relies on
// nested node_modules (e.g. .pnpm/<pkg>/node_modules/<dep>).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force certain packages to resolve to a single copy from the app's
// node_modules. Without this, pnpm's peer-dep handling can install a stray
// copy of react under packages/shared/node_modules/react, which Metro then
// bundles alongside the app's react -> "Invalid hook call" at runtime.
// Packages that MUST be bundled as a single instance. Only list packages that
// are DIRECT dependencies of the mobile app (i.e. resolvable from
// apps/mobile/node_modules). Transitive deps are automatically single-copy
// once their parent is, because pnpm keeps them as siblings in the .pnpm store.
const FORCE_SINGLETON = [
  'react',
  'react-native',
  '@tanstack/react-query',
  'react-hook-form',
  '@hookform/resolvers',
  'zod',
];
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const forcedRoot = FORCE_SINGLETON.find(
    (name) => moduleName === name || moduleName.startsWith(`${name}/`),
  );
  if (forcedRoot) {
    try {
      return context.resolveRequest(
        {
          ...context,
          originModulePath: path.join(projectRoot, 'package.json'),
        },
        moduleName,
        platform,
      );
    } catch {
      // Fall through to the default resolver if the forced resolution fails
      // (e.g. a subpath that only exists inside a pnpm-nested location).
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
