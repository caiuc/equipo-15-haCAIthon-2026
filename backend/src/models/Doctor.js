import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Doctor extends Model {}

Doctor.init(
  {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    specialty: { type: DataTypes.STRING, allowNull: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    passwordSalt: { type: DataTypes.STRING, allowNull: false },
    sessionToken: { type: DataTypes.STRING, allowNull: true, unique: true },
  },
  {
    sequelize,
    modelName: 'doctor',
    // Same pattern as User: auth secrets never leak through a normal query, routes that
    // actually need them opt in with `Doctor.scope('withSecrets')`.
    defaultScope: { attributes: { exclude: ['passwordHash', 'passwordSalt', 'sessionToken'] } },
    scopes: { withSecrets: { attributes: {} } },
  }
);
