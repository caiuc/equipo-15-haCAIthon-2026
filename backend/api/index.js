import { app } from '../src/app.js';
import { sequelize } from '../src/models/index.js';

// ponytail: sync on cold start only, guarded by module-level flag so a warm
// container (reused across invocations) doesn't re-run it on every request.
let synced = false;
const callback = app.callback();

export default async function handler(req, res) {
  if (!synced) {
    await sequelize.sync();
    synced = true;
  }
  return callback(req, res);
}
