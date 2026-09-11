import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';

interface Treatment {
  id: string;
  name: string;
  startTime: string;
  finishTime: string;
  date: string;
  status: 'pending' | 'completed' | 'missed';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'past' | 'future'>('today');
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [treatmentName, setTreatmentName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [finishTime, setFinishTime] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const addTreatment = () => {
    if (!treatmentName) return;
    const newTreatment: Treatment = {
      id: Date.now().toString(),
      name: treatmentName,
      startTime: startTime || '08:00',
      finishTime: finishTime || '09:00',
      date: todayStr,
      status: 'pending',
    };
    setTreatments([...treatments, newTreatment]);
    setTreatmentName('');
    setStartTime('');
    setFinishTime('');
  };

  const toggleStatus = (id: string) => {
    setTreatments(treatments.map(t => 
      t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>CareSync Medical Management</Text>
      
      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setActiveTab('past')} style={[styles.tab, activeTab === 'past' && styles.activeTab]}>
          <Text>Past Log</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('today')} style={[styles.tab, activeTab === 'today' && styles.activeTab]}>
          <Text>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('future')} style={[styles.tab, activeTab === 'future' && styles.activeTab]}>
          <Text>Future Schedule</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'today' && (
        <View style={styles.inputContainer}>
          <TextInput 
            placeholder="Treatment Name" 
            value={treatmentName} 
            onChangeText={setTreatmentName} 
            style={styles.input} 
          />
          <View style={styles.timeRow}>
            <TextInput 
              placeholder="Start (HH:MM)" 
              value={startTime} 
              onChangeText={setStartTime} 
              style={[styles.input, styles.halfInput]} 
            />
            <TextInput 
              placeholder="Finish (HH:MM)" 
              value={finishTime} 
              onChangeText={setFinishTime} 
              style={[styles.input, styles.halfInput]} 
            />
          </View>
          <TouchableOpacity onPress={addTreatment} style={styles.button}>
            <Text style={styles.buttonText}>Add Treatment</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.list}>
        {treatments
          .filter(t => {
            if (activeTab === 'today') return t.date === todayStr;
            if (activeTab === 'past') return t.date < todayStr || t.status === 'completed';
            return t.date > todayStr;
          })
          .map(item => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.title}>{item.name}</Text>
              <Text>Time: {item.startTime} - {item.finishTime}</Text>
              <Text>Status: {item.status}</Text>
              <TouchableOpacity onPress={() => toggleStatus(item.id)} style={styles.toggleButton}>
                <Text>Toggle Completed</Text>
              </TouchableOpacity>
            </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', paddingTop: 50 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  tabRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  tab: { padding: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#007AFF' },
  inputContainer: { marginBottom: 20, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5, marginBottom: 10 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  button: { backgroundColor: '#007AFF', padding: 10, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  list: { flex: 1 },
  card: { padding: 15, backgroundColor: '#f1f1f1', borderRadius: 8, marginBottom: 10 },
  title: { fontSize: 16, fontWeight: 'bold' },
  toggleButton: { marginTop: 8, padding: 6, backgroundColor: '#ddd', alignSelf: 'flex-start', borderRadius: 4 }
});
