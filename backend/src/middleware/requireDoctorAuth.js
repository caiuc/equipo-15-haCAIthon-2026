import { Doctor } from '../models/index.js';

// Same pattern as requireAuth, but for the doctor bearer token — kept as a separate
// middleware/table so a patient session can never open the doctor panel and vice versa.
export async function requireDoctorAuth(ctx, next) {
  const header = ctx.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return ctx.throw(401, 'No autenticado');

  const authed = await Doctor.scope('withSecrets').findOne({ where: { sessionToken: token } });
  if (!authed) return ctx.throw(401, 'Sesión inválida o expirada');

  ctx.state.doctor = await Doctor.findByPk(authed.id);
  await next();
}
