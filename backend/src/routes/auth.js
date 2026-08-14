import Router from '@koa/router';
import { User } from '../models/index.js';
import { hashPassword, verifyPassword, generateSessionToken } from '../auth/password.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const authRouter = new Router({ prefix: '/api/auth' });

function toPublicUser(user) {
  const { id, name, email, sex, age, heightCm, weightKg, expoPushToken } = user;
  return { id, name, email, sex, age, heightCm, weightKg, expoPushToken };
}

authRouter.post('/register', async (ctx) => {
  const { name, email, password } = ctx.request.body;
  if (!name || !email || !password) return ctx.throw(400, 'name, email y password son requeridos');
  if (password.length < 6) return ctx.throw(400, 'La contraseña debe tener al menos 6 caracteres');

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) return ctx.throw(409, 'Ya existe una cuenta con ese email');

  const { hash, salt } = hashPassword(password);
  const user = await User.scope('withSecrets').create({
    name,
    email: normalizedEmail,
    passwordHash: hash,
    passwordSalt: salt,
    sessionToken: generateSessionToken(),
  });

  ctx.status = 201;
  ctx.body = { token: user.sessionToken, user: toPublicUser(user) };
});

authRouter.post('/login', async (ctx) => {
  const { email, password } = ctx.request.body;
  if (!email || !password) return ctx.throw(400, 'email y password son requeridos');

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.scope('withSecrets').findOne({ where: { email: normalizedEmail } });
  if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    return ctx.throw(401, 'Email o contraseña incorrectos');
  }

  user.sessionToken = generateSessionToken();
  await user.save();

  ctx.body = { token: user.sessionToken, user: toPublicUser(user) };
});

authRouter.post('/logout', requireAuth, async (ctx) => {
  await User.scope('withSecrets').update({ sessionToken: null }, { where: { id: ctx.state.user.id } });
  ctx.status = 204;
});

authRouter.get('/me', requireAuth, async (ctx) => {
  ctx.body = { user: toPublicUser(ctx.state.user) };
});
