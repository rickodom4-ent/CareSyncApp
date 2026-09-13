import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';

interface RoundedCameraProps {
  onScan?: (data: string) => void;
  onClose?: () => void;
}

export default function RoundedCamera({ onScan, onClose }: RoundedCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View style={styles.centerContainer}><Text>Checking permissions...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.message}>We need camera access to scan prescription barcodes</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={(scanningResult: BarcodeScanningResult) => {
          if (onScan && scanningResult.data) {
            onScan(scanningResult.data);
          }
        }}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'code128'],
        }}
      >
        <SafeAreaView style={styles.overlay}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Scan Medication</Text>
            {onClose && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.scannerCenter}>
            <View style={styles.roundedViewfinder} />
            <Text style={styles.instructions}>Align barcode within the rounded frame</Text>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8fafc' },
  message: { textAlign: 'center', fontSize: 16, color: '#334155', marginBottom: 16 },
  button: { backgroundColor: '#0ea5e9', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#ffffff', fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'space-between', padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  closeButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  closeText: { color: '#ffffff', fontWeight: '600' },
  scannerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  roundedViewfinder: { width: 260, height: 260, borderWidth: 3, borderColor: '#38bdf8', borderRadius: 32, backgroundColor: 'transparent' },
  instructions: { marginTop: 24, color: '#ffffff', fontSize: 14, backgroundColor: 'rgba(0, 0, 0, 0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, overflow: 'hidden' },
});
