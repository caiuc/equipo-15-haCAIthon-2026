import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Medication extends Model {}

Medication.init(
  {
    name: { type: DataTypes.STRING, allowNull: false }, // e.g. "Losartán"
    dosage: { type: DataTypes.STRING, allowNull: true }, // e.g. "50mg"
    frequency: { type: DataTypes.STRING, allowNull: true }, // e.g. "1 vez al día"
    reason: { type: DataTypes.STRING, allowNull: true }, // condition it treats, e.g. "hipertensión"
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
  },
  { sequelize, modelName: 'medication' }
);
