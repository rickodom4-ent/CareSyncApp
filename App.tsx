import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';

export type Category = 'IV_ANTIBIOTIC' | 'NEBULIZER' | 'PSYCH_SLEEP' | 'ANTI_NAUSEA' | 'LAB_DRAW';

export interface TreatmentTask {
  id: string;
  timeSlot: string;
  title: string;
  category: Category;
  instructions: string;
  completed: boolean;
  requiresRinseSpit?: boolean;
  requiresLineFlush?: boolean;
  stimulantWarning?: boolean;
  isLate?: boolean;
  completedAt?: string;
}

const INITIAL_TASKS: TreatmentTask[] = [
  {
    id: '1',
    timeSlot: '07:00 AM',
    title: 'Ceftaroline 600mg IV',
    category: 'IV_ANTIBIOTIC',
    instructions: 'Infuse in NS 100mL over 60 mins. Base 12-hr Q12 anchor start.',
    completed: false,
    requiresLineFlush: true,
  },
  {
    id: '2',
    timeSlot: '07:30 AM',
    title: 'HyperSal 3.5% Nebulizer',
    category: 'NEBULIZER',
    instructions: 'Inhale 4 mL via nebulizer twice daily to thin secretions.',
    completed: false,
  },
  {
    id: '3',
    timeSlot: '08:00 AM',
    title: 'Budesonide (Pulmicort) Nebulizer',
    category: 'NEBULIZER',
    instructions: 'Inhale 2 mL twice daily. MUST rinse mouth & spit water after!',
    completed: false,
    requiresRinseSpit: true,
  },
  {
    id: '4',
    timeSlot: '08:15 AM',
    title: 'Imipenem-Cilastatin 500mg IV',
    category: 'IV_ANTIBIOTIC',
    instructions: 'Infuse in NS 100mL over 60 mins. Ensure saline flush prior!',
    completed: false,
    requiresLineFlush: true,
  },
  {
    id: '5',
    timeSlot: '12:00 PM',
    title: 'Amikacin 625mg IV (MWF)',
    category: 'IV_ANTIBIOTIC',
    instructions: 'Infuse in NS 250mL over 60 mins. Monitor for ear fullness/dizziness.',
    completed: false,
  },
  {
    id: '6',
    timeSlot: '01:00 PM',
    title: 'Amikacin Peak Blood Draw',
    category: 'LAB_DRAW',
    instructions: 'Draw peak lab blood exactly 60 mins post-Amikacin infusion completion.',
    completed: false,
  },
  {
    id: '7',
    timeSlot: '05:00 PM',
    title: 'Albuterol Nebulizer',
    category: 'NEBULIZER',
    instructions: 'Inhale 3 mL. Stimulant: Avoid late evening doses to prevent insomnia.',
    completed: false,
    stimulantWarning: true,
  },
  {
    id: '8',
    timeSlot: '07:00 PM',
    title: 'Ceftaroline 600mg IV (Dose 2)',
    category: 'IV_ANTIBIOTIC',
    instructions: 'Evening Q12 anchor dose. Infuse in NS 100mL over 60 mins.',
    completed: false,
    requiresLineFlush: true,
  },
  {
    id: '9',
    timeSlot: '08:15 PM',
    title: 'Imipenem-Cilastatin 500mg IV (Dose 2)',
    category: 'IV_ANTIBIOTIC',
    instructions: 'Evening Q12 dose. Complete prior to main sleep window.',
    completed: false,
    requiresLineFlush: true,
  },
  {
    id: '10',
    timeSlot: '09:00 PM',
    title: 'Mirtazapine 30mg + Trazodone / Seroquel',
    category: 'PSYCH_SLEEP',
    instructions: 'Take 1 tablet by mouth at bedtime as prescribed.',
    completed: false,
  },
];

export default function App() {
  const [tasks, setTasks] = useState<TreatmentTask[]>(INITIAL_TASKS);
  const [selectedTaskForLate, setSelectedTaskForLate] = useState<TreatmentTask | null>(null);
  const [shiftMinutesInput, setShiftMinutesInput] = useState('60');

  const getCategoryColor = (category: Category) => {
    switch (category) {
      case 'IV_ANTIBIOTIC':
        return '#0284C7';
      case 'NEBULIZER':
        return '#0D9488';
      case 'PSYCH_SLEEP':
        return '#8B5CF6';
      case 'ANTI_NAUSEA':
        return '#F59E0B';
      case 'LAB_DRAW':
        return '#EF4444';
      default:
        return '#64748B';
    }
  };

  const handleTaskToggle = (task: TreatmentTask) => {
    if (!task.completed) {
      if (task.requiresRinseSpit) {
        Alert.alert(
          'Mandatory Safety Checklist',
          'Did the patient rinse their mouth with water and spit it out after the Budesonide nebulizer session?',
          [
            { text: 'No, do it now', style: 'cancel' },
            {
              text: 'Yes, Rinsed & Spat',
              onPress: () => markTaskCompleted(task.id),
            },
          ]
        );
        return;
      }

      if (task.requiresLineFlush) {
        Alert.alert(
          'Line Clearing Protocol',
          'Has the IV PICC/Mid-line been cleared with Normal Saline prior to starting this infusion?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Flushed & Confirmed', onPress: () => markTaskCompleted(task.id) },
          ]
        );
        return;
      }
    }

    markTaskCompleted(task.id);
  };

  const markTaskCompleted = (taskId: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed, completedAt: timestamp } : t))
    );
  };

  const applyScheduleShift = (minutes: number) => {
    if (!selectedTaskForLate) return;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === selectedTaskForLate.id || parseInt(t.id, 10) > parseInt(selectedTaskForLate.id, 10)) {
          return {
            ...t,
            timeSlot: `${t.timeSlot} (+${minutes}m Shifted)`,
            isLate: true,
          };
        }
        return t;
      })
    );

    setSelectedTaskForLate(null);
    Alert.alert(
      'Schedule Recalculated',
      `Subsequent Q12 IV doses and lab draws have been shifted by ${minutes} minutes to prevent overlap.`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>CareSync Command Center</Text>
          <Text style={styles.headerSubtitle}>7:00 AM / 7:00 PM Anchor Protocol</Text>
        </View>
        <View style={styles.syncBadge}>
          <Text style={styles.syncText}>● Live Synced</Text>
        </View>
      </View>

      <View style={styles.alertBanner}>
        <Text style={styles.alertTitle}>⚠️ Active Lab & Safety Alerts</Text>
        <Text style={styles.alertBody}>
          • <Text style={{ fontWeight: 'bold' }}>Hemoglobin 8.3 L / Hct 24.2% L:</Text> Monitor for fatigue and dyspnea.
        </Text>
        <Text style={styles.alertBody}>
          • <Text style={{ fontWeight: 'bold' }}>Amikacin Peak (19.9 L):</Text> Slightly below 20–30 mg/L range; report to team.
        </Text>
        <Text style={styles.alertBody}>
          • <Text style={{ fontWeight: 'bold' }}>Interaction Warning:</Text> Ondansetron + Mirtazapine/Trazodone increases Serotonin Syndrome risk.
        </Text>
      </View>

      <ScrollView style={styles.taskList} contentContainerStyle={{ paddingBottom: 30 }}>
        {tasks.map((task) => {
          const color = getCategoryColor(task.category);
          return (
            <View
              key={task.id}
              style={[
                styles.card,
                task.completed && styles.cardCompleted,
                task.isLate && styles.cardLate,
                { borderLeftColor: color },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.timeText, task.isLate && styles.timeLate]}>{task.timeSlot}</Text>
                <View style={[styles.badge, { backgroundColor: color }]}>
                  <Text style={styles.badgeText}>{task.category.replace('_', ' ')}</Text>
                </View>
              </View>

              <Text style={[styles.taskTitle, task.completed && styles.textCompleted]}>
                {task.title}
              </Text>
              <Text style={styles.taskInstructions}>{task.instructions}</Text>

              {task.completedAt && (
                <Text style={styles.completedTimestamp}>Completed at: {task.completedAt}</Text>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.flexButton,
                    task.completed ? styles.buttonCompleted : { backgroundColor: color },
                  ]}
                  onPress={() => handleTaskToggle(task)}
                >
                  <Text style={styles.buttonText}>
                    {task.completed ? '✓ Completed & Synced' : 'Mark Task Complete'}
                  </Text>
                </TouchableOpacity>

                {!task.completed && (
                  <TouchableOpacity
                    style={styles.shiftButton}
                    onPress={() => setSelectedTaskForLate(task)}
                  >
                    <Text style={styles.shiftButtonText}>Report Late</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={selectedTaskForLate !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedTaskForLate(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Auto-Adjust Schedule</Text>
            <Text style={styles.modalSub}>
              Delayed starting {selectedTaskForLate?.title}? Enter delay time to shift all subsequent Q12 doses and lab draws automatically:
            </Text>

            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={shiftMinutesInput}
              onChangeText={setShiftMinutesInput}
              placeholder="Delay in minutes (e.g. 30, 60)"
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setSelectedTaskForLate(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={() => applyScheduleShift(parseInt(shiftMinutesInput, 10) || 0)}
              >
                <Text style={styles.modalConfirmText}>Shift Remaining Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    padding: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 13, color: '#38BDF8', marginTop: 2 },
  syncBadge: { backgroundColor: '#166534', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  syncText: { color: '#4ADE80', fontSize: 11, fontWeight: 'bold' },

  alertBanner: {
    backgroundColor: '#451A03',
    borderColor: '#92400E',
    borderWidth: 1,
    margin: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
  },
  alertTitle: { color: '#FCD34D', fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  alertBody: { color: '#FDE68A', fontSize: 12, lineHeight: 17 },

  taskList: { padding: 16 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 6,
    elevation: 3,
  },
  cardCompleted: { backgroundColor: '#0F172A', opacity: 0.65 },
  cardLate: { borderColor: '#EF4444' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  timeText: { color: '#38BDF8', fontWeight: 'bold', fontSize: 14 },
  timeLate: { color: '#F87171' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 4 },
  textCompleted: { textDecorationLine: 'line-through', color: '#64748B' },
  taskInstructions: { fontSize: 13, color: '#CBD5E1', marginBottom: 12, lineHeight: 18 },
  completedTimestamp: { fontSize: 11, color: '#4ADE80', fontStyle: 'italic', marginBottom: 8 },

  buttonRow: { flexDirection: 'row', gap: 8 },
  button: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  flexButton: { flex: 1 },
  buttonCompleted: { backgroundColor: '#15803D' },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },

  shiftButton: { backgroundColor: '#334155', paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center' },
  shiftButtonText: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E293B', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 8 },
  modalSub: { fontSize: 13, color: '#94A3B8', marginBottom: 16, lineHeight: 18 },
  modalInput: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelText: { color: '#94A3B8', fontWeight: 'bold' },
  modalConfirm: { backgroundColor: '#0284C7', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  modalConfirmText: { color: '#FFFFFF', fontWeight: 'bold' },
});
