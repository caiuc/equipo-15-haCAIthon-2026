import Router from '@koa/router';
import { User, Appointment, Medication, HealthMetric, AuditLog } from '../models/index.js';
import { requireDoctorAuth } from '../middleware/requireDoctorAuth.js';
import { flagAlert } from '../services/alerts.js';

export const doctorPatientsRouter = new Router({ prefix: '/api/doctor/patients' });
doctorPatientsRouter.use(requireDoctorAuth);

// "Mis pacientes": todo paciente con al menos una cita agendada con este médico.
// ponytail: opción A (elegida por el usuario) — no valida que la cita esté vigente/próxima,
// solo que exista. Upgrade a opción B: filtrar por status 'scheduled' + scheduledFor futuro.
doctorPatientsRouter.get('/', async (ctx) => {
  const appointments = await Appointment.findAll({
    where: { doctorId: ctx.state.doctor.id },
    include: User,
    order: [['scheduledFor', 'DESC']],
  });

  const seen = new Set();
  const patients = [];
  for (const appt of appointments) {
    if (!appt.user || seen.has(appt.user.id)) continue;
    seen.add(appt.user.id);
    patients.push({ ...appt.user.toJSON(), appointmentStatus: appt.status, scheduledFor: appt.scheduledFor });
  }
  ctx.body = patients;
});

// Ficha del paciente: solo si tiene alguna cita con este médico (mismo criterio que la lista).
// Cada apertura queda registrada en AuditLog (quién, cuándo, qué paciente).
doctorPatientsRouter.get('/:id', async (ctx) => {
  const patientId = ctx.params.id;
  const hasAppointment = await Appointment.findOne({ where: { doctorId: ctx.state.doctor.id, userId: patientId } });
  if (!hasAppointment) return ctx.throw(404, 'Paciente no encontrado en tu agenda');

  const [patient, medications, metrics] = await Promise.all([
    User.findByPk(patientId),
    Medication.findAll({ where: { userId: patientId, active: true } }),
    HealthMetric.findAll({ where: { userId: patientId }, order: [['recordedAt', 'DESC']] }),
  ]);
  if (!patient) return ctx.throw(404, 'Paciente no encontrado');

  await AuditLog.create({ doctorId: ctx.state.doctor.id, patientId: patient.id });

  const metricsWithAlerts = metrics.map((m) => ({ ...m.toJSON(), alert: flagAlert(m) }));

  ctx.body = {
    patient,
    // No hay campo de "condición crónica" en el perfil — se infiere del motivo de los
    // medicamentos activos, que es lo único que el modelo actual registra.
    conditions: [...new Set(medications.map((m) => m.reason).filter(Boolean))],
    medications,
    metrics: metricsWithAlerts,
    alerts: metricsWithAlerts.filter((m) => m.alert),
  };
});
