import { HealthMetric, Medication, Appointment } from '../models/index.js';
import { authRouter } from './auth.js';
import { usersRouter } from './users.js';
import { chatRouter } from './chat.js';
import { makeAuthScopedCrud } from './crud.js';
import { doctorAuthRouter } from './doctorAuth.js';
import { doctorPatientsRouter } from './doctorPatients.js';

export const routers = [
  authRouter,
  usersRouter,
  chatRouter,
  makeAuthScopedCrud(HealthMetric, 'health-metrics'),
  makeAuthScopedCrud(Medication, 'medications'),
  makeAuthScopedCrud(Appointment, 'appointments'),
  doctorAuthRouter,
  doctorPatientsRouter,
];
