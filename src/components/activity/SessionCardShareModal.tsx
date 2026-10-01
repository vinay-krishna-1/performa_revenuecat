import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  TextInput,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline as SvgPolyline } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import {
  Share2,
  X,
  Check,
  Download,
} from 'lucide-react-native';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { ActivitySummary } from '../../types';
import { useAuth } from '../../features/auth/AuthContext';

interface SessionCardShareModalProps {
  visible: boolean;
  onClose: () => void;
  activity: ActivitySummary;
}

type CardThemeId = 'obsidian' | 'crimson' | 'cobalt' | 'minimal';

interface CardThemeConfig {
  id: CardThemeId;
  name: string;
  bg: string;
  cardBg: string;
  borderColor: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  gridLine: string;
}

const THEMES: Record<CardThemeId, CardThemeConfig> = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Volt',
    bg: '#08080A',
    cardBg: '#111116',
    borderColor: 'rgba(204, 255, 0, 0.35)',
    accent: '#CCFF00',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    gridLine: 'rgba(255, 255, 255, 0.06)',
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Nitro',
    bg: '#0F0508',
    cardBg: '#1A0B10',
    borderColor: 'rgba(255, 59, 75, 0.4)',
    accent: '#FF3B4B',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    gridLine: 'rgba(255, 59, 75, 0.08)',
  },
  cobalt: {
    id: 'cobalt',
    name: 'Cobalt Neon',
    bg: '#040B17',
    cardBg: '#09152C',
    borderColor: 'rgba(0, 240, 255, 0.4)',
    accent: '#00F0FF',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    gridLine: 'rgba(0, 240, 255, 0.08)',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal Chalk',
    bg: '#F8F9FA',
    cardBg: '#FFFFFF',
    borderColor: '#E2E8F0',
    accent: '#0F172A',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    gridLine: '#F1F5F9',
  },
};

const PRESET_MOTTOS = [
  'Consistency is the superpower.',
  'Earned, not given.',
  'Season 0 Genesis PR locked.',
  'Chasing the Zenith 100.',
  'Miles into memories.',
];

function buildCardCanvasHtml({
  theme,
  athleteName,
  sport,
  dateStr,
  distanceKm,
  durationStr,
  paceStr,
  elevationStr,
  xpStr,
  motto,
  divisionStr,
  showTier,
  showSeason,
  showPace,
  showElevation,
  showHeartRate,
  showSilhouette,
  coordinates,
}: {
  theme: CardThemeConfig;
  athleteName: string;
  sport: string;
  dateStr: string;
  distanceKm: string;
  durationStr: string;
  paceStr: string;
  elevationStr: string;
  xpStr: string;
  motto: string;
  divisionStr: string;
  showTier: boolean;
  showSeason: boolean;
  showPace: boolean;
  showElevation: boolean;
  showHeartRate: boolean;
  showSilhouette: boolean;
  coordinates: { latitude: number; longitude: number }[];
}) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { margin: 0; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    canvas { width: 100%; height: auto; }
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <script>
    try {
      var athleteName = ${JSON.stringify(athleteName)};
      var sport = ${JSON.stringify(sport)};
      var dateStr = ${JSON.stringify(dateStr)};
      var distanceKm = ${JSON.stringify(distanceKm)};
      var durationStr = ${JSON.stringify(durationStr)};
      var paceStr = ${JSON.stringify(paceStr)};
      var elevationStr = ${JSON.stringify(elevationStr)};
      var xpStr = ${JSON.stringify(xpStr)};
      var motto = ${JSON.stringify(motto)};
      var badgeText = ${JSON.stringify(divisionStr)};
      var showTier = ${JSON.stringify(showTier)};
      var showSeason = ${JSON.stringify(showSeason)};
      var showPace = ${JSON.stringify(showPace)};
      var showElevation = ${JSON.stringify(showElevation)};
      var showHeartRate = ${JSON.stringify(showHeartRate)};
      var showSilhouette = ${JSON.stringify(showSilhouette)};
      var rawCoords = ${JSON.stringify(coordinates)};

      var canvas = document.getElementById('c');
      var ctx = canvas.getContext('2d');
      var W = 1080;

      var hasRoute = showSilhouette && rawCoords && rawCoords.length >= 2;
      var boxH = hasRoute ? 240 : 0;

      // 1. Dynamic Height Calculation to match preview card proportions 1:1
      var margin = 40;
      var innerPad = 20;
      var cardW = W - margin * 2;
      var innerW = cardW - innerPad * 2;
      var innerX = margin + innerPad;

      var headerH = 46;
      var athleteH = 80;
      var distH = 115;
      var routeH = hasRoute ? (boxH + 32) : 10;
      var metricsH = 120;
      var mottoH = 45;
      var footerH = 35;
      var bottomPad = 25;

      var innerH = headerH + 28 + athleteH + 28 + distH + routeH + metricsH + 28 + mottoH + 24 + footerH + bottomPad;
      var cardH = innerH + innerPad * 2;
      var H = cardH + margin * 2;

      canvas.width = W;
      canvas.height = H;

      // 2. Clean Canvas Base (Deep black background)
      ctx.fillStyle = '#05070A';
      ctx.fillRect(0, 0, W, H);

      // 3. Outer Card Container (Matches styles.cardPreviewContainer)
      var cardX = margin;
      var cardY = margin;
      var cardRadius = 32;

      ctx.fillStyle = '${theme.bg}';
      ctx.strokeStyle = '${theme.borderColor}';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
      } else {
        ctx.rect(cardX, cardY, cardW, cardH);
      }
      ctx.fill();
      ctx.stroke();

      // 4. Inner Card Box (Matches styles.cardInnerBox)
      var innerY = cardY + innerPad;
      var innerRadius = 24;

      ctx.fillStyle = '${theme.cardBg}';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(innerX, innerY, innerW, innerH, innerRadius);
      } else {
        ctx.rect(innerX, innerY, innerW, innerH);
      }
      ctx.fill();

      // 5. Brand Header Row
      var curY = innerY + 36;
      // Flame Dot
      ctx.fillStyle = '${theme.accent}';
      ctx.beginPath();
      ctx.arc(innerX + 32, curY - 9, 8, 0, Math.PI * 2);
      ctx.fill();

      // PERFORMA text
      ctx.font = '900 28px sans-serif';
      ctx.fillStyle = '${theme.textPrimary}';
      ctx.textAlign = 'left';
      ctx.fillText('PERFORMA', innerX + 50, curY);
      var perfW = ctx.measureText('PERFORMA').width;

      // Season Tag
      if (showSeason) {
        ctx.font = '800 20px sans-serif';
        ctx.fillStyle = '${theme.textMuted}';
        ctx.fillText('// S00: GENESIS', innerX + 50 + perfW + 14, curY - 1);
      }

      // Tier / Mode Badge Pill (Right Aligned)
      if (showTier && badgeText) {
        ctx.font = '800 19px sans-serif';
        var isRankedCanvas = badgeText.indexOf('RANKED') !== -1;
        var badgeW = ctx.measureText(badgeText).width + 32;
        var badgeX = innerX + innerW - 32 - badgeW;
        ctx.strokeStyle = isRankedCanvas ? '${theme.accent}' : '${theme.borderColor}';
        ctx.lineWidth = 2;
        ctx.fillStyle = isRankedCanvas ? 'rgba(204, 255, 0, 0.12)' : 'rgba(255, 255, 255, 0.06)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(badgeX, curY - 26, badgeW, 34, 17);
        } else {
          ctx.rect(badgeX, curY - 26, badgeW, 34);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isRankedCanvas ? '${theme.accent}' : '${theme.textSecondary}';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, badgeX + badgeW / 2, curY - 2);
        ctx.textAlign = 'left';
      }

      // 6. Athlete Info
      curY += 60;
      ctx.font = '900 48px sans-serif';
      ctx.fillStyle = '${theme.textPrimary}';
      ctx.fillText(athleteName, innerX + 32, curY);

      curY += 36;
      ctx.font = '800 24px sans-serif';
      ctx.fillStyle = '${theme.accent}';
      ctx.fillText(sport + ' • ' + dateStr, innerX + 32, curY);

      // 7. Hero Distance Row (Distance + KILOMETERS on same horizontal baseline)
      curY += 95;
      ctx.font = '900 116px sans-serif';
      ctx.fillStyle = '${theme.accent}';
      ctx.shadowBlur = 0;
      ctx.fillText(distanceKm, innerX + 32, curY);
      var distWidth = ctx.measureText(distanceKm).width;

      ctx.font = '900 28px sans-serif';
      ctx.fillStyle = '${theme.textPrimary}';
      ctx.fillText('KILOMETERS', innerX + 32 + distWidth + 20, curY - 8);

      // 8. Route Silhouette (Clean, prominent line with rounded joints)
      if (hasRoute) {
        curY += 35;
        var boxX = innerX + 32;
        var boxY = curY;
        var routeBoxW = innerW - 64;

        var minLat = 999, maxLat = -999, minLng = 999, maxLng = -999;
        for (var i = 0; i < rawCoords.length; i++) {
          if (rawCoords[i].latitude < minLat) minLat = rawCoords[i].latitude;
          if (rawCoords[i].latitude > maxLat) maxLat = rawCoords[i].latitude;
          if (rawCoords[i].longitude < minLng) minLng = rawCoords[i].longitude;
          if (rawCoords[i].longitude > maxLng) maxLng = rawCoords[i].longitude;
        }

        var dLat = (maxLat - minLat) || 0.0001;
        var dLng = (maxLng - minLng) || 0.0001;
        var midLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180);
        var spanY = dLat * 111320;
        var spanX = dLng * 111320 * Math.cos(midLatRad);
        
        var aspect = spanX / (spanY || 1);
        if (aspect > 3.0) spanY = spanX / 3.0;
        if (aspect < 0.33) spanX = spanY * 0.33;

        var padding = 20;
        var drawW = routeBoxW - padding * 2;
        var drawH = boxH - padding * 2;
        var scale = Math.min(drawW / spanX, drawH / spanY);
        var fittedW = spanX * scale;
        var fittedH = spanY * scale;
        var startX = boxX + padding + (drawW - fittedW) / 2;
        var startY = boxY + padding + (drawH - fittedH) / 2;

        ctx.strokeStyle = '${theme.accent}';
        ctx.lineWidth = 5.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        for (var j = 0; j < rawCoords.length; j++) {
          var rx = (rawCoords[j].longitude - minLng) * 111320 * Math.cos(midLatRad);
          var ry = (rawCoords[j].latitude - minLat) * 111320;
          var px = startX + rx * scale;
          var py = startY + fittedH - (ry * scale);
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        curY += boxH + 30;
      } else {
        curY += 30;
      }

      // 9. Metric Matrix Bar (Matches styles.cardMetricsGrid)
      ctx.strokeStyle = '${theme.gridLine}';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(innerX + 24, curY);
      ctx.lineTo(innerX + innerW - 24, curY);
      ctx.stroke();

      var metrics = [{ val: durationStr, label: 'TIME', isAccent: false }];
      if (showPace) metrics.push({ val: paceStr, label: 'AVG PACE /KM', isAccent: false });
      if (showElevation) metrics.push({ val: elevationStr, label: 'ELEV GAIN', isAccent: false });
      if (showHeartRate) metrics.push({ val: xpStr, label: 'SEASON XP', isAccent: true });

      var colW = (innerW - 48) / metrics.length;
      for (var m = 0; m < metrics.length; m++) {
        var mx = innerX + 24 + m * colW + colW / 2;
        ctx.textAlign = 'center';
        ctx.font = '900 38px sans-serif';
        ctx.fillStyle = metrics[m].isAccent ? '${theme.accent}' : '${theme.textPrimary}';
        ctx.fillText(metrics[m].val, mx, curY + 52);

        ctx.font = '800 18px sans-serif';
        ctx.fillStyle = '${theme.textMuted}';
        ctx.fillText(metrics[m].label, mx, curY + 88);
      }

      ctx.beginPath();
      ctx.moveTo(innerX + 24, curY + 116);
      ctx.lineTo(innerX + innerW - 24, curY + 116);
      ctx.stroke();

      // 10. Motto Quote
      curY += 165;
      ctx.textAlign = 'center';
      ctx.font = 'italic 700 28px sans-serif';
      ctx.fillStyle = '${theme.textSecondary}';
      ctx.fillText('"' + motto + '"', W / 2, curY);

      // 11. Footer Signature
      curY += 56;
      ctx.font = '800 18px sans-serif';
      ctx.fillStyle = '${theme.textMuted}';
      ctx.fillText('PERFORMA ATHLETIC TELEMETRY // performa.app', W / 2, curY);

      setTimeout(function() {
        var dataUrl = canvas.toDataURL('image/png');
        window.ReactNativeWebView.postMessage(dataUrl);
      }, 50);
    } catch(err) {
      window.ReactNativeWebView.postMessage('ERROR:' + err.message);
    }
  </script>
</body>
</html>`;
}

export function SessionCardShareModal({ visible, onClose, activity }: SessionCardShareModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [selectedTheme, setSelectedTheme] = useState<CardThemeId>('obsidian');
  const [selectedMotto, setSelectedMotto] = useState(PRESET_MOTTOS[0]);
  const [customMotto, setCustomMotto] = useState('');

  // Customization Toggles
  const [showTier, setShowTier] = useState(true);
  const [showSeason, setShowSeason] = useState(true);
  const [showPace, setShowPace] = useState(true);
  const [showElevation, setShowElevation] = useState(true);
  const [showHeartRate, setShowHeartRate] = useState(true);
  const [showSilhouette, setShowSilhouette] = useState(true);

  // PNG Export State
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportMode, setExportMode] = useState<'DOWNLOAD' | 'SHARE'>('DOWNLOAD');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('PNG Ready!');

  const themeConfig = THEMES[selectedTheme];

  const formatPace = (paceSec: number) => {
    if (!paceSec || paceSec <= 0) return "--:--";
    const m = Math.floor(paceSec / 60);
    const s = Math.round(paceSec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatDuration = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    const h = Math.floor(m / 60);
    if (h > 0) {
      const remM = m % 60;
      return `${h}h ${remM}m`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeMotto = customMotto.trim() || selectedMotto;
  const athleteName = user?.displayName || user?.username || 'Performa Athlete';
  const distanceKm = (activity.distanceMeters / 1000).toFixed(2);
  const durationStr = formatDuration(activity.movingSeconds);
  const paceStr = formatPace(activity.avgPaceSecondsPerKm);
  const elevationStr = `+${activity.elevationGainMeters}m`;
  const xpStr = `+${activity.xpEarned} XP`;
  const isRanked = activity.recordingMode ? activity.recordingMode === 'RANKED' : (activity.prEarned > 0);
  const badgeText = isRanked ? '⚡ RANKED • NON-STOP' : '☕ CASUAL';
  const divisionStr = badgeText;
  const dateStr = new Date(activity.startTime).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  // Normalize route coordinates to fit a 280x90 SVG box
  const normalizedSvgPoints = useMemo(() => {
    const coords = activity.routeCoordinates;
    if (!coords || coords.length < 2) return '';

    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;

    for (const c of coords) {
      if (c.latitude < minLat) minLat = c.latitude;
      if (c.latitude > maxLat) maxLat = c.latitude;
      if (c.longitude < minLng) minLng = c.longitude;
      if (c.longitude > maxLng) maxLng = c.longitude;
    }

    const latDelta = maxLat - minLat || 0.001;
    const lngDelta = maxLng - minLng || 0.001;

    const width = 260;
    const height = 75;
    const padding = 10;

    return coords
      .map((c) => {
        const x = padding + ((c.longitude - minLng) / lngDelta) * (width - padding * 2);
        const y = height - padding - ((c.latitude - minLat) / latDelta) * (height - padding * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [activity.routeCoordinates]);

  // Handle PNG capture message from Canvas WebView
  const handleCanvasMessage = async (msg: string) => {
    if (msg.startsWith('ERROR:')) {
      console.warn('[SessionCard] Canvas error:', msg);
      setIsExportingPng(false);
      Alert.alert('Export Failed', 'Could not render high-resolution PNG.');
      return;
    }

    try {
      const base64Data = msg.replace(/^data:image\/png;base64,/, '');
      const filename = `Performa_${activity.type}_${Date.now()}`;
      const cacheUri = `${FileSystem.cacheDirectory}${filename}.png`;

      // 1. Write binary base64 directly to cache directory using native engine
      await FileSystem.writeAsStringAsync(cacheUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (exportMode === 'DOWNLOAD') {
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') {
            await MediaLibrary.createAssetAsync(cacheUri);
            setToastMessage('✓ Performance Card Saved to Gallery!');
            setDownloadSuccessToast(true);
            setTimeout(() => setDownloadSuccessToast(false), 3500);
            return;
          }
        } catch (mediaErr) {
          console.warn('[SessionCard] MediaLibrary save error, falling back to Sharing:', mediaErr);
        }

        // Fallback: system sharing sheet
        if (await Sharing.isAvailableAsync()) {
          setToastMessage('Saving Performance Card...');
          setDownloadSuccessToast(true);
          setTimeout(() => setDownloadSuccessToast(false), 3000);
          await Sharing.shareAsync(cacheUri, {
            mimeType: 'image/png',
            dialogTitle: 'Save Performance Card',
            UTI: 'public.png',
          });
        } else {
          Alert.alert('Download Complete', 'Card saved to application cache.');
        }
      } else {
        // SHARE MODE
        if (await Sharing.isAvailableAsync()) {
          setToastMessage('Opening Share Sheet...');
          setDownloadSuccessToast(true);
          setTimeout(() => setDownloadSuccessToast(false), 3000);
          await Sharing.shareAsync(cacheUri, {
            mimeType: 'image/png',
            dialogTitle: 'Share Athletic Performance Card',
            UTI: 'public.png',
          });
        } else {
          await Share.share({
            message: `⚡ ${athleteName} logged ${distanceKm} km on Performa!\n"${activeMotto}"\n\nSeason 0: Genesis Horizon // performa.app`,
          });
        }
      }
    } catch (err) {
      console.warn('[SessionCard] File export error:', err);
      Alert.alert('Export Error', 'Failed to generate and save performance card.');
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleNativeTextShare = async () => {
    const shareMessage = `⚡ ${athleteName} logged ${distanceKm} km on Performa!\n⏱️ Duration: ${durationStr} | Pace: ${paceStr} /km | Elev: ${elevationStr}\n"${activeMotto}"\n\nSeason 0: Genesis Horizon // performa.app`;

    try {
      await Share.share({
        message: shareMessage,
        title: `${distanceKm}km ${activity.type} Performance Card`,
      });
    } catch (err) {
      console.warn('[ShareModal] Share error:', err);
    }
  };

  const canvasHtml = useMemo(() => {
    if (!isExportingPng) return '';
    return buildCardCanvasHtml({
      theme: themeConfig,
      athleteName,
      sport: activity.type,
      dateStr,
      distanceKm,
      durationStr,
      paceStr,
      elevationStr,
      xpStr,
      motto: activeMotto,
      divisionStr,
      showTier,
      showSeason,
      showPace,
      showElevation,
      showHeartRate,
      showSilhouette,
      coordinates: activity.routeCoordinates || [],
    });
  }, [
    isExportingPng,
    themeConfig,
    athleteName,
    activity,
    dateStr,
    distanceKm,
    durationStr,
    paceStr,
    elevationStr,
    xpStr,
    activeMotto,
    divisionStr,
    showTier,
    showSeason,
    showPace,
    showElevation,
    showHeartRate,
    showSilhouette,
  ]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }]}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#0D0D12' : '#FFFFFF',
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.modalKicker, { color: colors.accent }]}>PERFORMA PERFORMANCE BADGE</Text>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Athletic Performance Card</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { borderColor: colors.surfaceBorder }]}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* THE ATHLETIC PERFORMANCE CARD (LIVE PREVIEW) */}
            <View
              style={[
                styles.cardPreviewContainer,
                {
                  backgroundColor: themeConfig.bg,
                  borderColor: themeConfig.borderColor,
                },
              ]}
            >
              {/* Inner Card Frame */}
              <View style={[styles.cardInnerBox, { backgroundColor: themeConfig.cardBg }]}>
                {/* Brand Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.cardFlameDot, { backgroundColor: themeConfig.accent }]} />
                    <Text style={[styles.cardBrandText, { color: themeConfig.textPrimary }]}>
                      PERFORMA
                    </Text>
                    {showSeason && (
                      <Text style={[styles.cardSeasonTag, { color: themeConfig.textMuted }]}>
                        // S00: GENESIS
                      </Text>
                    )}
                  </View>
                  {showTier && (
                    <View
                      style={[
                        styles.cardTierBadge,
                        {
                          borderColor: isRanked ? themeConfig.accent : themeConfig.borderColor,
                          backgroundColor: isRanked ? 'rgba(204, 255, 0, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.cardTierText,
                          {
                            color: isRanked ? themeConfig.accent : themeConfig.textSecondary,
                            fontWeight: '900',
                          },
                        ]}
                      >
                        {divisionStr}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Athlete Identity Row */}
                <View style={styles.cardAthleteRow}>
                  <Text style={[styles.cardAthleteName, { color: themeConfig.textPrimary }]}>
                    {athleteName}
                  </Text>
                  <Text style={[styles.cardAthleteSport, { color: themeConfig.accent }]}>
                    {activity.type} • {dateStr}
                  </Text>
                </View>

                {/* Hero Distance */}
                <View style={styles.cardHeroDistanceRow}>
                  <Text style={[styles.cardHeroDistNum, { color: themeConfig.accent }]}>
                    {distanceKm}
                  </Text>
                  <Text style={[styles.cardHeroDistUnit, { color: themeConfig.textPrimary }]}>
                    KILOMETERS
                  </Text>
                </View>

                {/* Map Silhouette Polyline (if enabled & available) */}
                {showSilhouette && normalizedSvgPoints ? (
                  <View style={styles.cardSilhouetteBox}>
                    <Svg width="100%" height={80} viewBox="0 0 280 80">
                      <SvgPolyline
                        points={normalizedSvgPoints}
                        fill="none"
                        stroke={themeConfig.accent}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                ) : null}

                {/* Metric Matrix Row */}
                <View
                  style={[
                    styles.cardMetricsGrid,
                    { borderTopColor: themeConfig.gridLine, borderBottomColor: themeConfig.gridLine },
                  ]}
                >
                  <View style={styles.cardMetricItem}>
                    <Text style={[styles.cardMetricVal, { color: themeConfig.textPrimary }]}>
                      {durationStr}
                    </Text>
                    <Text style={[styles.cardMetricLabel, { color: themeConfig.textMuted }]}>
                      TIME
                    </Text>
                  </View>

                  {showPace && (
                    <View style={styles.cardMetricItem}>
                      <Text style={[styles.cardMetricVal, { color: themeConfig.textPrimary }]}>
                        {paceStr}
                      </Text>
                      <Text style={[styles.cardMetricLabel, { color: themeConfig.textMuted }]}>
                        AVG PACE /KM
                      </Text>
                    </View>
                  )}

                  {showElevation && (
                    <View style={styles.cardMetricItem}>
                      <Text style={[styles.cardMetricVal, { color: themeConfig.textPrimary }]}>
                        {elevationStr}
                      </Text>
                      <Text style={[styles.cardMetricLabel, { color: themeConfig.textMuted }]}>
                        ELEV GAIN
                      </Text>
                    </View>
                  )}

                  {showHeartRate && (
                    <View style={styles.cardMetricItem}>
                      <Text style={[styles.cardMetricVal, { color: themeConfig.accent }]}>
                        {xpStr}
                      </Text>
                      <Text style={[styles.cardMetricLabel, { color: themeConfig.textMuted }]}>
                        SEASON XP
                      </Text>
                    </View>
                  )}
                </View>

                {/* Athlete Motto Quote */}
                <View style={styles.cardMottoBox}>
                  <Text style={[styles.cardMottoText, { color: themeConfig.textSecondary }]}>
                    "{activeMotto}"
                  </Text>
                </View>

                {/* Card Watermark Signature */}
                <View style={styles.cardFooterRow}>
                  <Text style={[styles.cardFooterText, { color: themeConfig.textMuted }]}>
                    PERFORMA ATHLETIC TELEMETRY // performa.app
                  </Text>
                </View>
              </View>
            </View>

            {/* CUSTOMIZATION CONTROLS */}
            <View style={styles.controlsSection}>
              {/* 1. Theme Selector */}
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SELECT VISUAL THEME</Text>
              <View style={styles.themesRow}>
                {(Object.keys(THEMES) as CardThemeId[]).map((themeKey) => {
                  const t = THEMES[themeKey];
                  const isSelected = selectedTheme === themeKey;
                  return (
                    <TouchableOpacity
                      key={themeKey}
                      activeOpacity={0.8}
                      onPress={() => setSelectedTheme(themeKey)}
                      style={[
                        styles.themeChip,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(204, 255, 0, 0.14)'
                              : 'rgba(0, 82, 255, 0.12)'
                            : isDark
                            ? '#141A22'
                            : '#F1F5F9',
                          borderColor: isSelected ? colors.accent : colors.surfaceBorder,
                        },
                      ]}
                    >
                      <View style={[styles.themeColorDot, { backgroundColor: t.accent }]} />
                      <Text
                        style={[
                          styles.themeChipText,
                          {
                            color: isSelected ? colors.textPrimary : colors.textMuted,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {t.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2. Metadata & Privacy Toggles */}
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                DISPLAY & METADATA TOGGLES
              </Text>
              <View style={styles.togglesRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowTier(!showTier)}
                  style={[
                    styles.togglePill,
                    {
                      backgroundColor: showTier
                        ? isDark
                          ? 'rgba(204, 255, 0, 0.12)'
                          : 'rgba(0, 82, 255, 0.12)'
                        : isDark
                        ? '#141A22'
                        : '#F1F5F9',
                      borderColor: showTier ? colors.accent : colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text style={[styles.toggleText, { color: showTier ? colors.textPrimary : colors.textMuted }]}>
                    {showTier ? '✓ Division / Tier' : '+ Division / Tier'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowSeason(!showSeason)}
                  style={[
                    styles.togglePill,
                    {
                      backgroundColor: showSeason
                        ? isDark
                          ? 'rgba(204, 255, 0, 0.12)'
                          : 'rgba(0, 82, 255, 0.12)'
                        : isDark
                        ? '#141A22'
                        : '#F1F5F9',
                      borderColor: showSeason ? colors.accent : colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text style={[styles.toggleText, { color: showSeason ? colors.textPrimary : colors.textMuted }]}>
                    {showSeason ? '✓ Season 0' : '+ Season 0'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowPace(!showPace)}
                  style={[
                    styles.togglePill,
                    {
                      backgroundColor: showPace
                        ? isDark
                          ? 'rgba(204, 255, 0, 0.12)'
                          : 'rgba(0, 82, 255, 0.12)'
                        : isDark
                        ? '#141A22'
                        : '#F1F5F9',
                      borderColor: showPace ? colors.accent : colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text style={[styles.toggleText, { color: showPace ? colors.textPrimary : colors.textMuted }]}>
                    {showPace ? '✓ Pace' : '+ Pace'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowElevation(!showElevation)}
                  style={[
                    styles.togglePill,
                    {
                      backgroundColor: showElevation
                        ? isDark
                          ? 'rgba(204, 255, 0, 0.12)'
                          : 'rgba(0, 82, 255, 0.12)'
                        : isDark
                        ? '#141A22'
                        : '#F1F5F9',
                      borderColor: showElevation ? colors.accent : colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text style={[styles.toggleText, { color: showElevation ? colors.textPrimary : colors.textMuted }]}>
                    {showElevation ? '✓ Elevation' : '+ Elevation'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowHeartRate(!showHeartRate)}
                  style={[
                    styles.togglePill,
                    {
                      backgroundColor: showHeartRate
                        ? isDark
                          ? 'rgba(204, 255, 0, 0.12)'
                          : 'rgba(0, 82, 255, 0.12)'
                        : isDark
                        ? '#141A22'
                        : '#F1F5F9',
                      borderColor: showHeartRate ? colors.accent : colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text style={[styles.toggleText, { color: showHeartRate ? colors.textPrimary : colors.textMuted }]}>
                    {showHeartRate ? '✓ XP Badge' : '+ XP Badge'}
                  </Text>
                </TouchableOpacity>

                {normalizedSvgPoints ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowSilhouette(!showSilhouette)}
                    style={[
                      styles.togglePill,
                      {
                        backgroundColor: showSilhouette
                          ? isDark
                            ? 'rgba(204, 255, 0, 0.12)'
                            : 'rgba(0, 82, 255, 0.12)'
                          : isDark
                          ? '#141A22'
                          : '#F1F5F9',
                        borderColor: showSilhouette ? colors.accent : colors.surfaceBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.toggleText, { color: showSilhouette ? colors.textPrimary : colors.textMuted }]}>
                      {showSilhouette ? '✓ Route Map' : '+ Route Map'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* 3. Athlete Motto / Custom Statement */}
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ATHLETE MOTTO</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mottoPillsScroll}>
                {PRESET_MOTTOS.map((motto) => {
                  const isSelected = selectedMotto === motto && !customMotto;
                  return (
                    <TouchableOpacity
                      key={motto}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedMotto(motto);
                        setCustomMotto('');
                      }}
                      style={[
                        styles.mottoChip,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(204, 255, 0, 0.14)'
                              : 'rgba(0, 82, 255, 0.12)'
                            : isDark
                            ? '#141A22'
                            : '#F1F5F9',
                          borderColor: isSelected ? colors.accent : colors.surfaceBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.mottoChipText,
                          {
                            color: isSelected ? colors.textPrimary : colors.textMuted,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        "{motto}"
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Custom Quote Input */}
              <TextInput
                placeholder="Or type custom athletic quote..."
                placeholderTextColor={colors.textMuted}
                value={customMotto}
                onChangeText={setCustomMotto}
                maxLength={60}
                style={[
                  styles.customInput,
                  {
                    backgroundColor: isDark ? '#141A22' : '#F8FAFC',
                    borderColor: colors.surfaceBorder,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Premium Export Actions */}
            <View style={styles.actionContainer}>
              {downloadSuccessToast && (
                <View
                  style={[
                    styles.toastPill,
                    {
                      backgroundColor: isDark ? 'rgba(204, 255, 0, 0.14)' : 'rgba(0, 82, 255, 0.12)',
                      borderColor: colors.accent,
                    },
                  ]}
                >
                  <Check size={14} color={colors.accent} strokeWidth={3} />
                  <Text style={[styles.toastText, { color: colors.textPrimary }]}>
                    {toastMessage}
                  </Text>
                </View>
              )}

              {/* Primary Sculpted Hero PNG Download Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isExportingPng}
                onPress={() => {
                  setExportMode('DOWNLOAD');
                  setIsExportingPng(true);
                }}
                style={[
                  styles.downloadHeroBtn,
                  {
                    backgroundColor: colors.accent,
                    shadowColor: colors.accent,
                  },
                ]}
              >
                {isExportingPng && exportMode === 'DOWNLOAD' ? (
                  <View style={styles.btnContentRow}>
                    <ActivityIndicator size="small" color="#000000" />
                    <Text style={[styles.downloadHeroBtnText, { color: '#000000', marginLeft: 8 }]}>
                      GENERATING & SAVING PNG...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.btnContentRow}>
                    <Download size={22} color="#000000" strokeWidth={2.4} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={[styles.downloadHeroBtnText, { color: '#000000' }]}>
                        DOWNLOAD PERFORMANCE CARD
                      </Text>
                      <Text style={styles.downloadHeroBtnSub}>
                        High-Resolution Card PNG • Save to Gallery
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Secondary Actions */}
              <View style={styles.secondaryBtnRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isExportingPng}
                  onPress={() => {
                    setExportMode('SHARE');
                    setIsExportingPng(true);
                  }}
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: isDark ? '#141A22' : '#F1F5F9',
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                >
                  {isExportingPng && exportMode === 'SHARE' ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <>
                      <Share2 size={15} color={colors.accent} />
                      <Text style={[styles.secondaryActionText, { color: colors.textPrimary }]}>
                        Share Card
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleNativeTextShare}
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: isDark ? '#141A22' : '#F1F5F9',
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text style={[styles.secondaryActionText, { color: colors.textSecondary }]}>
                    Copy Summary
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onClose}
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: isDark ? '#141A22' : '#F1F5F9',
                      borderColor: colors.surfaceBorder,
                      flex: 0.6,
                    },
                  ]}
                >
                  <Text style={[styles.secondaryActionText, { color: colors.textSecondary }]}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Off-Screen Active Canvas Rasterizer */}
          {isExportingPng && (
            <View style={styles.offscreenWebView}>
              <WebView
                originWhitelist={['*']}
                source={{ html: canvasHtml }}
                onMessage={(event) => handleCanvasMessage(event.nativeEvent.data)}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                style={{ width: 300, height: 300 }}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    flex: 1,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalKicker: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  cardPreviewContainer: {
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  cardInnerBox: {
    borderRadius: RADIUS.md,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardFlameDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardBrandText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cardSeasonTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardTierBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  cardTierText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  cardAthleteRow: {
    marginBottom: 14,
  },
  cardAthleteName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  cardAthleteSport: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  cardHeroDistanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 14,
  },
  cardHeroDistNum: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  cardHeroDistUnit: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardSilhouetteBox: {
    height: 80,
    marginVertical: 8,
    justifyContent: 'center',
  },
  cardMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  cardMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  cardMetricVal: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  cardMetricLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  cardMottoBox: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  cardMottoText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cardFooterRow: {
    paddingTop: 8,
    alignItems: 'center',
  },
  cardFooterText: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  controlsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
  },
  themesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  themeColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeChipText: {
    fontSize: 11,
  },
  togglesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mottoPillsScroll: {
    marginBottom: 10,
  },
  mottoChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginRight: 8,
  },
  mottoChipText: {
    fontSize: 11,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginBottom: 12,
  },
  toastText: {
    fontSize: 11,
    fontWeight: '800',
  },
  downloadHeroBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadHeroBtnText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  downloadHeroBtnSub: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(0, 0, 0, 0.7)',
    marginTop: 1,
  },
  secondaryBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  offscreenWebView: {
    position: 'absolute',
    top: -500,
    left: -500,
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
});
