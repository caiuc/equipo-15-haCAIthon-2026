import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class HealthMetric extends Model {}

// ponytail: one table with a `type` discriminator instead of separate Weight/Glucose/BloodPressure
// tables — same shape as the spec ("HealthMetric: peso, glucosa, presión"), fewer models to join.
HealthMetric.init(
  {
    type: {
      type: DataTypes.ENUM('weight', 'glucose', 'blood_pressure'),
      allowNull: false,
    },
    value: { type: DataTypes.FLOAT, allowNull: true }, // weight (kg) or glucose (mg/dL)
    systolic: { type: DataTypes.INTEGER, allowNull: true }, // blood_pressure only
    diastolic: { type: DataTypes.INTEGER, allowNull: true }, // blood_pressure only
    recordedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'healthMetric' }
);
