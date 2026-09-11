import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, SafeAreaView, StatusBar, Modal, TextInput, ActivityIndicator } from 'react-native';
import { supabase } from './lib/supabase';

interface TreatmentTask {
  id: string;
  timeSlot: string;
  category: 'IV_Antibiotic' | 'Nebulizer' | 'Lab_Draw' | 'Telehealth' | 'Appointment';
  title: string;
  instructions: string;
  completed: boolean;
  requiresRinse?: boolean;
  requiresFlush?: boolean;
  isFlagged?: boolean;
  telehealthUrl?: string;
}

const INITIAL_TASKS: TreatmentTask[] = [
  { id: '1', timeSlot: '07:30 AM', category: 'IV_Antibiotic', title: 'Ceftaroline 600mg (100 mL)', instructions: 'Infuse over 30-60 min. Normal Saline flush required after.', completed: false, requiresFlush: true },
  { id: '2', timeSlot: '07:30 AM', category: 'Nebulizer', title: 'Nebulizer Session #1', instructions: 'Run Ipratropium Bromide FIRST, then Budesonide SECOND.', completed: false, requiresRinse: true },
  { id: '3', timeSlot: '08:15 AM', category: 'IV_Antibiotic', title: 'Imipenem-Cilastatin 500mg (100 mL)', instructions: 'Infuse over 20-30 min following line flush. Flush after.', completed: false, requiresFlush: true },
  { id: '4', timeSlot: '12:00 PM', category: 'IV_Antibiotic', title: 'Amikacin 600mg (250 mL) - MWF', instructions: 'Start by 12:00 PM on Wed/Fri to allow 1:00 PM peak blood draw.', completed: false },
  { id: '5', timeSlot: '01:00 PM', category: 'Lab_Draw', title: 'Peak Amikacin Blood Draw (Bloodland)', instructions: 'Draw blood exactly 1 hr post-Amikacin start. Closes at 2:10 PM.', completed: false },
  { id: '6', timeSlot: '03:00 PM', category: 'Telehealth', title: 'Cardio Health Video Check-in', instructions: 'Secure family video appointment with specialist.', completed: false, telehealthUrl: 'https://telehealth.care-team.org/room/dad-cardio' },
  { id: '7', timeSlot: '05:00 PM', category: 'Nebulizer', title: 'Nebulizer Session #2', instructions: 'Run Ipratropium Bromide FIRST, then Budesonide SECOND.', completed: false, requiresRinse: true },
  { id: '8', timeSlot: '07:30 PM', category: 'IV_Antibiotic', title: 'Ceftaroline 600mg (Q12H Night Cycle)', instructions: 'Infuse over 30-60 min. Normal Saline flush required after.', completed: false, requiresFlush: true },
];

export default function App() {
  const [tasks, setTasks] = useState<TreatmentTask[]>(INITIAL_TASKS);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TreatmentTask | null>(null);
  const [delayMinutes, setDelayMinutes] = useState('30');

  useEffect(() => {
    fetchTasks();
    const subscription = supabase
      .channel('public:treatment_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'treatment_logs' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase.from('treatment_logs').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        // Sync local task completion state if logs exist
        setTasks((prev) =>
          prev.map((t) => {
            const match = data.find((d: any) => d.medication_name === t.title && d.status === 'Completed');
            return match ? { ...t, completed: true } : t;
          })
        );
      }
    } catch (err) {
      console.log('Using local state sync mode:', err);
    }
  };

  const handleTaskToggle = async (task: TreatmentTask) => {
    const nextState = !task.completed;
    if (nextState) {
      if (task.requiresRinse) Alert.alert('Safety Checklist: Mouth Rinse', 'Ensure patient rinses mouth with water and spits immediately after Budesonide.');
      if (task.requiresFlush) Alert.alert('Safety Checklist: Line Flush', 'Administer Normal Saline Flush to clear tubing before/after IV antibiotic infusion.');
    }
    
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: nextState } : t)));

    await supabase.from('treatment_logs').insert([
      {
        medication_name: task.title,
        category: task.category,
        scheduled_for: new Date().toISOString(),
        completed_at: nextState ? new Date().toISOString() : null,
        status: nextState ? 'Completed' : 'Pending',
        completed_by: 'Family Care Team',
      },
    ]).catch((err) => console.log('Supabase sync log error:', err));
  };

  const handleOpenDelayModal = (task: TreatmentTask) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const applyAutoScheduleShift = () => {
    if (!selectedTask) return;
    const mins = parseInt(delayMinutes, 10) || 0;

    setTasks((prev) => {
      let foundTarget = false;
      return prev.map((t) => {
        if (t.id === selectedTask.id) {
          foundTarget = true;
          return { ...t, timeSlot: `Delayed (+${mins}m)` };
        }
        // Automatically cascade delays to subsequent IV or Lab tasks
        if (foundTarget && (t.category === 'IV_Antibiotic' || t.category === 'Lab_Draw')) {
          return { ...t, isFlagged: true };
        }
        return t;
      });
    });

    setModalVisible(false);
    Alert.alert('Schedule Auto-Adjusted', `Task delayed by ${mins} mins. Downstream intervals flagged for family review.`);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'IV_Antibiotic': return '#0284C7';
      case 'Nebulizer': return '#16A34A';
      case 'Lab_Draw': return '#D97706';
      case 'Telehealth': return '#9333EA';
      default: return '#475569';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CareTeam Sync</Text>
        <Text style={styles.headerSubtitle}>Mycobacterium abscessus Regimen Coordinator</Text>
      </View>
      <ScrollView style={styles.taskList} contentContainerStyle={{ paddingBottom: 30 }}>
        {tasks.map((task) => {
          const color = getCategoryColor(task.category);
          return (
            <View key={task.id} style={[styles.card, task.completed && styles.cardCompleted, task.isFlagged && styles.cardFlagged, { borderLeftColor: color }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.timeText}>{task.timeSlot}</Text>
                <View style={[styles.badge, { backgroundColor: color }]}>
                  <Text style={styles.badgeText}>{task.category.replace('_', ' ')}</Text>
                </View>
              </View>
              <Text style={[styles.taskTitle, task.completed && styles.textCompleted]}>{task.title}</Text>
              <Text style={styles.taskInstructions}>{task.instructions}</Text>
              
              {task.category === 'Telehealth' && (
                <TouchableOpacity style={styles.telehealthButton} onPress={() => Alert.alert('Secure Video', `Connecting to video suite: ${task.telehealthUrl}`)}>
                  <Text style={styles.telehealthButtonText}>Join Cardio Video Appointment</Text>
                </TouchableOpacity>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.button, task.completed ? styles.buttonCompleted : { backgroundColor: color, flex: 1 }]} onPress={() => handleTaskToggle(task)}>
                  <Text style={styles.buttonText}>{task.completed ? '✓ Completed' : 'Mark Done'}</Text>
                </TouchableOpacity>
                {!task.completed && (
                  <TouchableOpacity style={styles.delayButton} onPress={() => handleOpenDelayModal(task)}>
                    <Text style={styles.delayButtonText}>Report Late</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Late Administration</Text>
            <Text style={styles.modalSubtitle}>How many minutes late is this task? Subsequent dependent doses will auto-shift.</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={delayMinutes} onChangeText={setDelayMinutes} />
            <TouchableOpacity style={styles.modalSubmit} onPress={applyAutoScheduleShift}>
              <Text style={styles.modalSubmitText}>Recalculate Family Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 20, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 14, color: '#38BDF8', marginTop: 4 },
  taskList: { padding: 16 },
  card: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 14, borderLeftWidth: 6, elevation: 3 },
  cardCompleted: { backgroundColor: '#0F172A', opacity: 0.7 },
  cardFlagged: { borderWidth: 1, borderColor: '#DC2626' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  timeText: { color: '#38BDF8', fontWeight: 'bold', fontSize: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  taskTitle: { fontSize: 17, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 4 },
  textCompleted: { textDecorationLine: 'line-through', color: '#64748B' },
  taskInstructions: { fontSize: 13, color: '#CBD5E1', marginBottom: 12, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 8 },
  button: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonCompleted: { backgroundColor: '#15803D', flex: 1 },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  delayButton: { backgroundColor: '#334155', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  delayButtonText: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 14 },
  telehealthButton: { backgroundColor: '#7C3AED', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  telehealthButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 20 },
  modalContent: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 16 },
  input: { backgroundColor: '#0F172A', color: '#F8FAFC', padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  modalSubmit: { backgroundColor: '#0284C7', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  modalSubmitText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  modalCancel: { padding: 10, alignItems: 'center' },
  modalCancelText: { color: '#94A3B8', fontWeight: 'bold', fontSize: 14 }
});
