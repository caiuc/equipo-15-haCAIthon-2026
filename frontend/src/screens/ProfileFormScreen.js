import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const SEX_OPTIONS = [
  { value: 'female', label: 'Femenino' },
  { value: 'male', label: 'Masculino' },
  { value: 'other', label: 'Otro' },
];

// Reachable only while logged in (AppNavigator gates on `user`), so this screen can assume
// a valid session throughout — no more "userId doesn't exist yet" branching.
export default function ProfileFormScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: user.name || '',
    age: user.age ? String(user.age) : '',
    sex: user.sex || '',
    heightCm: user.heightCm ? String(user.heightCm) : '',
    weightKg: user.weightKg ? String(user.weightKg) : '',
  });
  const [medications, setMedications] = useState([]);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '' });
  const [bp, setBp] = useState({ systolic: '', diastolic: '' });
  const [glucose, setGlucose] = useState('');

  useEffect(() => {
    api
      .listMedications()
      .then(setMedications)
      .catch((err) => Alert.alert('Error cargando medicamentos', err.message))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      await api.updateMe({
        name: profile.name || null,
        age: profile.age ? Number(profile.age) : null,
        sex: profile.sex || null,
        heightCm: profile.heightCm ? Number(profile.heightCm) : null,
        weightKg: profile.weightKg ? Number(profile.weightKg) : null,
      });
      await refreshUser();
      Alert.alert('Listo', 'Perfil guardado.');
    } catch (err) {
      Alert.alert('Error guardando perfil', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitBloodPressure() {
    if (!bp.systolic || !bp.diastolic) return;
    try {
      await api.addHealthMetric({ type: 'blood_pressure', systolic: Number(bp.systolic), diastolic: Number(bp.diastolic) });
      setBp({ systolic: '', diastolic: '' });
      Alert.alert('Registrado', 'Presión arterial guardada.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  async function submitGlucose() {
    if (!glucose) return;
    try {
      await api.addHealthMetric({ type: 'glucose', value: Number(glucose) });
      setGlucose('');
      Alert.alert('Registrado', 'Glucosa guardada.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  async function submitMedication() {
    if (!newMed.name) return;
    try {
      const med = await api.addMedication(newMed);
      setMedications((prev) => [med, ...prev]);
      setNewMed({ name: '', dosage: '', frequency: '' });
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  async function removeMedication(id) {
    try {
      await api.deleteMedication(id);
      setMedications((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <DisclaimerBanner />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.email}>{user.email}</Text>
          <TouchableOpacity onPress={logout}>
            <Text style={styles.logout}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>Datos básicos</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={profile.name}
          onChangeText={(v) => setProfile((p) => ({ ...p, name: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Edad"
          keyboardType="numeric"
          value={profile.age}
          onChangeText={(v) => setProfile((p) => ({ ...p, age: v }))}
        />
        <View style={styles.row}>
          {SEX_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.pill, profile.sex === opt.value && styles.pillActive]}
              onPress={() => setProfile((p) => ({ ...p, sex: opt.value }))}
            >
              <Text style={profile.sex === opt.value ? styles.pillTextActive : styles.pillText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Altura (cm)"
          keyboardType="numeric"
          value={profile.heightCm}
          onChangeText={(v) => setProfile((p) => ({ ...p, heightCm: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Peso (kg)"
          keyboardType="numeric"
          value={profile.weightKg}
          onChangeText={(v) => setProfile((p) => ({ ...p, weightKg: v }))}
        />
        <TouchableOpacity style={styles.button} onPress={saveProfile} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Guardar perfil'}</Text>
        </TouchableOpacity>

        <Text style={styles.section}>Presión arterial</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex1]}
            placeholder="Sistólica"
            keyboardType="numeric"
            value={bp.systolic}
            onChangeText={(v) => setBp((p) => ({ ...p, systolic: v }))}
          />
          <TextInput
            style={[styles.input, styles.flex1, { marginLeft: 8 }]}
            placeholder="Diastólica"
            keyboardType="numeric"
            value={bp.diastolic}
            onChangeText={(v) => setBp((p) => ({ ...p, diastolic: v }))}
          />
        </View>
        <TouchableOpacity style={styles.buttonSecondary} onPress={submitBloodPressure}>
          <Text style={styles.buttonSecondaryText}>Registrar presión</Text>
        </TouchableOpacity>

        <Text style={styles.section}>Glucosa (mg/dL)</Text>
        <TextInput style={styles.input} placeholder="Glucosa" keyboardType="numeric" value={glucose} onChangeText={setGlucose} />
        <TouchableOpacity style={styles.buttonSecondary} onPress={submitGlucose}>
          <Text style={styles.buttonSecondaryText}>Registrar glucosa</Text>
        </TouchableOpacity>

        <Text style={styles.section}>Medicamentos y suplementos</Text>
        {medications.map((med) => (
          <View key={med.id} style={styles.medRow}>
            <Text style={styles.medText}>
              {med.name}
              {med.dosage ? ` · ${med.dosage}` : ''}
              {med.frequency ? ` · ${med.frequency}` : ''}
            </Text>
            <TouchableOpacity onPress={() => removeMedication(med.id)}>
              <Text style={styles.remove}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TextInput
          style={styles.input}
          placeholder="Nombre del medicamento"
          value={newMed.name}
          onChangeText={(v) => setNewMed((p) => ({ ...p, name: v }))}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex1]}
            placeholder="Dosis (ej. 50mg)"
            value={newMed.dosage}
            onChangeText={(v) => setNewMed((p) => ({ ...p, dosage: v }))}
          />
          <TextInput
            style={[styles.input, styles.flex1, { marginLeft: 8 }]}
            placeholder="Frecuencia"
            value={newMed.frequency}
            onChangeText={(v) => setNewMed((p) => ({ ...p, frequency: v }))}
          />
        </View>
        <TouchableOpacity style={styles.buttonSecondary} onPress={submitMedication}>
          <Text style={styles.buttonSecondaryText}>Añadir medicamento</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  email: { color: '#6B7280', flexShrink: 1 },
  logout: { color: '#DC2626', fontWeight: '600' },
  section: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', marginBottom: 8 },
  flex1: { flex: 1 },
  pill: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  pillActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  pillText: { color: '#374151' },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: '#2563EB', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '600' },
  buttonSecondary: { borderWidth: 1, borderColor: '#2563EB', borderRadius: 8, padding: 10, alignItems: 'center' },
  buttonSecondaryText: { color: '#2563EB', fontWeight: '600' },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  medText: { flex: 1 },
  remove: { color: '#DC2626', marginLeft: 8 },
});
