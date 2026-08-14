import Router from '@koa/router';
import { runDailyCheck } from '../jobs/dailyCheck.js';

// ponytail: serverless has no long-lived process for node-cron, so Vercel Cron hits this
// route instead. Vercel auto-sends "Authorization: Bearer $CRON_SECRET" when that env var
// is set, so this doubles as the auth check — see vercel.json's "crons" entry.
export const cronRouter = new Router({ prefix: '/api/cron' });

cronRouter.get('/daily-check', async (ctx) => {
  const secret = process.env.CRON_SECRET;
  if (secret && ctx.headers.authorization !== `Bearer ${secret}`) return ctx.throw(401, 'No autorizado');

  await runDailyCheck();
  ctx.body = { ok: true };
});
