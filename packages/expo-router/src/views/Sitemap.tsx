// Copyright © 2024 650 Industries.
'use client';

import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import React from 'react';
import { Image, StyleSheet, Text, View, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from './Pressable';
import { router } from '../imperative-api';
import { useSitemap, SitemapType } from './useSitemap';
import { Link } from '../link/Link';
import { canOverrideStatusBarBehavior } from '../utils/statusbar';

const INDENT = 20;

export function getNavOptions(): NativeStackNavigationOptions {
  return {
    title: 'sitemap',
    presentation: 'modal',
    headerLargeTitle: false,
    headerTitleStyle: {
      color: 'white',
    },
    headerTintColor: 'white',
    headerLargeTitleStyle: {
      color: 'white',
    },
    headerStyle: {
      backgroundColor: 'black',
      // @ts-expect-error: mistyped
      borderBottomColor: '#323232',
    },
    header: () => {
      const WrapperElement = Platform.OS === 'android' ? SafeAreaView : View;
      return (
        <WrapperElement style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <SitemapIcon />
            </View>
            <Text role="heading" aria-level={1} style={styles.title}>
              Sitemap
            </Text>
          </View>
        </WrapperElement>
      );
    },
  };
}

export function Sitemap() {
  return (
    <View style={styles.container}>
      {canOverrideStatusBarBehavior && <StatusBar barStyle="light-content" />}
      <ScrollView contentContainerStyle={styles.scroll}>
        <FileSystemView />
      </ScrollView>
    </View>
  );
}

function FileSystemView() {
  const sitemap = useSitemap();
  // This shouldn't occur, as the user should be on the tutorial screen
  if (!sitemap) return null;
  const children = sitemap.children.filter(({ isInternal }) => !isInternal);
  return children.map((child) => (
    <View testID="sitemap-item-container" key={child.contextKey} style={styles.itemContainer}>
      <FileItem node={child} />
    </View>
  ));
}

function FileItem({
  node,
  level = 0,
  isInitial = false,
}: {
  node: SitemapType;
  level?: number;
  isInitial?: boolean;
}) {
  const disabled = node.children.length > 0;
  const info = isInitial ? 'Initial' : node.isGenerated ? 'Generated' : '';
  return (
    <>
      {!node.isInternal && (
        <Link
          accessibilityLabel={node.contextKey}
          href={node.href}
          onPress={() => {
            if (Platform.OS !== 'web' && router.canGoBack()) {
              // Ensure the modal pops
              router.back();
            }
          }}
          disabled={disabled}
          asChild
          // Ensure we replace the history so you can't go back to this page.
          replace>
          <Pressable>
            {({ pressed, hovered }) => (
              <View
                testID="sitemap-item"
                style={[
                  styles.itemPressable,
                  {
                    paddingLeft: INDENT + level * INDENT,
                    backgroundColor: hovered ? '#202425' : 'transparent',
                  },
                  pressed && { backgroundColor: '#26292b' },
                  disabled && { opacity: 0.4 },
                ]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {node.children.length ? <PkgIcon /> : <FileIcon />}
                  <Text style={styles.filename}>{node.filename}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {!!info && (
                    <Text style={[styles.virtual, !disabled && { marginRight: 8 }]}>{info}</Text>
                  )}
                  {!disabled && <ForwardIcon />}
                </View>
              </View>
            )}
          </Pressable>
        </Link>
      )}
      {node.children.map((child) => (
        <FileItem
          key={child.contextKey}
          node={child}
          isInitial={child.isInitial}
          level={level + (child.isGenerated ? 0 : 1)}
        />
      ))}
    </>
  );
}

function FileIcon() {
  return <Image style={styles.image} source={require('expo-router/assets/file.png')} />;
}

function PkgIcon() {
  return <Image style={styles.image} source={require('expo-router/assets/pkg.png')} />;
}

function ForwardIcon() {
  return <Image style={styles.image} source={require('expo-router/assets/forward.png')} />;
}

function SitemapIcon() {
  return <Image style={styles.image} source={require('expo-router/assets/sitemap.png')} />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
    alignItems: 'stretch',
  },
  header: {
    backgroundColor: '#151718',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#313538',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.33,
    shadowRadius: 3,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: '5%',
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 960,
        marginHorizontal: 'auto',
      },
    }),
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  scroll: {
    paddingHorizontal: '5%',
    paddingVertical: 16,
    ...Platform.select({
      ios: {
        paddingBottom: 24,
      },
      web: {
        width: '100%',
        maxWidth: 960,
        marginHorizontal: 'auto',
        paddingBottom: 24,
      },
      default: {
        paddingBottom: 12,
      },
    }),
  },
  itemContainer: {
    borderWidth: 1,
    borderColor: '#313538',
    backgroundColor: '#151718',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemPressable: {
    paddingHorizontal: INDENT,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      web: {
        transitionDuration: '100ms',
      },
    }),
  },
  filename: { color: 'white', fontSize: 20, marginLeft: 12 },
  virtual: { textAlign: 'right', color: 'white' },
  image: { width: 24, height: 24, resizeMode: 'contain', opacity: 0.6 },
  headerIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#202425',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
