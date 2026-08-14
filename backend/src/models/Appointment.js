import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Appointment extends Model {}

// ponytail: one row per checkup cycle, walked through these statuses by the cron job (see step 2).
// When a cycle reaches `completed`, the rules engine creates the *next* cycle as a new row
// instead of resetting this one — keeps history of every past checkup for free.
Appointment.init(
  {
    reason: { type: DataTypes.STRING, allowNull: true }, // e.g. "chequeo hipertensión"
    suggestedFrequencyMonths: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM('pending_schedule', 'scheduled', 'followup_pending', 'completed'),
      allowNull: false,
      defaultValue: 'pending_schedule',
    },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false }, // when daily reminders should start
    scheduledFor: { type: DataTypes.DATE, allowNull: true }, // date/time the user booked
    lastNotifiedAt: { type: DataTypes.DATEONLY, allowNull: true }, // dedupes the daily cron
    doctorFeedback: { type: DataTypes.TEXT, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, modelName: 'appointment' }
);
