import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

// ponytail: landing screen just proves the login round-trip works end to end.
// "Mis pacientes" (lista + ficha) ya tiene endpoints en el backend — falta la UI, siguiente paso.
export default function DoctorHomeScreen() {
  const { doctor, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hola, {doctor.name}</Text>
      {doctor.specialty ? <Text style={styles.subtitle}>{doctor.specialty}</Text> : null}
      <Text style={styles.hint}>La lista de pacientes agendados llega en el próximo paso.</Text>
      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#6B7280', marginTop: 4 },
  hint: { color: '#6B7280', textAlign: 'center', marginTop: 16, marginBottom: 24 },
  button: { backgroundColor: '#DC2626', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
