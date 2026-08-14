import Router from '@koa/router';
import { runChat } from '../ai/client.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const chatRouter = new Router({ prefix: '/api/chat' });

// Stateless by design: the client holds the conversation `history` (the LLM provider's own
// message shape) and resends it each turn — no Message/Conversation table needed.
chatRouter.post('/', requireAuth, async (ctx) => {
  const { message, history } = ctx.request.body;
  if (!message) return ctx.throw(400, 'message es requerido');

  // userId comes from the session, never from the request body — the bot can only ever
  // see and act on the logged-in user's own data.
  const result = await runChat(ctx.state.user.id, message, history || []);
  ctx.body = result;
});
