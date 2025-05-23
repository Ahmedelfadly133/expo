import { ExpoConfig } from '@expo/config-types';
import path from 'path';
import resolveFrom from 'resolve-from';

import { ConfigPlugin, InfoPlist } from '../Plugin.types';
import { createInfoPlistPlugin, withAppDelegate, withPodfile } from '../plugins/ios-plugins';
import { mergeContents, MergeResults, removeContents } from '../utils/generateCode';

const debug = require('debug')('expo:config-plugins:ios:maps') as typeof console.log;

export const MATCH_INIT = /\bsuper\.application\(\w+?, didFinishLaunchingWithOptions: \w+?\)/g;

const withGoogleMapsKey = createInfoPlistPlugin(setGoogleMapsApiKey, 'withGoogleMapsKey');

export const withMaps: ConfigPlugin = (config) => {
  config = withGoogleMapsKey(config);

  const apiKey = getGoogleMapsApiKey(config);
  // Technically adds react-native-maps (Apple maps) and google maps.

  debug('Google Maps API Key:', apiKey);
  config = withMapsCocoaPods(config, { useGoogleMaps: !!apiKey });

  // Adds/Removes AppDelegate setup for Google Maps API on iOS
  config = withGoogleMapsAppDelegate(config, { apiKey });

  return config;
};

export function getGoogleMapsApiKey(config: Pick<ExpoConfig, 'ios'>) {
  return config.ios?.config?.googleMapsApiKey ?? null;
}

export function setGoogleMapsApiKey(
  config: Pick<ExpoConfig, 'ios'>,
  { GMSApiKey, ...infoPlist }: InfoPlist
): InfoPlist {
  const apiKey = getGoogleMapsApiKey(config);

  if (apiKey === null) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    GMSApiKey: apiKey,
  };
}

export function addGoogleMapsAppDelegateImport(src: string): MergeResults {
  const newSrc = ['#if canImport(GoogleMaps)', 'import GoogleMaps', '#endif'];

  return mergeContents({
    tag: 'react-native-maps-import',
    src,
    newSrc: newSrc.join('\n'),
    anchor: /@UIApplicationMain/,
    offset: 0,
    comment: '//',
  });
}

export function removeGoogleMapsAppDelegateImport(src: string): MergeResults {
  return removeContents({
    tag: 'react-native-maps-import',
    src,
  });
}

export function addGoogleMapsAppDelegateInit(src: string, apiKey: string): MergeResults {
  const newSrc = ['#if canImport(GoogleMaps)', `GMSServices.provideAPIKey("${apiKey}")`, '#endif'];

  return mergeContents({
    tag: 'react-native-maps-init',
    src,
    newSrc: newSrc.join('\n'),
    anchor: MATCH_INIT,
    offset: 0,
    comment: '//',
  });
}

export function removeGoogleMapsAppDelegateInit(src: string): MergeResults {
  return removeContents({
    tag: 'react-native-maps-init',
    src,
  });
}

/**
 * @param src The contents of the Podfile.
 * @returns Podfile with Google Maps added.
 */
export function addMapsCocoaPods(src: string): MergeResults {
  return mergeContents({
    tag: 'react-native-maps',
    src,
    newSrc: `  pod 'react-native-google-maps', path: File.dirname(\`node --print "require.resolve('react-native-maps/package.json')"\`)`,
    anchor: /use_native_modules/,
    offset: 0,
    comment: '#',
  });
}

export function removeMapsCocoaPods(src: string): MergeResults {
  return removeContents({
    tag: 'react-native-maps',
    src,
  });
}

function isReactNativeMapsInstalled(projectRoot: string): string | null {
  const resolved = resolveFrom.silent(projectRoot, 'react-native-maps/package.json');
  return resolved ? path.dirname(resolved) : null;
}

function isReactNativeMapsAutolinked(config: Pick<ExpoConfig, '_internal'>): boolean {
  // Only add the native code changes if we know that the package is going to be linked natively.
  // This is specifically for monorepo support where one app might have react-native-maps (adding it to the node_modules)
  // but another app will not have it installed in the package.json, causing it to not be linked natively.
  // This workaround only exists because react-native-maps doesn't have a config plugin vendored in the package.

  // TODO: `react-native-maps` doesn't use Expo autolinking so we cannot safely disable the module.
  return true;

  // return (
  //   !config._internal?.autolinkedModules ||
  //   config._internal.autolinkedModules.includes('react-native-maps')
  // );
}

const withMapsCocoaPods: ConfigPlugin<{ useGoogleMaps: boolean }> = (config, { useGoogleMaps }) => {
  return withPodfile(config, async (config) => {
    // Only add the block if react-native-maps is installed in the project (best effort).
    // Generally prebuild runs after a yarn install so this should always work as expected.
    const googleMapsPath = isReactNativeMapsInstalled(config.modRequest.projectRoot);
    const isLinked = isReactNativeMapsAutolinked(config);
    debug('Is Expo Autolinked:', isLinked);
    debug('react-native-maps path:', googleMapsPath);

    let results: MergeResults;

    if (isLinked && googleMapsPath && useGoogleMaps) {
      try {
        results = addMapsCocoaPods(config.modResults.contents);
      } catch (error: any) {
        if (error.code === 'ERR_NO_MATCH') {
          throw new Error(
            `Cannot add react-native-maps to the project's ios/Podfile because it's malformed. Report this with a copy of your project Podfile: https://github.com/expo/expo/issues`
          );
        }
        throw error;
      }
    } else {
      // If the package is no longer installed, then remove the block.
      results = removeMapsCocoaPods(config.modResults.contents);
    }

    if (results.didMerge || results.didClear) {
      config.modResults.contents = results.contents;
    }

    return config;
  });
};

const withGoogleMapsAppDelegate: ConfigPlugin<{ apiKey: string | null }> = (config, { apiKey }) => {
  return withAppDelegate(config, (config) => {
    if (
      !apiKey ||
      !isReactNativeMapsAutolinked(config) ||
      !isReactNativeMapsInstalled(config.modRequest.projectRoot)
    ) {
      config.modResults.contents = removeGoogleMapsAppDelegateImport(
        config.modResults.contents
      ).contents;
      config.modResults.contents = removeGoogleMapsAppDelegateInit(
        config.modResults.contents
      ).contents;
      return config;
    }

    if (config.modResults.language !== 'swift') {
      throw new Error(
        `Cannot setup Google Maps because the project AppDelegate is not a supported language: ${config.modResults.language}`
      );
    }

    try {
      config.modResults.contents = addGoogleMapsAppDelegateImport(
        config.modResults.contents
      ).contents;
      config.modResults.contents = addGoogleMapsAppDelegateInit(
        config.modResults.contents,
        apiKey
      ).contents;
    } catch (error: any) {
      if (error.code === 'ERR_NO_MATCH') {
        throw new Error(
          `Cannot add Google Maps to the project's AppDelegate because it's malformed. Report this with a copy of your project AppDelegate: https://github.com/expo/expo/issues`
        );
      }
      throw error;
    }
    return config;
  });
};
