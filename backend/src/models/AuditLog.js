import { Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class AuditLog extends Model {}

// Quién (doctorId), cuándo (createdAt) y qué paciente (patientId) — un médico abrió una ficha.
// FKs vienen de las asociaciones en index.js, no hay campos clínicos acá.
AuditLog.init({}, { sequelize, modelName: 'auditLog', updatedAt: false });
