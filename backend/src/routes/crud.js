import Router from '@koa/router';
import { requireAuth } from '../middleware/requireAuth.js';

// One factory instead of three near-identical CRUD files for HealthMetric/Medication/
// Appointment. Every route requires auth and scopes to `ctx.state.user.id` — never a
// client-supplied id — so one account can't read or write another's data.
export function makeAuthScopedCrud(Model, resource) {
  const router = new Router({ prefix: `/api/${resource}` });
  router.use(requireAuth);

  router.get('/', async (ctx) => {
    ctx.body = await Model.findAll({ where: { userId: ctx.state.user.id }, order: [['createdAt', 'DESC']] });
  });

  router.get('/:id', async (ctx) => {
    const row = await Model.findOne({ where: { id: ctx.params.id, userId: ctx.state.user.id } });
    if (!row) return ctx.throw(404, 'No encontrado');
    ctx.body = row;
  });

  router.post('/', async (ctx) => {
    ctx.body = await Model.create({ ...ctx.request.body, userId: ctx.state.user.id });
    ctx.status = 201;
  });

  router.put('/:id', async (ctx) => {
    const row = await Model.findOne({ where: { id: ctx.params.id, userId: ctx.state.user.id } });
    if (!row) return ctx.throw(404, 'No encontrado');
    ctx.body = await row.update(ctx.request.body);
  });

  router.delete('/:id', async (ctx) => {
    const row = await Model.findOne({ where: { id: ctx.params.id, userId: ctx.state.user.id } });
    if (!row) return ctx.throw(404, 'No encontrado');
    await row.destroy();
    ctx.status = 204;
  });

  return router;
}
