import { User } from '../models/index.js';

// Resolves the bearer token to the owning user and puts it on ctx.state.user — every
// scoped route (profile, medications, health-metrics, appointments, chat) reads the
// user id from here, never from a client-supplied param, so one account can't touch
// another's data.
export async function requireAuth(ctx, next) {
  const header = ctx.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return ctx.throw(401, 'No autenticado');

  // Looked up via the secrets scope (sessionToken isn't in the default one) but exposed on
  // ctx.state as the plain public shape — every route can safely `ctx.body = ctx.state.user`.
  const authed = await User.scope('withSecrets').findOne({ where: { sessionToken: token } });
  if (!authed) return ctx.throw(401, 'Sesión inválida o expirada');

  ctx.state.user = await User.findByPk(authed.id);
  await next();
}
