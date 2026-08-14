import Router from '@koa/router';
import { Doctor } from '../models/index.js';
import { hashPassword, verifyPassword, generateSessionToken } from '../auth/password.js';
import { requireDoctorAuth } from '../middleware/requireDoctorAuth.js';

export const doctorAuthRouter = new Router({ prefix: '/api/doctor/auth' });

function toPublicDoctor(doctor) {
  const { id, name, email, specialty } = doctor;
  return { id, name, email, specialty };
}

// No hay panel de administración para dar de alta médicos todavía, así que el registro
// queda abierto igual que el de pacientes (mismo patrón que auth.js). Restringir/mover
// a invitación por admin cuando exista ese panel.
doctorAuthRouter.post('/register', async (ctx) => {
  const { name, email, password, specialty } = ctx.request.body;
  if (!name || !email || !password) return ctx.throw(400, 'name, email y password son requeridos');
  if (password.length < 6) return ctx.throw(400, 'La contraseña debe tener al menos 6 caracteres');

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await Doctor.findOne({ where: { email: normalizedEmail } });
  if (existing) return ctx.throw(409, 'Ya existe una cuenta con ese email');

  const { hash, salt } = hashPassword(password);
  const doctor = await Doctor.scope('withSecrets').create({
    name,
    email: normalizedEmail,
    specialty,
    passwordHash: hash,
    passwordSalt: salt,
    sessionToken: generateSessionToken(),
  });

  ctx.status = 201;
  ctx.body = { token: doctor.sessionToken, doctor: toPublicDoctor(doctor) };
});

doctorAuthRouter.post('/login', async (ctx) => {
  const { email, password } = ctx.request.body;
  if (!email || !password) return ctx.throw(400, 'email y password son requeridos');

  const normalizedEmail = String(email).trim().toLowerCase();
  const doctor = await Doctor.scope('withSecrets').findOne({ where: { email: normalizedEmail } });
  if (!doctor || !verifyPassword(password, doctor.passwordHash, doctor.passwordSalt)) {
    return ctx.throw(401, 'Email o contraseña incorrectos');
  }

  doctor.sessionToken = generateSessionToken();
  await doctor.save();

  ctx.body = { token: doctor.sessionToken, doctor: toPublicDoctor(doctor) };
});

doctorAuthRouter.post('/logout', requireDoctorAuth, async (ctx) => {
  await Doctor.scope('withSecrets').update({ sessionToken: null }, { where: { id: ctx.state.doctor.id } });
  ctx.status = 204;
});

doctorAuthRouter.get('/me', requireDoctorAuth, async (ctx) => {
  ctx.body = { doctor: toPublicDoctor(ctx.state.doctor) };
});
