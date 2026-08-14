// ponytail: umbrales clínicos genéricos, no personalizados por paciente — calculados al
// vuelo en vez de una tabla de alertas (no existía ninguna). Ajustar/mover a config si
// algún médico necesita umbrales distintos por paciente.
export function flagAlert(metric) {
  if (metric.type === 'glucose' && metric.value != null) {
    if (metric.value >= 180) return { severity: 'alta', message: 'Glucosa alta (≥180 mg/dL)' };
    if (metric.value <= 70) return { severity: 'alta', message: 'Glucosa baja (≤70 mg/dL)' };
  }
  if (metric.type === 'blood_pressure' && metric.systolic != null && metric.diastolic != null) {
    if (metric.systolic >= 140 || metric.diastolic >= 90) return { severity: 'alta', message: 'Presión arterial alta' };
    if (metric.systolic < 90 || metric.diastolic < 60) return { severity: 'media', message: 'Presión arterial baja' };
  }
  return null;
}
