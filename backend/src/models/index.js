import { sequelize } from '../config/database.js';
import { User } from './User.js';
import { HealthMetric } from './HealthMetric.js';
import { Medication } from './Medication.js';
import { Appointment } from './Appointment.js';
import { Doctor } from './Doctor.js';
import { AuditLog } from './AuditLog.js';

for (const Model of [HealthMetric, Medication, Appointment]) {
  User.hasMany(Model, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Model.belongsTo(User, { foreignKey: 'userId' });
}

// Cita ↔ médico: nullable porque el flujo del paciente (schedule_checkup) no elige médico
// todavía — se puebla luego (seed o PUT /api/appointments/:id) para que "Mis pacientes" tenga datos.
Doctor.hasMany(Appointment, { foreignKey: 'doctorId' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId' });

// Registro de auditoría: quién (doctor), cuándo (createdAt) y qué paciente (user) abrió la ficha.
Doctor.hasMany(AuditLog, { foreignKey: 'doctorId', onDelete: 'CASCADE' });
AuditLog.belongsTo(Doctor, { foreignKey: 'doctorId' });
User.hasMany(AuditLog, { foreignKey: 'patientId', onDelete: 'CASCADE' });
AuditLog.belongsTo(User, { foreignKey: 'patientId' });

export { sequelize, User, HealthMetric, Medication, Appointment, Doctor, AuditLog };
