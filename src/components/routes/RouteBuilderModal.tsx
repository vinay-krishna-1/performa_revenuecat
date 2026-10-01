import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Undo2, Trash2, Check, MapPin, Navigation, Compass, Sparkles, LocateFixed } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { DARK_MAP_STYLE, LIGHT_MAP_STYLE } from '../../constants/mapStyles';
import { RADIUS, SPACING } from '../../constants/theme';
import { ActivityType } from '../../constants/config';
import { RouteItem } from '../../types';
import { RouteService } from '../../features/routes/RouteService';

interface RouteBuilderModalProps {
  visible: boolean;
  onClose: () => void;
  onRouteCreated: (route: RouteItem) => void;
}

// Haversine distance helper in meters
function haversineDistanceMeters(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number {
  const R = 6371e3; // Earth radius in meters
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function RouteBuilderModal({ visible, onClose, onRouteCreated }: RouteBuilderModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const mapRef = useRef<MapView>(null);

  const [waypoints, setWaypoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [step, setStep] = useState<'DRAW' | 'DETAILS'>('DRAW');

  // Route details form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('RUN');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MODERATE' | 'HARD'>('MODERATE');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  // Attempt to locate user upon opening
  useEffect(() => {
    if (visible) {
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc =
              (await Location.getLastKnownPositionAsync()) ||
              (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
            if (loc?.coords) {
              setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
              if (mapRef.current) {
                mapRef.current.animateToRegion(
                  {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  },
                  800
                );
              }
            }
          }
        } catch {
          // Keep default region
        }
      })();
    }
  }, [visible]);

  const recenterToUser = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Enable GPS location permissions to center map on your area.');
        return;
      }
      const loc =
        (await Location.getLastKnownPositionAsync()) ||
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      if (loc?.coords && mapRef.current) {
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        mapRef.current.animateCamera(
          {
            center: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
            zoom: 16,
          },
          { duration: 600 }
        );
      }
    } catch (e: any) {
      Alert.alert('Location Error', e.message || 'Could not determine GPS location.');
    }
  };

  // Default region (San Francisco / device location)
  const initialRegion: Region = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };

  // Calculate live cumulative distance
  const totalDistanceMeters = useMemo(() => {
    if (waypoints.length < 2) return 0;
    let sum = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      sum += haversineDistanceMeters(waypoints[i], waypoints[i + 1]);
    }
    return sum;
  }, [waypoints]);

  // Estimated stats based on activity
  const estimatedSeconds = useMemo(() => {
    const km = totalDistanceMeters / 1000;
    const paceMinPerKm = activityType === 'CYCLE' ? 2.5 : activityType === 'WALK' ? 11 : 5.2;
    return Math.round(km * paceMinPerKm * 60);
  }, [totalDistanceMeters, activityType]);

  const estimatedElevation = useMemo(() => {
    return Math.round(Math.max(4, (totalDistanceMeters / 1000) * 8.5));
  }, [totalDistanceMeters]);

  const handleMapPress = (coord: { latitude: number; longitude: number }) => {
    setWaypoints((prev) => [...prev, coord]);
  };

  const handleUndo = () => {
    setWaypoints((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setWaypoints([]);
  };

  const handleProceedToDetails = () => {
    if (waypoints.length < 2) {
      Alert.alert('More Points Needed', 'Please place at least 2 waypoints on the map to create a route.');
      return;
    }
    const defaultTitle = `${(totalDistanceMeters / 1000).toFixed(1)}k Custom ${activityType === 'RUN' ? 'Run' : activityType === 'CYCLE' ? 'Cycling' : 'Walk'} Circuit`;
    setTitle(defaultTitle);
    setDescription(`Custom ${activityType.toLowerCase()} course created with ${waypoints.length} precision waypoints.`);
    setStep('DETAILS');
  };

  const handleSaveRoute = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a name for your route.');
      return;
    }
    setIsSaving(true);
    try {
      const created = await RouteService.getInstance().createCustomWaypointRoute({
        title: title.trim(),
        description: description.trim(),
        activityType,
        difficulty,
        waypoints,
        distanceMeters: totalDistanceMeters,
        elevationGainMeters: estimatedElevation,
        estimatedDurationSeconds: estimatedSeconds,
        city: city.trim() || undefined,
        isPrivate,
      });

      setIsSaving(false);
      onRouteCreated(created);
      handleClose();
    } catch (e: any) {
      setIsSaving(false);
      Alert.alert('Error', e.message || 'Failed to save route.');
    }
  };

  const handleClose = () => {
    setWaypoints([]);
    setStep('DRAW');
    setTitle('');
    setDescription('');
    setCity('');
    setIsPrivate(false);
    onClose();
  };

  const formatPace = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Full Screen Interactive Map */}
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          customMapStyle={isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
          initialRegion={initialRegion}
          onPress={(e) => {
            if (step === 'DRAW') {
              handleMapPress(e.nativeEvent.coordinate);
            }
          }}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {/* User Tactical Location Dot Marker */}
          {userLocation && (
            <Marker
              coordinate={userLocation}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={50}
              flat={true}
            >
              <View style={styles.userLocationDot}>
                <View style={styles.userLocationPulse} />
                <View style={styles.userLocationCore} />
              </View>
            </Marker>
          )}

          {/* Glowing Connecting Polyline */}
          {waypoints.length > 1 && (
            <Polyline
              coordinates={waypoints}
              strokeColor="#CCFF00"
              strokeWidth={4.5}
              lineCap="round"
              lineJoin="round"
              tappable={false}
            />
          )}

          {/* Numbered Waypoint Markers */}
          {waypoints.map((point, index) => {
            const isStart = index === 0;
            const isEnd = index === waypoints.length - 1 && waypoints.length > 1;

            return (
              <Marker
                key={`wp_${index}_${point.latitude.toFixed(5)}_${point.longitude.toFixed(5)}`}
                coordinate={point}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View
                  style={[
                    styles.markerBadge,
                    isStart
                      ? styles.markerStart
                      : isEnd
                      ? styles.markerEnd
                      : styles.markerIntermediate,
                  ]}
                >
                  <Text style={[styles.markerNumber, { color: isStart || isEnd ? '#FFFFFF' : '#CCFF00' }]}>
                    {isStart ? '1 START' : isEnd ? `${index + 1} FINISH` : `${index + 1}`}
                  </Text>
                </View>
              </Marker>
            );
          })}
        </MapView>

        {/* Floating Top Control Header */}
        <View style={[styles.topHeader, { top: insets.top + 10 }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={step === 'DETAILS' ? () => setStep('DRAW') : handleClose}
            style={[styles.glassCircleButton, { backgroundColor: 'rgba(11, 15, 20, 0.88)' }]}
          >
            <X size={18} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>

          <View style={[styles.statusPill, { backgroundColor: 'rgba(11, 15, 20, 0.88)' }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.accent }]} />
            <Text style={styles.statusPillText}>
              {step === 'DRAW'
                ? waypoints.length === 0
                  ? 'TAP MAP TO PLACE WAYPOINTS'
                  : `${waypoints.length} WAYPOINTS CONNECTED`
                : 'FINALIZE ROUTE DETAILS'}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={recenterToUser}
            style={[styles.glassCircleButton, { backgroundColor: 'rgba(11, 15, 20, 0.88)' }]}
          >
            <LocateFixed size={18} color={colors.accent} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {/* Step 1: Draw HUD Console (Bottom of Screen) */}
        {step === 'DRAW' && (
          <View style={[styles.bottomHud, { bottom: insets.bottom + 16 }]}>
            {/* Live Metrics Matrix */}
            <View style={styles.metricsBar}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{(totalDistanceMeters / 1000).toFixed(2)}</Text>
                <Text style={styles.metricUnit}>KM DIST</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>+{estimatedElevation}m</Text>
                <Text style={styles.metricUnit}>ELEVATION</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{formatPace(estimatedSeconds)}</Text>
                <Text style={styles.metricUnit}>EST TIME</Text>
              </View>
            </View>

            {/* Instruction Tip */}
            <Text style={styles.tipText}>
              {waypoints.length === 0
                ? '👆 Tap anywhere on the map to place your starting waypoint.'
                : 'Tap to extend route. Pointers will automatically join into a continuous circuit.'}
            </Text>

            {/* Action Row */}
            <View style={styles.hudActionRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleUndo}
                disabled={waypoints.length === 0}
                style={[
                  styles.toolButton,
                  { opacity: waypoints.length === 0 ? 0.35 : 1 },
                ]}
              >
                <Undo2 size={16} color="#FFFFFF" />
                <Text style={styles.toolButtonText}>Undo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleClear}
                disabled={waypoints.length === 0}
                style={[
                  styles.toolButton,
                  { opacity: waypoints.length === 0 ? 0.35 : 1 },
                ]}
              >
                <Trash2 size={16} color="#FF5C6C" />
                <Text style={[styles.toolButtonText, { color: '#FF5C6C' }]}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleProceedToDetails}
                disabled={waypoints.length < 2}
                style={[
                  styles.proceedButton,
                  {
                    backgroundColor: waypoints.length >= 2 ? colors.accent : 'rgba(255, 255, 255, 0.1)',
                    opacity: waypoints.length < 2 ? 0.45 : 1,
                  },
                ]}
              >
                <Check size={16} color={waypoints.length >= 2 ? '#000000' : '#888888'} strokeWidth={2.6} />
                <Text
                  style={[
                    styles.proceedButtonText,
                    { color: waypoints.length >= 2 ? '#000000' : '#888888' },
                  ]}
                >
                  Confirm ({waypoints.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2: Route Metadata Drawer */}
        {step === 'DETAILS' && (
          <View style={[styles.detailsDrawer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 80 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.drawerTitle}>Name Your Course</Text>
              <Text style={styles.drawerSubtitle}>
                {(totalDistanceMeters / 1000).toFixed(2)} km course with {waypoints.length} verified waypoints.
              </Text>

              {/* Title Input */}
              <Text style={styles.inputLabel}>COURSE NAME</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Embarcadero 5K Sprint"
                placeholderTextColor="#666677"
                style={styles.textInput}
              />

              {/* City Input */}
              <Text style={styles.inputLabel}>CITY / METRO</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Bengaluru, San Francisco, London..."
                placeholderTextColor="#666677"
                style={styles.textInput}
              />

              {/* Description Input */}
              <Text style={styles.inputLabel}>DESCRIPTION</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Scenic asphalt circuit ideal for ghost sprints..."
                placeholderTextColor="#666677"
                style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                multiline
              />

              {/* Sport Selector */}
              <Text style={styles.inputLabel}>ACTIVITY DISCIPLINE</Text>
              <View style={styles.pillRow}>
                {(['RUN', 'CYCLE', 'WALK'] as ActivityType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    activeOpacity={0.8}
                    onPress={() => setActivityType(type)}
                    style={[
                      styles.pillOption,
                      activityType === type && {
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillOptionText,
                        activityType === type && { color: '#000000', fontWeight: '800' },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Difficulty */}
              <Text style={styles.inputLabel}>CHALLENGE LEVEL</Text>
              <View style={styles.pillRow}>
                {(['EASY', 'MODERATE', 'HARD'] as const).map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    activeOpacity={0.8}
                    onPress={() => setDifficulty(diff)}
                    style={[
                      styles.pillOption,
                      difficulty === diff && {
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillOptionText,
                        difficulty === diff && { color: '#000000', fontWeight: '800' },
                      ]}
                    >
                      {diff}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Course Privacy & Visibility Setting */}
              <Text style={styles.inputLabel}>COURSE PRIVACY & VISIBILITY</Text>
              <View style={styles.pillRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsPrivate(false)}
                  style={[
                    styles.pillOption,
                    !isPrivate && {
                      backgroundColor: colors.accent,
                      borderColor: colors.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillOptionText,
                      !isPrivate && { color: '#000000', fontWeight: '800' },
                    ]}
                  >
                    Public (Community)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsPrivate(true)}
                  style={[
                    styles.pillOption,
                    isPrivate && {
                      backgroundColor: colors.accent,
                      borderColor: colors.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillOptionText,
                      isPrivate && { color: '#000000', fontWeight: '800' },
                    ]}
                  >
                    Private (Only Me)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Save & Publish Action */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSaveRoute}
                disabled={isSaving}
                style={[styles.saveButton, { backgroundColor: colors.accent }]}
              >
                <Sparkles size={18} color="#000000" strokeWidth={2.4} />
                <Text style={styles.saveButtonText}>
                  {isSaving
                    ? 'SAVING COURSE...'
                    : isPrivate
                    ? 'SAVE PRIVATE COURSE'
                    : 'SAVE & PUBLISH COURSE'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  glassCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 7,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    color: '#F5F7FA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  markerBadge: {
    paddingHorizontal: 6,
    height: 22,
    minWidth: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  markerStart: {
    backgroundColor: '#10B981',
  },
  markerEnd: {
    backgroundColor: '#EF4444',
  },
  markerIntermediate: {
    backgroundColor: '#0F172A',
    borderColor: '#CCFF00',
  },
  markerNumber: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  bottomHud: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(11, 15, 20, 0.94)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 14,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    color: '#CCFF00',
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    color: '#8A99A8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tipText: {
    color: '#A0AEC0',
    fontSize: 11,
    textAlign: 'center',
    marginVertical: 10,
    lineHeight: 15,
  },
  hudActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  proceedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 6,
  },
  proceedButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  detailsDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0D0D10',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: '85%',
    zIndex: 20,
  },
  drawerTitle: {
    color: '#F5F7FA',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  drawerSubtitle: {
    color: '#8A99A8',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  inputLabel: {
    color: '#8A99A8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pillOptionText: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '700',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    marginTop: 22,
    marginBottom: 10,
    gap: 8,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  userLocationDot: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 130, 255, 0.28)',
    borderWidth: 1.5,
    borderColor: '#0082FF',
  },
  userLocationCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0082FF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 6,
  },
});
