import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { useRecordingStore } from '../../src/features/recording/RecordingStore';
import { COSMETIC_IMAGES } from '../../src/constants/Cosmetics';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const recordingState = useRecordingStore((s) => s.state);
  const isRecordingActive =
    recordingState === 'RECORDING' ||
    recordingState === 'PAUSED' ||
    recordingState === 'RESUMING' ||
    recordingState === 'COUNTDOWN';

  // Dynamically clear Android gesture navigation pill and iOS home indicator
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 10);
  const tabHeight = 78 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: isDark ? colors.textPrimary : colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabHeight,
            paddingBottom: bottomInset,
            backgroundColor: isDark ? 'rgba(5, 7, 10, 0.94)' : 'rgba(255, 255, 255, 0.96)',
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Image
              source={COSMETIC_IMAGES.tabs.home}
              style={[styles.tabIconImg, { opacity: focused ? 1 : 0.68 }]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Routes',
          tabBarIcon: ({ focused }) => (
            <Image
              source={COSMETIC_IMAGES.tabs.routes}
              style={[styles.tabIconImg, { opacity: focused ? 1 : 0.68 }]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: 'Record',
          tabBarStyle: { display: 'none' },
          tabBarButton: (props) => (
            <View style={[props.style, styles.recordTabCell]}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={props.onPress}
                style={styles.floatingRecordOrb}
                accessibilityRole="button"
                accessibilityLabel="Record Activity"
              >
                <Image
                  source={COSMETIC_IMAGES.buttons.recordOrb}
                  style={styles.recordOrbImg}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="compete"
        options={{
          title: 'Compete',
          tabBarIcon: ({ focused }) => (
            <Image
              source={COSMETIC_IMAGES.tabs.compete}
              style={[styles.tabIconImg, { opacity: focused ? 1 : 0.68 }]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ focused }) => (
            <Image
              source={COSMETIC_IMAGES.tabs.profile}
              style={[styles.tabIconImg, { opacity: focused ? 1 : 0.68 }]}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    paddingTop: 6,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  recordTabCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingRecordOrb: {
    top: -20,
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  recordOrbImg: {
    width: 72,
    height: 72,
  },
  tabIconImg: {
    width: 56,
    height: 56,
  },
});
