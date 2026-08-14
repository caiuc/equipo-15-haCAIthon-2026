import { Op } from 'sequelize';
import { User, Medication, HealthMetric, Appointment } from '../models/index.js';

// Plain JSON-schema function declarations (OpenAI-compatible) the LLM uses to decide
// *when* and *how* to call each function.
export const toolDeclarations = [
  {
    name: 'add_medication',
    description:
      'Añade un medicamento o suplemento al perfil del paciente. Úsalo en cuanto tengas nombre y dosis claros (pregunta antes si el paciente solo describe el envase, ej. "la pastilla de la botella naranja").',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre del medicamento, ej. "Losartán"' },
        dosage: { type: 'string', description: 'Ej. "50mg"' },
        frequency: { type: 'string', description: 'Ej. "1 vez al día"' },
        reason: { type: 'string', description: 'Condición que trata, ej. "presión arterial"' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_medication',
    description: 'Actualiza dosis, frecuencia o estado de un medicamento ya existente del paciente (ej. "me subieron la dosis").',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre del medicamento a actualizar' },
        dosage: { type: 'string' },
        frequency: { type: 'string' },
        active: { type: 'boolean', description: 'false si el paciente dejó de tomarlo' },
      },
      required: ['name'],
    },
  },
  {
    name: 'record_health_metric',
    description: 'Registra una medición puntual: peso, glucosa o presión arterial.',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['weight', 'glucose', 'blood_pressure'] },
        value: { type: 'number', description: 'Peso (kg) o glucosa (mg/dL). Omitir si type=blood_pressure.' },
        systolic: { type: 'number', description: 'Solo si type=blood_pressure' },
        diastolic: { type: 'number', description: 'Solo si type=blood_pressure' },
        notes: { type: 'string' },
      },
      required: ['type'],
    },
  },
  {
    name: 'schedule_checkup',
    description:
      'Abre un nuevo ciclo de chequeo médico: tú (el asistente) decides la frecuencia sugerida según edad, medicación y condición, y esta función arranca el recordatorio diario a partir de esa fecha.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Motivo del chequeo, ej. "control de hipertensión"' },
        frequencyMonths: { type: 'number', description: 'Cada cuántos meses debería chequearse' },
      },
      required: ['reason', 'frequencyMonths'],
    },
  },
  {
    name: 'confirm_appointment_scheduled',
    description: 'El paciente ya agendó hora con su médico. Detiene los recordatorios diarios y guarda la fecha agendada.',
    parameters: {
      type: 'object',
      properties: {
        scheduledFor: { type: 'string', description: 'Fecha y hora agendada, formato ISO 8601' },
      },
      required: ['scheduledFor'],
    },
  },
  {
    name: 'complete_appointment_followup',
    description:
      'Registra lo que dijo el doctor tras la cita ya realizada y cierra el ciclo, abriendo el próximo con la frecuencia indicada (o la misma anterior si no cambió).',
    parameters: {
      type: 'object',
      properties: {
        doctorFeedback: { type: 'string', description: 'Resumen de lo que dijo/indicó el doctor' },
        nextFrequencyMonths: { type: 'number', description: 'Nueva frecuencia sugerida para el próximo chequeo, si cambió' },
      },
      required: ['doctorFeedback'],
    },
  },
];

function monthsFromNow(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// Actual DB side-effects. Each handler receives (userId, args) and returns a small JSON
// result that gets fed back to the model so it can phrase a natural reply.
export const toolHandlers = {
  async add_medication(userId, { name, dosage, frequency, reason }) {
    const med = await Medication.create({
      userId,
      name,
      dosage,
      frequency,
      reason,
      startDate: new Date().toISOString().slice(0, 10),
    });
    return { ok: true, medicationId: med.id };
  },

  async update_medication(userId, { name, dosage, frequency, active }) {
    const med = await Medication.findOne({ where: { userId, name } });
    if (!med) return { ok: false, error: `No se encontró "${name}" en el perfil del paciente` };
    await med.update({
      ...(dosage !== undefined && { dosage }),
      ...(frequency !== undefined && { frequency }),
      ...(active !== undefined && { active }),
    });
    return { ok: true };
  },

  async record_health_metric(userId, { type, value, systolic, diastolic, notes }) {
    const metric = await HealthMetric.create({ userId, type, value, systolic, diastolic, notes });
    return { ok: true, healthMetricId: metric.id };
  },

  async schedule_checkup(userId, { reason, frequencyMonths }) {
    const appt = await Appointment.create({
      userId,
      reason,
      suggestedFrequencyMonths: frequencyMonths,
      status: 'pending_schedule',
      dueDate: new Date().toISOString().slice(0, 10), // ponytail: reminders start now; delaying the first nudge isn't in scope.
    });
    return { ok: true, appointmentId: appt.id };
  },

  async confirm_appointment_scheduled(userId, { scheduledFor }) {
    const appt = await Appointment.findOne({
      where: { userId, status: 'pending_schedule' },
      order: [['dueDate', 'DESC']],
    });
    if (!appt) return { ok: false, error: 'No hay un chequeo pendiente de agendar' };
    await appt.update({ status: 'scheduled', scheduledFor });
    return { ok: true, appointmentId: appt.id };
  },

  async complete_appointment_followup(userId, { doctorFeedback, nextFrequencyMonths }) {
    const appt = await Appointment.findOne({
      where: { userId, status: ['scheduled', 'followup_pending'] },
      order: [['scheduledFor', 'DESC']],
    });
    if (!appt) return { ok: false, error: 'No hay una cita reciente esperando seguimiento' };

    await appt.update({ status: 'completed', doctorFeedback, completedAt: new Date() });

    const months = nextFrequencyMonths || appt.suggestedFrequencyMonths || 6;
    const next = await Appointment.create({
      userId,
      reason: appt.reason,
      suggestedFrequencyMonths: months,
      status: 'pending_schedule',
      dueDate: monthsFromNow(months),
    });
    return { ok: true, completedAppointmentId: appt.id, nextAppointmentId: next.id, nextDueDate: next.dueDate };
  },
};

export async function callTool(name, userId, args) {
  const handler = toolHandlers[name];
  if (!handler) return { ok: false, error: `Función desconocida: ${name}` };
  return handler(userId, args);
}

// Context the model needs to reason well: current profile, active meds, open appointment cycle.
export async function buildPatientContext(userId) {
  const [user, medications, openAppointment, recentMetrics] = await Promise.all([
    User.findByPk(userId),
    Medication.findAll({ where: { userId, active: true } }),
    Appointment.findOne({
      where: { userId, status: { [Op.ne]: 'completed' } },
      order: [['createdAt', 'DESC']],
    }),
    HealthMetric.findAll({ where: { userId }, order: [['recordedAt', 'DESC']], limit: 5 }),
  ]);
  return { user, medications, openAppointment, recentMetrics };
}
