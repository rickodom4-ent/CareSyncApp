import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import RoundedCamera from './components/RoundedCamera';

export default function App() {
  const [activeTab, setActiveTab] = useState<'Today' | 'Past' | 'Future'>('Today');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);

  if (isScanning) {
    return (
      <RoundedCamera
        onScan={(data) => {
          setScannedData(data);
          setIsScanning(false);
        }}
        onClose={() => setIsScanning(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CareSyncApp</Text>
        <Text style={styles.headerSubtitle}>Medical Regimen Tracker</Text>
      </View>

      <View style={styles.tabContainer}>
        {(['Today', 'Past', 'Future'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'Today' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today's Regimen</Text>
            <Text style={styles.cardBody}>
              {scannedData ? `Scanned Medication: ${scannedData}` : 'No medications logged for today yet.'}
            </Text>
            <TouchableOpacity style={styles.scanButton} onPress={() => setIsScanning(true)}>
              <Text style={styles.scanButtonText}>Scan Prescription Barcode</Text>
            </TouchableOpacity>
          </View>
        )}
        {activeTab === 'Past' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Historical Logs</Text>
            <Text style={styles.cardBody}>Review past doses, adherence rates, and historical clinical data.</Text>
          </View>
        )}
        {activeTab === 'Future' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Upcoming Schedule</Text>
            <Text style={styles.cardBody}>Manage upcoming refills, future treatments, and recurring reminders.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', padding: 4, margin: 16, borderRadius: 12 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTabButton: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  activeTabText: { color: '#0f172a' },
  content: { paddingHorizontal: 16 },
  card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  cardBody: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 16 },
  scanButton: { backgroundColor: '#0ea5e9', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  scanButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
});
