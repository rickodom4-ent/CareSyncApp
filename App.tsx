import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, TextInput } from 'react-native';
import RoundedCamera from './components/RoundedCamera';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  taken: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'Today' | 'Schedule' | 'Labs' | 'Future'>('Today');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [cdsAlert, setCdsAlert] = useState<string | null>(null);

  const [medications, setMedications] = useState<Medication[]>([
    { id: '1', name: 'Lisinopril', dosage: '10mg', time: '08:00 AM', frequency: 'Daily', taken: false },
    { id: '2', name: 'Atorvastatin', dosage: '20mg', time: '08:00 PM', frequency: 'Daily', taken: false },
  ]);

  const [newMedName, setNewMedName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newTime, setNewTime] = useState('');

  const handleScanResult = (data: string) => {
    setScannedData(data);
    setIsScanning(false);
    if (data.includes('999')) {
      setCdsAlert('CRITICAL WARNING: Potential counterproductive interaction detected with active evening regimen.');
    } else {
      setCdsAlert(null);
    }
  };

  const addMedication = () => {
    if (!newMedName || !newDosage || !newTime) return;
    const newEntry: Medication = {
      id: Date.now().toString(),
      name: newMedName,
      dosage: newDosage,
      time: newTime,
      frequency: 'Daily',
      taken: false,
    };
    setMedications([...medications, newEntry]);
    setNewMedName('');
    setNewDosage('');
    setNewTime('');
  };

  const toggleTaken = (id: string) => {
    setMedications(medications.map(med => med.id === id ? { ...med, taken: !med.taken } : med));
  };

  if (isScanning) {
    return <RoundedCamera onScan={handleScanResult} onClose={() => setIsScanning(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CareSyncApp</Text>
        <Text style={styles.headerSubtitle}>Clinical Command & Regimen Scheduler</Text>
      </View>

      <View style={styles.tabContainer}>
        {(['Today', 'Schedule', 'Labs', 'Future'] as const).map((tab) => (
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
        {cdsAlert && (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>CDS Conflict Alert</Text>
            <Text style={styles.alertBody}>{cdsAlert}</Text>
          </View>
        )}

        {activeTab === 'Today' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today's Regimen & Scanner</Text>
            <Text style={styles.cardBody}>
              {scannedData ? `Scanned Compound: ${scannedData}` : 'Review and check off daily administered doses.'}
            </Text>
            
            {medications.map((med) => (
              <View key={med.id} style={styles.medRow}>
                <View>
                  <Text style={styles.medName}>{med.name} ({med.dosage})</Text>
                  <Text style={styles.medTime}>Scheduled: {med.time}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.checkButton, med.taken && styles.checkedButton]} 
                  onPress={() => toggleTaken(med.id)}
                >
                  <Text style={styles.checkButtonText}>{med.taken ? 'Taken' : 'Mark Taken'}</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.actionButton} onPress={() => setIsScanning(true)}>
              <Text style={styles.actionButtonText}>Scan Prescription Barcode</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Schedule' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Medication Schedule</Text>
            <TextInput
              style={styles.input}
              placeholder="Medication Name"
              placeholderTextColor="#94a3b8"
              value={newMedName}
              onChangeText={setNewMedName}
            />
            <TextInput
              style={styles.input}
              placeholder="Dosage (e.g., 10mg)"
              placeholderTextColor="#94a3b8"
              value={newDosage}
              onChangeText={setNewDosage}
            />
            <TextInput
              style={styles.input}
              placeholder="Time (e.g., 09:00 AM)"
              placeholderTextColor="#94a3b8"
              value={newTime}
              onChangeText={setNewTime}
            />
            <TouchableOpacity style={styles.actionButton} onPress={addMedication}>
              <Text style={styles.actionButtonText}>Save to Regimen Database</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Labs' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Diagnostic Lab Pipeline</Text>
            <Text style={styles.cardBody}>Syncing via MyChart & Quest FHIR endpoints. 0 active biomarker anomalies detected.</Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => alert('Fetching latest HL7/FHIR lab panels...')}>
              <Text style={styles.secondaryButtonText}>Sync MyChart / Quest Data</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Future' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Predictive Schedule & Refills</Text>
            <Text style={styles.cardBody}>Automated refill routing, CardiHealth integration, and home health visit calendars configured.</Text>
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
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  activeTabText: { color: '#0f172a' },
  content: { paddingHorizontal: 16 },
  card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  cardBody: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 16 },
  medRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 12 },
  medName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  medTime: { fontSize: 13, color: '#64748b', marginTop: 2 },
  checkButton: { backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  checkedButton: { backgroundColor: '#22c55e' },
  checkButtonText: { color: '#0f172a', fontWeight: '600', fontSize: 12 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14, color: '#0f172a' },
  alertCard: { backgroundColor: '#fef2f2', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f87171', marginBottom: 16 },
  alertTitle: { fontSize: 16, fontWeight: 'bold', color: '#991b1b', marginBottom: 4 },
  alertBody: { fontSize: 14, color: '#b91c1c', lineHeight: 18 },
  actionButton: { backgroundColor: '#0ea5e9', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  actionButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  secondaryButton: { backgroundColor: '#e2e8f0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  secondaryButtonText: { color: '#334155', fontWeight: '600', fontSize: 14 },
});
