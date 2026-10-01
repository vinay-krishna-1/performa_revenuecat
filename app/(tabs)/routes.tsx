import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, LayoutAnimation, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
  Search,
  MapPin,
  Award,
  Plus,
  Zap,
  Users,
  X,
  Clock,
  Gauge,
  Bookmark,
  BookmarkCheck,
  Navigation,
  Bike,
  Footprints,
  Lock,
  Globe,
} from 'lucide-react-native';
import { RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { RouteItem } from '../../src/types';
import {
  SegmentedControl,
  EmptyState,
  RouteElevationProfile,
  PerformaButton,
  ScreenBackground,
} from '../../src/components/common';
import { ActivityMap } from '../../src/components/maps/ActivityMap';
import { RouteVectorThumbnail } from '../../src/components/routes/RouteVectorThumbnail';
import { RouteService, DEFAULT_ROUTES } from '../../src/features/routes/RouteService';
import { useRecordingStore } from '../../src/features/recording/RecordingStore';
import { RouteBuilderModal } from '../../src/components/routes/RouteBuilderModal';

const CITIES = ['Bengaluru', 'ALL', 'Tokyo', 'London', 'San Francisco', 'New York'];

export default function RoutesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'DISCOVER' | 'SAVED' | 'MY_ROUTES'>('DISCOVER');
  const [selectedSport, setSelectedSport] = useState<'ALL' | 'RUN' | 'CYCLE'>('ALL');
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [searchQuery, setSearchQuery] = useState('');
  const [routes, setRoutes] = useState<RouteItem[]>(DEFAULT_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);

  const reloadRoutes = async () => {
    const all = await RouteService.getInstance().getAllRoutes();
    setRoutes(all);
  };

  useEffect(() => {
    reloadRoutes();

    // Auto-detect local city based on current GPS location
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getLastKnownPositionAsync();
          if (loc?.coords) {
            const isNearBLR =
              Math.abs(loc.coords.latitude - 12.97) < 1.5 &&
              Math.abs(loc.coords.longitude - 77.59) < 1.5;
            if (isNearBLR) {
              setSelectedCity('Bengaluru');
            }
          }
        }
      } catch (_) {}
    })();
  }, []);

  const handleTabChange = (tab: 'DISCOVER' | 'SAVED' | 'MY_ROUTES') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const handleCityChange = (city: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCity(city);
  };

  const handleRouteCreated = (newRoute: RouteItem) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRoutes((prev) => [newRoute, ...prev]);
    setActiveTab('MY_ROUTES');
    setSelectedRoute(newRoute);
  };

  const handleToggleSave = async (routeId: string) => {
    const newSaved = await RouteService.getInstance().toggleSaveRoute(routeId);
    setRoutes((prev) =>
      prev.map((r) => (r.id === routeId ? { ...r, isSaved: newSaved } : r))
    );
    if (selectedRoute?.id === routeId) {
      setSelectedRoute((prev) => (prev ? { ...prev, isSaved: newSaved } : null));
    }
  };

  const handleRaceGhost = (route: RouteItem) => {
    setSelectedRoute(null);
    const ghost = RouteService.getInstance().createGhostFromRoute(route);
    const store = useRecordingStore.getState();
    store.setActivityType(route.activityType);
    store.setMode('GHOST');
    store.setGhostOpponent(ghost);
    store.setSelectedRoute(route);
    router.push({
      pathname: '/(tabs)/record',
      params: { routeId: route.id, mode: 'GHOST' },
    });
  };

  const handleLoadRoute = (route: RouteItem) => {
    setSelectedRoute(null);
    const store = useRecordingStore.getState();
    store.setActivityType(route.activityType);
    store.setMode('ROUTE');
    store.setSelectedRoute(route);
    router.push({
      pathname: '/(tabs)/record',
      params: { routeId: route.id, mode: 'ROUTE' },
    });
  };

  const filteredRoutes = routes.filter((route) => {
    if (activeTab === 'SAVED' && !route.isSaved) return false;
    if (activeTab === 'MY_ROUTES' && !route.isCreatedByUser) return false;
    if (activeTab === 'DISCOVER' && selectedCity !== 'ALL' && route.city !== selectedCity) return false;
    if (selectedSport === 'CYCLE' && route.activityType !== 'CYCLE') return false;
    if (selectedSport === 'RUN' && route.activityType === 'CYCLE') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = route.title.toLowerCase().includes(q);
      const matchCity = route.city?.toLowerCase().includes(q);
      const matchDesc = route.description.toLowerCase().includes(q);
      if (!matchTitle && !matchCity && !matchDesc) return false;
    }
    return true;
  });

  const formatPace = (meters: number, seconds: number) => {
    if (meters <= 0) return '0:00';
    const km = meters / 1000;
    const paceSec = Math.round(seconds / km);
    const m = Math.floor(paceSec / 60);
    const s = paceSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s} /km`;
  };

  const formatDuration = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={[styles.screen, { backgroundColor: 'transparent', paddingTop: insets.top }]}>
      <ScreenBackground />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerKicker, { color: colors.textMuted }]}>ROUTE DIRECTORY</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Where to Train</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsCreatingRoute(true)}
          style={[styles.createButton, { backgroundColor: colors.accent }]}
        >
          <Plus size={14} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={2.4} />
          <Text style={[styles.createButtonText, { color: isDark ? '#000000' : '#FFFFFF' }]}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Selector */}
      <View style={styles.segmentedContainer}>
        <SegmentedControl<'DISCOVER' | 'SAVED' | 'MY_ROUTES'>
          options={[
            { id: 'DISCOVER', label: 'Discover' },
            { id: 'SAVED', label: 'Saved' },
            { id: 'MY_ROUTES', label: 'My Routes' },
          ]}
          selectedId={activeTab}
          onSelect={(id) => handleTabChange(id)}
        />
      </View>

      {/* Sport Category Division (All vs Run/Walk vs Cycling) */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <SegmentedControl<'ALL' | 'RUN' | 'CYCLE'>
          options={[
            { id: 'ALL', label: 'All Sports' },
            { id: 'RUN', label: 'Run / Walk' },
            { id: 'CYCLE', label: 'Cycling' },
          ]}
          selectedId={selectedSport}
          onSelect={(id) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setSelectedSport(id);
          }}
        />
      </View>

      {/* Minimalist Search Bar */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: isDark ? '#0D0D10' : '#FFFFFF',
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <Search size={15} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Search routes or cities..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>
      </View>

      {/* City Filter Pills (Discover mode) */}
      {activeTab === 'DISCOVER' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cityPillScroll}
          style={styles.cityPillContainer}
        >
          {CITIES.map((c) => {
            const isSelected = selectedCity === c;
            return (
              <TouchableOpacity
                key={c}
                activeOpacity={0.75}
                onPress={() => handleCityChange(c)}
                style={[
                  styles.cityPill,
                  {
                    backgroundColor: isSelected
                      ? colors.accent
                      : isDark
                      ? '#111116'
                      : '#F1F5F9',
                    borderColor: isSelected ? colors.accent : colors.surfaceBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cityPillText,
                    {
                      color: isSelected
                        ? isDark
                          ? '#000000'
                          : '#FFFFFF'
                        : colors.textSecondary,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {c === 'ALL' ? 'All Cities' : c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Seamless Route Stream (NO BOXES) */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredRoutes.length === 0 ? (
          <EmptyState
            title={
              activeTab === 'SAVED'
                ? 'No Saved Routes'
                : activeTab === 'MY_ROUTES'
                ? 'No Custom Routes Yet'
                : 'No Routes Found'
            }
            description={
              activeTab === 'SAVED'
                ? 'Bookmark any route from Discover to keep it here for quick access.'
                : activeTab === 'MY_ROUTES'
                ? 'Draw your own running or cycling circuit by placing waypoints on the map.'
                : selectedCity !== 'ALL'
                ? `No routes registered for ${selectedCity} yet.`
                : 'Try a different search keyword or create a custom track.'
            }
            icon={<MapPin size={28} color={colors.textMuted} />}
            actionTitle={
              activeTab === 'SAVED'
                ? 'Discover Routes'
                : activeTab === 'MY_ROUTES'
                ? 'Create Route'
                : 'Reset Filters'
            }
            onActionPress={() => {
              if (activeTab === 'MY_ROUTES') {
                setIsCreatingRoute(true);
              } else {
                setActiveTab('DISCOVER');
                setSelectedCity('ALL');
                setSearchQuery('');
              }
            }}
          />
        ) : (
          filteredRoutes.map((route) => (
            <TouchableOpacity
              key={route.id}
              activeOpacity={0.88}
              onPress={() => setSelectedRoute(route)}
              style={styles.routeItem}
            >
              <View style={styles.itemTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <View
                    style={[
                      styles.diffBadge,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 82, 255, 0.08)',
                      },
                    ]}
                  >
                    <Text style={[styles.diffText, { color: isDark ? colors.textSecondary : colors.primary }]}>
                      {route.difficulty}
                    </Text>
                  </View>

                  {/* Sport Badge: Run vs Cycle */}
                  <View
                    style={[
                      styles.cityBadge,
                      {
                        backgroundColor: route.activityType === 'CYCLE'
                          ? (isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.10)')
                          : (isDark ? 'rgba(204, 255, 0, 0.10)' : 'rgba(0, 82, 255, 0.08)'),
                        borderColor: route.activityType === 'CYCLE'
                          ? 'rgba(56, 189, 248, 0.35)'
                          : colors.surfaceBorder,
                      },
                    ]}
                  >
                    {route.activityType === 'CYCLE' ? (
                      <Bike size={9} color="#38BDF8" />
                    ) : (
                      <Footprints size={9} color={colors.accent} />
                    )}
                    <Text
                      style={[
                        styles.cityBadgeText,
                        { color: route.activityType === 'CYCLE' ? '#38BDF8' : colors.textSecondary },
                      ]}
                    >
                      {route.activityType === 'CYCLE' ? 'CYCLE' : route.activityType}
                    </Text>
                  </View>

                  {route.city ? (
                    <View
                      style={[
                        styles.cityBadge,
                        {
                          backgroundColor: isDark ? '#141419' : '#EDF2F7',
                          borderColor: colors.surfaceBorder,
                        },
                      ]}
                    >
                      <MapPin size={9} color={colors.accent} />
                      <Text style={[styles.cityBadgeText, { color: colors.textSecondary }]}>
                        {route.city}
                      </Text>
                    </View>
                  ) : null}

                  {route.isCreatedByUser ? (
                    <View
                      style={[
                        styles.cityBadge,
                        {
                          backgroundColor: isDark ? 'rgba(204, 255, 0, 0.12)' : 'rgba(0, 82, 255, 0.12)',
                          borderColor: isDark ? 'rgba(204, 255, 0, 0.3)' : 'rgba(0, 82, 255, 0.3)',
                        },
                      ]}
                    >
                      <Text style={[styles.cityBadgeText, { color: colors.accent, fontWeight: '800' }]}>
                        MY ROUTE
                      </Text>
                    </View>
                  ) : null}

                  {route.isPrivate ? (
                    <View
                      style={[
                        styles.cityBadge,
                        {
                          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          borderColor: 'rgba(245, 158, 11, 0.35)',
                        },
                      ]}
                    >
                      <Lock size={9} color={colors.gold} />
                      <Text style={[styles.cityBadgeText, { color: colors.gold, fontWeight: '800' }]}>
                        PRIVATE
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={styles.statsInline}>
                    <Users size={12} color={colors.textMuted} />
                    <Text style={[styles.attemptsText, { color: colors.textMuted }]}>{route.attemptsCount}</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggleSave(route.id);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {route.isSaved ? (
                      <BookmarkCheck size={18} color={colors.accent} />
                    ) : (
                      <Bookmark size={18} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.routeTitle, { color: colors.textPrimary }]}>{route.title}</Text>
              <Text style={[styles.routeDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                {route.description}
              </Text>

              {/* Instant High-Performance Vector Route Thumbnail */}
              {route.polyline && route.polyline.length > 1 && (
                <RouteVectorThumbnail
                  coordinates={route.polyline}
                  height={110}
                />
              )}

              {/* Telemetry Row */}
              <View style={[styles.metricRow, { borderColor: colors.surfaceBorder }]}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricVal, { color: colors.textPrimary }]}>
                    {(route.distanceMeters / 1000).toFixed(1)}
                  </Text>
                  <Text style={[styles.metricUnit, { color: colors.textMuted }]}>KM</Text>
                </View>
                <View style={[styles.metricDivider, { backgroundColor: colors.surfaceBorder }]} />
                <View style={styles.metricItem}>
                  <Text style={[styles.metricVal, { color: colors.textPrimary }]}>+{route.elevationGainMeters}</Text>
                  <Text style={[styles.metricUnit, { color: colors.textMuted }]}>M ELEV</Text>
                </View>
                <View style={[styles.metricDivider, { backgroundColor: colors.surfaceBorder }]} />
                <View style={styles.metricItem}>
                  <Text style={[styles.metricVal, { color: colors.textPrimary }]}>
                    {route.attemptsCount > 0 && route.recordTimeSeconds > 0
                      ? formatPace(route.distanceMeters, route.recordTimeSeconds).split(' ')[0]
                      : '--:--'}
                  </Text>
                  <Text style={[styles.metricUnit, { color: colors.textMuted }]}>CR PACE</Text>
                </View>
              </View>

              {/* Course Record & Action */}
              <View style={styles.bottomRow}>
                <View style={styles.recordBanner}>
                  {route.attemptsCount > 0 && !route.isCreatedByUser ? (
                    <>
                      <Award size={13} color={colors.gold} />
                      <Text style={[styles.recordBannerText, { color: colors.textMuted }]}>
                        CR: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{route.recordHolderName}</Text>
                      </Text>
                    </>
                  ) : (
                    <>
                      <Navigation size={12} color={colors.accent} />
                      <Text style={[styles.recordBannerText, { color: colors.accent, fontWeight: '700' }]}>
                        NEW COURSE
                      </Text>
                    </>
                  )}
                </View>

                {route.attemptsCount > 0 && !route.isCreatedByUser ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRaceGhost(route);
                    }}
                    style={[styles.raceButton, { backgroundColor: colors.accent }]}
                  >
                    <Zap size={13} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={2.4} />
                    <Text style={[styles.raceButtonText, { color: isDark ? '#000000' : '#FFFFFF' }]}>RACE GHOST</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleLoadRoute(route);
                    }}
                    style={[
                      styles.raceButton,
                      {
                        backgroundColor: isDark ? '#141820' : '#EDF2F7',
                        borderColor: colors.surfaceBorder,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Navigation size={12} color={colors.accent} strokeWidth={2.2} />
                    <Text style={[styles.raceButtonText, { color: colors.textPrimary, marginLeft: 3 }]}>RECORD</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.rowSeparator, { backgroundColor: colors.divider }]} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Route Detail & Ghost Challenge Modal */}
      <Modal visible={!!selectedRoute} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: isDark ? '#0D0D10' : '#FFFFFF',
                borderColor: colors.surfaceBorder,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            {selectedRoute && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <View style={styles.modalTagRow}>
                      <View
                        style={[
                          styles.diffBadge,
                          {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 82, 255, 0.08)',
                          },
                        ]}
                      >
                        <Text style={[styles.diffText, { color: isDark ? colors.textSecondary : colors.primary }]}>
                          {selectedRoute.difficulty}
                        </Text>
                      </View>
                      <Text style={[styles.modalSport, { color: colors.textMuted }]}>
                        {selectedRoute.activityType}
                      </Text>
                      {selectedRoute.city ? (
                        <Text style={[styles.modalSport, { color: colors.accent }]}>
                          · {selectedRoute.city.toUpperCase()}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                      {selectedRoute.title}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleToggleSave(selectedRoute.id)}
                      style={[
                        styles.closeBtn,
                        {
                          borderColor: selectedRoute.isSaved ? colors.accent : colors.surfaceBorder,
                          backgroundColor: selectedRoute.isSaved
                            ? isDark
                              ? 'rgba(204, 255, 0, 0.12)'
                              : 'rgba(0, 82, 255, 0.12)'
                            : undefined,
                        },
                      ]}
                    >
                      {selectedRoute.isSaved ? (
                        <BookmarkCheck size={16} color={colors.accent} />
                      ) : (
                        <Bookmark size={16} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setSelectedRoute(null)}
                      style={[styles.closeBtn, { borderColor: colors.surfaceBorder }]}
                    >
                      <X size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
                  {selectedRoute.description}
                </Text>

                {/* Interactive Route Map */}
                <View style={[styles.modalMapBox, { borderColor: colors.surfaceBorder }]}>
                  <ActivityMap
                    coordinates={selectedRoute.polyline}
                    interactive={true}
                    showControls={true}
                    showStartFinishPins={true}
                    style={{ height: 180 }}
                  />
                </View>

                {/* Route Elevation Profile */}
                <RouteElevationProfile
                  distanceMeters={selectedRoute.distanceMeters}
                  elevationGainMeters={selectedRoute.elevationGainMeters}
                  coordinates={selectedRoute.polyline}
                  style={{ marginBottom: 16 }}
                />

                {/* Telemetry Strip */}
                <View style={[styles.modalMetricStrip, { borderColor: colors.surfaceBorder }]}>
                  <View style={styles.modalMetricItem}>
                    <Text style={[styles.modalMetricVal, { color: colors.textPrimary }]}>
                      {(selectedRoute.distanceMeters / 1000).toFixed(1)}
                    </Text>
                    <Text style={[styles.modalMetricLabel, { color: colors.textMuted }]}>DISTANCE (KM)</Text>
                  </View>
                  <View style={[styles.modalMetricDivider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.modalMetricItem}>
                    <Text style={[styles.modalMetricVal, { color: colors.textPrimary }]}>
                      +{selectedRoute.elevationGainMeters}m
                    </Text>
                    <Text style={[styles.modalMetricLabel, { color: colors.textMuted }]}>ELEVATION</Text>
                  </View>
                  <View style={[styles.modalMetricDivider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.modalMetricItem}>
                    <Text style={[styles.modalMetricVal, { color: colors.accent }]}>
                      {formatPace(selectedRoute.distanceMeters, selectedRoute.recordTimeSeconds).split(' ')[0]}
                    </Text>
                    <Text style={[styles.modalMetricLabel, { color: colors.textMuted }]}>CR PACE</Text>
                  </View>
                </View>

                {/* Course Record Podium Box */}
                {/* Course Record Podium Box / New Circuit Callout */}
                {selectedRoute.attemptsCount > 0 && !selectedRoute.isCreatedByUser ? (
                  <View
                    style={[
                      styles.crPodiumBox,
                      {
                        backgroundColor: isDark ? 'rgba(234, 179, 8, 0.06)' : 'rgba(217, 119, 6, 0.06)',
                        borderColor: isDark ? 'rgba(234, 179, 8, 0.2)' : 'rgba(217, 119, 6, 0.2)',
                      },
                    ]}
                  >
                    <Award size={18} color={colors.gold} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.crAthlete, { color: colors.textPrimary }]}>
                        Course Record: {selectedRoute.recordHolderName}
                      </Text>
                      <Text style={[styles.crTime, { color: colors.gold }]}>
                        {formatDuration(selectedRoute.recordTimeSeconds)} ({formatPace(selectedRoute.distanceMeters, selectedRoute.recordTimeSeconds)})
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.crPodiumBox,
                      {
                        backgroundColor: isDark ? 'rgba(204, 255, 0, 0.06)' : 'rgba(0, 82, 255, 0.06)',
                        borderColor: isDark ? 'rgba(204, 255, 0, 0.25)' : 'rgba(0, 82, 255, 0.25)',
                      },
                    ]}
                  >
                    <Navigation size={18} color={colors.accent} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.crAthlete, { color: colors.textPrimary, fontWeight: '800' }]}>
                        Newly Created Course
                      </Text>
                      <Text style={[styles.crTime, { color: colors.accent }]}>
                        No runs recorded yet • Be the first athlete to set the Course Record!
                      </Text>
                    </View>
                  </View>
                )}

                {/* Dual Action Buttons: Ghost Challenge (if completions exist) + Navigate Course */}
                <View style={{ gap: 10, marginTop: 16 }}>
                  {selectedRoute.attemptsCount > 0 && !selectedRoute.isCreatedByUser && (
                    <PerformaButton
                      title="RACE GHOST NOW"
                      onPress={() => handleRaceGhost(selectedRoute)}
                      variant="accent"
                      size="lg"
                      icon={<Zap size={16} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={2.4} />}
                    />
                  )}

                  {selectedRoute.isPrivate && selectedRoute.isCreatedByUser && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={async () => {
                        const ok = await RouteService.getInstance().publishRoute(selectedRoute.id);
                        if (ok) {
                          setSelectedRoute({ ...selectedRoute, isPrivate: false });
                          await reloadRoutes();
                          Alert.alert('Route Published!', 'Your route is now visible to the public community.');
                        }
                      }}
                      style={[
                        styles.publishBtn,
                        {
                          borderColor: colors.accent,
                          backgroundColor: isDark ? 'rgba(204, 255, 0, 0.12)' : 'rgba(0, 82, 255, 0.10)',
                        },
                      ]}
                    >
                      <Globe size={15} color={colors.accent} strokeWidth={2.2} />
                      <Text style={[styles.publishBtnText, { color: colors.accent }]}>
                        PUBLISH TO COMMUNITY (MAKE PUBLIC)
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleLoadRoute(selectedRoute)}
                    style={[
                      styles.loadRouteBtn,
                      {
                        borderColor: colors.surfaceBorder,
                        backgroundColor: isDark ? '#141418' : '#EDF2F7',
                      },
                    ]}
                  >
                    <Navigation size={15} color={colors.accent} strokeWidth={2.2} />
                    <Text style={[styles.loadRouteBtnText, { color: colors.textPrimary }]}>
                      START RECORDING COURSE
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Interactive Waypoint Route Builder (Only mounted when opened) */}
      {isCreatingRoute && (
        <RouteBuilderModal
          visible={isCreatingRoute}
          onClose={() => setIsCreatingRoute(false)}
          onRouteCreated={handleRouteCreated}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  createButtonText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  segmentedContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  cityPillContainer: {
    marginBottom: 12,
    flexGrow: 0,
  },
  cityPillScroll: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 3,
  },
  cityPill: {
    paddingHorizontal: 16,
    height: 32,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cityPillText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    height: 20,
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  cityBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 4,
  },
  publishBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loadRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  loadRouteBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  routeItem: {
    paddingVertical: 12,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  diffBadge: {
    paddingHorizontal: 7,
    height: 22,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diffText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  statsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attemptsText: {
    fontSize: 11,
  },
  routeTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  routeDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  routeMapBox: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  metricUnit: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordBannerText: {
    fontSize: 12,
  },
  raceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  raceButtonText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  rowSeparator: {
    height: 1,
    marginTop: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modalSport: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  modalMapBox: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 14,
  },
  modalMetricStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  modalMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  modalMetricVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  modalMetricDivider: {
    width: 1,
    height: 22,
  },
  crPodiumBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  crAthlete: {
    fontSize: 13,
    fontWeight: '700',
  },
  crTime: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
});
