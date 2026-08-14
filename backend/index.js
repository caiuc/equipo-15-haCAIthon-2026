import { app } from './src/app.js';
import { sequelize } from './src/models/index.js';
import { startDailyCronJob } from './src/jobs/dailyCheck.js';

const PORT = process.env.PORT || 3001;

await sequelize.sync();
startDailyCronJob();
app.listen(PORT, () => {
  console.log(`Sanito backend en http://localhost:${PORT}`);
});
