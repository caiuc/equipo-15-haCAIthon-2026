import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import { routers } from './routes/index.js';

export const app = new Koa();

app.use(cors());
app.use(bodyParser());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    // A stale userId (client cached one from before a DB reset, or a deleted profile) trips
    // this FK constraint deep in Sequelize/SQLite — surface it as the same clean 404 the
    // routes already use instead of leaking the raw SQLite error string.
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      ctx.status = 404;
      ctx.body = { error: 'Usuario no encontrado. Vuelve a guardar tu perfil para crear uno nuevo.' };
      return;
    }
    ctx.status = err.status || 500;
    ctx.body = { error: err.message };
  }
});

for (const router of routers) {
  app.use(router.routes()).use(router.allowedMethods());
}

app.use(async (ctx) => {
  ctx.body = { status: 'Sanito API operativo' };
});
