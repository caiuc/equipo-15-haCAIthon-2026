import Router from '@koa/router';
import { requireAuth } from '../middleware/requireAuth.js';

export const usersRouter = new Router({ prefix: '/api/users' });
usersRouter.use(requireAuth);

// Only "me" — there's no route to read or edit another account's profile by id anymore.
usersRouter.get('/me', async (ctx) => {
  ctx.body = ctx.state.user;
});

usersRouter.put('/me', async (ctx) => {
  const { name, sex, age, heightCm, weightKg, expoPushToken } = ctx.request.body;
  await ctx.state.user.update({
    ...(name !== undefined && { name }),
    ...(sex !== undefined && { sex }),
    ...(age !== undefined && { age }),
    ...(heightCm !== undefined && { heightCm }),
    ...(weightKg !== undefined && { weightKg }),
    ...(expoPushToken !== undefined && { expoPushToken }),
  });
  ctx.body = ctx.state.user;
});
