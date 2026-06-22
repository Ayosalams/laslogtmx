import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useMilitaryClock } from '../../../packages/shared/src/hooks/useMilitaryClock';
import { useDetentionTimer } from '../../detention-timer/hooks/useDetentionTimer';
import { useReceiptOcr } from '../hooks/useReceiptOcr';
import { BRAND } from '../constants';

interface Props {
  navigation?: {
    goBack: () => void;
    navigate: (screen: string, params?: object) => void;
  };
}

export const ReceiptCaptureScreen: React.FC<Props> = ({ navigation }) => {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'preview'>('camera');
  const currentTime = useMilitaryClock();
  const { processImage, isProcessing, error, lastEngine } = useReceiptOcr();
  const { session: detentionSession } = useDetentionTimer();

  const detentionContext = detentionSession
    ? {
        loadNumber: detentionSession.loadNumber,
        loadId: detentionSession.loadId,
        facility: detentionSession.facility,
      }
    : undefined;

  const handlePermission = useCallback(async () => {
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert(
        'Camera Access Required',
        'Enable camera access in settings to scan receipts, or choose a photo from your library.'
      );
    }
  }, [requestPermission]);

  const runOcrAndNavigate = useCallback(
    async (uri: string) => {
      try {
        const ocrResult = await processImage(uri);
        navigation?.navigate('ReceiptCorrection', {
          imageUri: uri,
          ocrResult,
          detentionContext,
        });
      } catch {
        Alert.alert('Scan Failed', 'Could not read the receipt. Try again or pick a clearer photo.');
      }
    },
    [navigation, processImage, detentionContext]
  );

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      if (photo?.uri) {
        setPreviewUri(photo.uri);
        setMode('preview');
      }
    } catch {
      Alert.alert('Capture Failed', 'Unable to take photo. Please try again.');
    }
  }, []);

  const pickFromLibrary = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPreviewUri(result.assets[0].uri);
      setMode('preview');
    }
  }, []);

  const confirmPreview = useCallback(async () => {
    if (previewUri) await runOcrAndNavigate(previewUri);
  }, [previewUri, runOcrAndNavigate]);

  const retake = useCallback(() => {
    setPreviewUri(null);
    setMode('camera');
  }, []);

  if (!permission) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={BRAND.accent} />
      </View>
    );
  }

  if (!permission.granted && mode === 'camera') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>{currentTime}</Text>
          </View>
        </View>
        <View style={[styles.center, { flex: 1, padding: 24 }]}>
          <Text style={styles.title}>Camera Permission</Text>
          <Text style={styles.subtitle}>
            Allow camera access to scan receipts on the road, or upload from your gallery.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handlePermission}>
            <Text style={styles.primaryBtnText}>Enable Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={pickFromLibrary}>
            <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} disabled={isProcessing}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Receipt</Text>
        <View style={styles.timePill}>
          <Text style={styles.timeText}>{currentTime}</Text>
        </View>
      </View>

      {detentionSession ? (
        <View style={styles.detentionStrip}>
          <Text style={styles.detentionText}>
            Detention active — Load {detentionSession.loadNumber} ({detentionSession.facility})
          </Text>
        </View>
      ) : null}

      {mode === 'camera' ? (
        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back">
            <View style={styles.overlay}>
              <View style={styles.frameGuide} />
              <Text style={styles.guideText}>Align receipt within the frame</Text>
              <Text style={styles.guideSub}>Hold steady • avoid glare • capture the total line</Text>
            </View>
          </CameraView>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.galleryBtn} onPress={pickFromLibrary}>
              <Text style={styles.galleryBtnText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shutterBtn} onPress={takePhoto} activeOpacity={0.8}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>
            <View style={styles.galleryBtn} />
          </View>
        </View>
      ) : (
        <View style={styles.previewWrap}>
          {previewUri && <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.processingText}>Reading receipt…</Text>
              {lastEngine === 'fallback' && (
                <Text style={styles.processingHint}>Using fallback extraction — review carefully</Text>
              )}
            </View>
          )}
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={retake} disabled={isProcessing}>
              <Text style={styles.secondaryBtnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, isProcessing && styles.btnDisabled]}
              onPress={confirmPreview}
              disabled={isProcessing}
            >
              <Text style={styles.primaryBtnText}>{isProcessing ? 'Processing…' : 'Continue to Review'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BRAND.card,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: BRAND.text },
  backBtn: { fontSize: 15, fontWeight: '600', color: BRAND.accent, minWidth: 60 },
  timePill: {
    backgroundColor: 'rgba(0,191,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timeText: { fontSize: 12, fontWeight: '600', color: BRAND.accentDark, fontVariant: ['tabular-nums'] },
  detentionStrip: {
    backgroundColor: 'rgba(0,191,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,191,255,0.2)',
  },
  detentionText: { fontSize: 12, fontWeight: '600', color: BRAND.accentDark },
  title: { fontSize: 22, fontWeight: '700', color: BRAND.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: BRAND.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  cameraWrap: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  frameGuide: {
    width: '82%',
    height: '58%',
    borderWidth: 2,
    borderColor: BRAND.accent,
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  guideText: { color: '#fff', marginTop: 16, fontSize: 14, fontWeight: '500' },
  guideSub: { color: 'rgba(255,255,255,0.8)', marginTop: 6, fontSize: 12 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 20,
    backgroundColor: '#0F172A',
  },
  galleryBtn: { width: 72, alignItems: 'center' },
  galleryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: BRAND.accent },
  previewWrap: { flex: 1, backgroundColor: '#0F172A' },
  previewImage: { flex: 1, width: '100%' },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  processingText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  processingHint: { color: 'rgba(255,255,255,0.75)', fontSize: 12, textAlign: 'center', paddingHorizontal: 24 },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: BRAND.card,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: BRAND.accent,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  secondaryBtnText: { color: BRAND.text, fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    margin: 16,
    borderRadius: 12,
  },
  errorText: { color: BRAND.danger, fontSize: 13, textAlign: 'center' },
});