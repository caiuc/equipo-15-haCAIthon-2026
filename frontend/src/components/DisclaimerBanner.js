import { StyleSheet, Text, View } from 'react-native';

// Regla de negocio estricta: este disclaimer debe verse siempre, en toda pantalla clínica.
export function DisclaimerBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        Sanito no reemplaza el diagnóstico, consejo ni tratamiento de un profesional de la
        salud. Ante una urgencia, contacta a servicios médicos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  text: {
    color: '#78350F',
    fontSize: 12,
    textAlign: 'center',
  },
});
