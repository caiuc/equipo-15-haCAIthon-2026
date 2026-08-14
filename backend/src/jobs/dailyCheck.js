import cron from 'node-cron';
import { Op } from 'sequelize';
import { Appointment, User } from '../models/index.js';
import { sendPushNotification } from '../services/pushNotifications.js';

const todayStr = () => new Date().toISOString().slice(0, 10);

export async function runDailyCheck() {
  const today = todayStr();

  // 1. Chequeos vencidos aún sin agendar: recordatorio diario hasta que el paciente agende.
  const pending = await Appointment.findAll({
    where: {
      status: 'pending_schedule',
      dueDate: { [Op.lte]: today },
      [Op.or]: [{ lastNotifiedAt: null }, { lastNotifiedAt: { [Op.lt]: today } }],
    },
    include: User,
  });
  for (const appt of pending) {
    await sendPushNotification(appt.user?.expoPushToken, 'Sanito', 'Toma hora con tu médico de confianza');
    await appt.update({ lastNotifiedAt: today });
  }

  // 2. Citas ya pasadas que siguen "scheduled": pedir seguimiento post-consulta.
  //    Usamos "< hoy" (no "= ayer") para autorecuperarse si el cron no corrió algún día.
  const dueFollowup = await Appointment.findAll({
    where: { status: 'scheduled', scheduledFor: { [Op.lt]: today } },
    include: User,
  });
  for (const appt of dueFollowup) {
    await sendPushNotification(appt.user?.expoPushToken, 'Sanito', '¿Cómo te fue ayer? ¿Qué te dijo el doctor?');
    await appt.update({ status: 'followup_pending' });
  }
}

export function startDailyCronJob() {
  const schedule = process.env.CRON_SCHEDULE || '0 9 * * *'; // 9am todos los días
  cron.schedule(schedule, runDailyCheck);
  console.log(`Cron diario de chequeos activo (${schedule})`);
}
