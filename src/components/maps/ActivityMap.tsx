import React, { useRef, useState, useEffect, useMemo, useImperativeHandle, Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ViewStyle, StyleProp } from 'react-native';
import { WebView } from 'react-native-webview';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Locate, Compass, Layers } from 'lucide-react-native';
import Svg, { Polyline as SvgPolyline, Circle as SvgCircle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { DARK_MAP_STYLE, LIGHT_MAP_STYLE } from '../../constants/mapStyles';
import { GPSQualityScore } from '../../types';

interface ActivityMapProps {
  coordinates?: { latitude: number; longitude: number }[];
  ghostCoordinates?: { latitude: number; longitude: number }[];
  ghostCurrentCoordinate?: { latitude: number; longitude: number } | null;
  ghostOpponentName?: string;
  currentLocation?: { latitude: number; longitude: number } | null;
  gpsQuality?: GPSQualityScore;
  interactive?: boolean;
  followUser?: boolean;
  showControls?: boolean;
  showStartFinishPins?: boolean;
  bottomOffset?: number;
  style?: StyleProp<ViewStyle>;
}

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[ActivityMap] Map error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Builds the standalone Leaflet HTML document using OpenStreetMap tiles.
 * 100% free — no API key, no watermark, no registration required.
 * Dark mode = CSS filter (invert + hue-rotate) on the Leaflet tile pane.
 */
function buildLeafletHtml(
  centerLat: number,
  centerLng: number,
  isDark: boolean,
  interactive: boolean,
  coords: { latitude: number; longitude: number }[],
  ghostCoords: { latitude: number; longitude: number }[]
): string {
  // OpenStreetMap — 100% free, no API key, no watermark.
  // Dark mode achieved via CSS filter: invert + hue-rotate on the tile pane.
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const userCoordsJson = JSON.stringify(coords.map((c) => [c.latitude, c.longitude]));
  const ghostCoordsJson = JSON.stringify(ghostCoords.map((c) => [c.latitude, c.longitude]));

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: ${isDark ? '#08080A' : '#F1F5F9'}; }
    .leaflet-control-attribution, .leaflet-control-zoom { display: none !important; }
    ${isDark ? '.leaflet-tile-pane { filter: invert(100%) hue-rotate(180deg) brightness(0.82) contrast(1.05) saturate(0.7); }' : ''}
    .runner-pulse {
      width: 26px;
      height: 26px;
      border-radius: 13px;
      background: ${isDark ? 'rgba(204, 255, 0, 0.28)' : 'rgba(0, 82, 255, 0.24)'};
      border: 1.5px solid ${isDark ? '#CCFF00' : '#0052FF'};
      position: relative;
      animation: pulseAnim 1.8s infinite;
    }
    .runner-core {
      width: 10px;
      height: 10px;
      border-radius: 5px;
      background: ${isDark ? '#CCFF00' : '#0052FF'};
      border: 1.5px solid #FFFFFF;
      position: absolute;
      top: 6.5px;
      left: 6.5px;
      box-shadow: 0 0 6px ${isDark ? '#CCFF00' : '#0052FF'};
    }
    @keyframes pulseAnim {
      0% { transform: scale(0.95); opacity: 0.95; }
      50% { transform: scale(1.35); opacity: 0.35; }
      100% { transform: scale(0.95); opacity: 0.95; }
    }
    .start-dot {
      width: 12px;
      height: 12px;
      border-radius: 6px;
      background: #10B981;
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 4px rgba(0,0,0,0.4);
    }
    .ghost-tag {
      padding: 2px 6px;
      background: #A855F7;
      color: #FFFFFF;
      font-size: 8px;
      font-weight: 900;
      border-radius: 4px;
      border: 1.5px solid #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 2px 4px rgba(0,0,0,0.4);
      letter-spacing: 0.5px;
    }
    .ghost-blob-pulse {
      width: 26px;
      height: 26px;
      border-radius: 13px;
      background: rgba(168, 85, 247, 0.35);
      border: 1.5px solid #A855F7;
      position: relative;
      animation: ghostPulseAnim 1.8s infinite;
    }
    .ghost-blob-core {
      width: 10px;
      height: 10px;
      border-radius: 5px;
      background: #A855F7;
      border: 1.5px solid #FFFFFF;
      position: absolute;
      top: 6.5px;
      left: 6.5px;
      box-shadow: 0 0 8px #A855F7;
    }
    .ghost-avatar-name {
      position: absolute;
      bottom: 26px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(13, 13, 16, 0.92);
      color: #D8B4FE;
      font-size: 8px;
      font-weight: 900;
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid rgba(168, 85, 247, 0.5);
      white-space: nowrap;
      letter-spacing: 0.4px;
    }
    @keyframes ghostPulseAnim {
      0% { transform: scale(0.95); opacity: 0.95; }
      50% { transform: scale(1.35); opacity: 0.4; }
      100% { transform: scale(0.95); opacity: 0.95; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      dragging: ${interactive},
      touchZoom: ${interactive},
      doubleClickZoom: ${interactive},
      scrollWheelZoom: ${interactive},
      boxZoom: false
    }).setView([${centerLat}, ${centerLng}], 16);

    L.tileLayer('${tileUrl}', {
      subdomains: 'abc',
      maxZoom: 19,
      tileSize: 256
    }).addTo(map);

    var userCoords = ${userCoordsJson};
    var ghostCoords = ${ghostCoordsJson};

    // User Route Polyline (Volt Green)
    var userPolyline = L.polyline(userCoords, {
      color: '${isDark ? '#CCFF00' : '#0052FF'}',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Ghost Route Polyline (Purple dashed)
    var ghostPolyline = L.polyline(ghostCoords, {
      color: '#A855F7',
      weight: 4,
      dashArray: '6, 6',
      opacity: 0.85
    }).addTo(map);

    // Start Pin
    var startMarker = null;
    if (userCoords.length > 0) {
      startMarker = L.marker(userCoords[0], {
        icon: L.divIcon({ className: 'start-dot', iconSize: [12, 12], iconAnchor: [6, 6] })
      }).addTo(map);
    }

    // Live Runner Marker
    var runnerIcon = L.divIcon({
      className: '',
      html: '<div class="runner-pulse"><div class="runner-core"></div></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    var runnerMarker = L.marker([${centerLat}, ${centerLng}], { icon: runnerIcon }).addTo(map);

    // Auto-fit if route coordinates exist
    if (userCoords.length >= 2) {
      map.fitBounds(userPolyline.getBounds(), { padding: [25, 25], maxZoom: 17 });
    } else if (ghostCoords.length >= 2) {
      map.fitBounds(ghostPolyline.getBounds(), { padding: [25, 25], maxZoom: 17 });
    }

    // Remote Control Messages from React Native
    window.updatePosition = function(lat, lng, follow) {
      runnerMarker.setLatLng([lat, lng]);
      if (follow) {
        map.panTo([lat, lng], { animate: true, duration: 0.5 });
      }
    };

    window.updateRoute = function(newCoords, follow) {
      userPolyline.setLatLngs(newCoords);
      if (newCoords.length > 0) {
        var last = newCoords[newCoords.length - 1];
        runnerMarker.setLatLng(last);
        if (follow) {
          map.panTo(last, { animate: true, duration: 0.5 });
        }
      }
    };

    window.fitRouteBounds = function() {
      if (userCoords.length >= 2) {
        map.fitBounds(userPolyline.getBounds(), { padding: [25, 25], maxZoom: 17 });
      }
    };

    window.recenterMap = function(lat, lng) {
      map.setView([lat, lng], 16, { animate: true });
    };

    var ghostMarker = null;
    window.updateGhostPosition = function(lat, lng, name) {
      if (!lat || !lng) {
        if (ghostMarker) {
          map.removeLayer(ghostMarker);
          ghostMarker = null;
        }
        return;
      }
      if (!ghostMarker) {
        var gIcon = L.divIcon({
          className: '',
          html: '<div class="ghost-blob-pulse"><div class="ghost-blob-core"></div><div class="ghost-avatar-name">' + (name || 'GHOST') + '</div></div>',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        ghostMarker = L.marker([lat, lng], { icon: gIcon, zIndexOffset: 500 }).addTo(map);
      } else {
        ghostMarker.setLatLng([lat, lng]);
      }
    };
  </script>
</body>
</html>
  `;
}

export interface ActivityMapRef {
  recenter: () => void;
  toggleEngine: () => void;
}

export const ActivityMap = React.forwardRef<ActivityMapRef, ActivityMapProps>(({
  coordinates = [],
  ghostCoordinates = [],
  ghostCurrentCoordinate,
  ghostOpponentName = 'GHOST',
  currentLocation,
  gpsQuality = 'GOOD',
  interactive = true,
  followUser = true,
  showControls = true,
  showStartFinishPins = true,
  bottomOffset,
  style,
}, ref) => {
  const { colors, isDark } = useTheme();
  const webViewRef = useRef<WebView | null>(null);
  const mapRef = useRef<MapView | null>(null);

  // Engine mode: 'GOOGLE' (Native Maps SDK) vs 'UNIVERSAL' (OSM Dark Tiles, fallback)
  const [mapEngine, setMapEngine] = useState<'UNIVERSAL' | 'GOOGLE'>('GOOGLE');

  const [deviceLocation, setDeviceLocation] = useState<{ latitude: number; longitude: number } | null>(
    currentLocation || null
  );

  // Fetch initial position if coordinates are empty
  useEffect(() => {
    let isMounted = true;
    if (coordinates.length === 0 && !currentLocation) {
      (async () => {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status === 'granted') {
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            if (isMounted) {
              setDeviceLocation({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              });
            }
          }
        } catch (e) {
          // Fallback to default
        }
      })();
    }
    return () => {
      isMounted = false;
    };
  }, [coordinates.length, currentLocation]);

  const activePosition = useMemo(() => {
    if (coordinates.length > 0) {
      return coordinates[coordinates.length - 1];
    }
    if (currentLocation) return currentLocation;
    if (deviceLocation) return deviceLocation;
    return { latitude: 37.7749, longitude: -122.4194 }; // Default
  }, [coordinates, currentLocation, deviceLocation]);

  const computedRegion: Region = useMemo(() => {
    const targetCoords =
      coordinates.length >= 2
        ? coordinates
        : ghostCoordinates.length >= 2
        ? ghostCoordinates
        : [];

    if (targetCoords.length >= 2) {
      const lats = targetCoords.map((c) => c.latitude);
      const lngs = targetCoords.map((c) => c.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.005),
        longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.005),
      };
    }

    return {
      latitude: activePosition.latitude,
      longitude: activePosition.longitude,
      latitudeDelta: 0.006,
      longitudeDelta: 0.006,
    };
  }, [coordinates, ghostCoordinates, activePosition]);

  // Auto-pan / animate Google Map when region changes
  useEffect(() => {
    if (mapEngine === 'GOOGLE' && mapRef.current) {
      mapRef.current.animateToRegion(computedRegion, 600);
    }
  }, [computedRegion, mapEngine]);

  // Push live updates to Universal Map without refreshing HTML
  useEffect(() => {
    if (mapEngine === 'UNIVERSAL' && webViewRef.current) {
      if (coordinates.length > 0) {
        const jsCoords = JSON.stringify(coordinates.map((c) => [c.latitude, c.longitude]));
        webViewRef.current.injectJavaScript(`
          if (window.updateRoute) {
            window.updateRoute(${jsCoords}, ${followUser});
          }
          true;
        `);
      } else if (activePosition) {
        webViewRef.current.injectJavaScript(`
          if (window.updatePosition) {
            window.updatePosition(${activePosition.latitude}, ${activePosition.longitude}, ${followUser});
          }
          true;
        `);
      }
    }
  }, [coordinates, activePosition, followUser, mapEngine]);

  // Push live ghost position updates to Leaflet map
  useEffect(() => {
    if (mapEngine === 'UNIVERSAL' && webViewRef.current) {
      if (ghostCurrentCoordinate) {
        webViewRef.current.injectJavaScript(`
          if (window.updateGhostPosition) {
            window.updateGhostPosition(${ghostCurrentCoordinate.latitude}, ${ghostCurrentCoordinate.longitude}, ${JSON.stringify(ghostOpponentName || 'GHOST')});
          }
          true;
        `);
      } else {
        webViewRef.current.injectJavaScript(`
          if (window.updateGhostPosition) {
            window.updateGhostPosition(null, null);
          }
          true;
        `);
      }
    }
  }, [ghostCurrentCoordinate, ghostOpponentName, mapEngine]);

  // Recenter handler
  const handleRecenter = () => {
    if (mapEngine === 'UNIVERSAL' && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.recenterMap) {
          window.recenterMap(${activePosition.latitude}, ${activePosition.longitude});
        }
        true;
      `);
    } else if (mapEngine === 'GOOGLE' && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: activePosition.latitude,
          longitude: activePosition.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        400
      );
    }
  };

  const toggleEngine = () => {
    setMapEngine((prev) => (prev === 'UNIVERSAL' ? 'GOOGLE' : 'UNIVERSAL'));
  };

  useImperativeHandle(
    ref,
    () => ({
      recenter: handleRecenter,
      toggleEngine,
    }),
    [handleRecenter]
  );

  const getQualityColor = () => {
    switch (gpsQuality) {
      case 'EXCELLENT':
      case 'GOOD':
        return colors.accent;
      case 'WEAK':
        return colors.warning;
      case 'NONE':
      default:
        return colors.danger;
    }
  };

  // High-performance SVG fallback if needed
  const renderSvgFallback = () => {
    if (coordinates.length < 2) {
      return (
        <View style={styles.fallbackEmpty}>
          <Text style={[styles.fallbackText, { color: colors.textMuted }]}>Acquiring GPS Telemetry...</Text>
        </View>
      );
    }

    const lats = coordinates.map((c) => c.latitude);
    const lngs = coordinates.map((c) => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latSpan = maxLat - minLat || 0.001;
    const lngSpan = maxLng - minLng || 0.001;

    const width = 320;
    const height = 200;
    const padding = 20;

    const pointsString = coordinates
      .map((c) => {
        const x = padding + ((c.longitude - minLng) / lngSpan) * (width - 2 * padding);
        const y = height - padding - ((c.latitude - minLat) / latSpan) * (height - 2 * padding);
        return `${x},${y}`;
      })
      .join(' ');

    const lastCoord = coordinates[coordinates.length - 1];
    const currX = padding + ((lastCoord.longitude - minLng) / lngSpan) * (width - 2 * padding);
    const currY = height - padding - ((lastCoord.latitude - minLat) / latSpan) * (height - 2 * padding);

    return (
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={styles.svg}>
        <SvgPolyline
          points={pointsString}
          fill="none"
          stroke={colors.accent}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <SvgCircle cx={currX} cy={currY} r={10} fill={isDark ? 'rgba(204, 255, 0, 0.3)' : 'rgba(0, 82, 255, 0.25)'} />
        <SvgCircle cx={currX} cy={currY} r={5} fill={colors.accent} stroke="#FFFFFF" strokeWidth={1.5} />
      </Svg>
    );
  };

  const initialLeafletHtml = useMemo(() => {
    return buildLeafletHtml(
      activePosition.latitude,
      activePosition.longitude,
      isDark,
      interactive,
      coordinates,
      ghostCoordinates
    );
  }, [isDark, interactive]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#08080A' : '#F1F5F9',
          borderColor: colors.surfaceBorder,
        },
        style,
      ]}
    >
      <MapErrorBoundary fallback={<View style={styles.mapInner}>{renderSvgFallback()}</View>}>
        {mapEngine === 'UNIVERSAL' ? (
          <WebView
            ref={webViewRef}
            style={styles.mapInner}
            originWhitelist={['*']}
            source={{ html: initialLeafletHtml }}
            scrollEnabled={interactive}
            overScrollMode="never"
            bounces={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            cacheEnabled={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <MapView
            ref={mapRef}
            style={styles.mapInner}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={computedRegion}
            customMapStyle={isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
            scrollEnabled={interactive}
            zoomEnabled={interactive}
            pitchEnabled={interactive}
            rotateEnabled={interactive}
            showsCompass={false}
            showsMyLocationButton={false}
            showsUserLocation={true}
            showsScale={false}
            toolbarEnabled={false}
            loadingEnabled={true}
            loadingBackgroundColor={isDark ? '#000000' : '#F8FAFC'}
            loadingIndicatorColor={colors.accent}
          >
            {coordinates.length > 1 && (
              <Polyline
                coordinates={coordinates}
                strokeColor={colors.accent}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
                zIndex={10}
              />
            )}
            {ghostCoordinates.length > 1 && (
              <Polyline
                coordinates={ghostCoordinates}
                strokeColor="#A855F7"
                strokeWidth={4}
                lineDashPattern={[6, 4]}
                lineCap="round"
                zIndex={5}
              />
            )}
            {ghostCurrentCoordinate && ghostOpponentName && (
              <Marker
                coordinate={ghostCurrentCoordinate}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={19}
              >
                <View style={styles.ghostMarkerWrapper}>
                  <View style={styles.ghostPulseRing} />
                  <View style={styles.ghostMarkerCore} />
                  <View style={styles.ghostNameBadge}>
                    <Text style={styles.ghostNameBadgeText}>{ghostOpponentName}</Text>
                  </View>
                </View>
              </Marker>
            )}
          </MapView>
        )}
      </MapErrorBoundary>

      {/* Floating GPS Quality Badge */}
      <View
        style={[
          styles.gpsBadge,
          {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <View style={[styles.gpsDot, { backgroundColor: getQualityColor() }]} />
        <Text style={[styles.gpsText, { color: colors.textSecondary }]}>GPS {gpsQuality}</Text>
      </View>

      {/* Engine Switcher & Recenter Controls */}
      {showControls && (
        <View style={[styles.controlsRow, bottomOffset !== undefined ? { bottom: bottomOffset } : null]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleEngine}
            style={[
              styles.controlBtn,
              {
                backgroundColor: isDark ? 'rgba(13, 13, 16, 0.90)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <Layers size={14} color={mapEngine === 'UNIVERSAL' ? colors.accent : colors.textMuted} />
            <Text
              style={[
                styles.engineText,
                { color: mapEngine === 'UNIVERSAL' ? colors.accent : colors.textMuted },
              ]}
            >
              {mapEngine === 'UNIVERSAL' ? 'TILES' : 'GOOGLE'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRecenter}
            style={[
              styles.recenterBtn,
              {
                backgroundColor: isDark ? 'rgba(13, 13, 16, 0.90)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <Locate size={16} color={colors.accent} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  mapInner: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  svg: {
    width: '100%',
    height: '100%',
  },
  fallbackEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  liveMarkerWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  markerCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  gpsBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    zIndex: 30,
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gpsText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  controlsRow: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 30,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  engineText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  recenterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  ghostMarkerWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostPulseRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#A855F7',
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
  },
  ghostMarkerCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#A855F7',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  ghostNameBadge: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: 'rgba(13, 13, 16, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  ghostNameBadgeText: {
    color: '#D8B4FE',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  userLocationDot: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
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
    shadowColor: '#0082FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
});
