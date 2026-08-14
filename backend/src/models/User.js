import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class User extends Model {}

User.init(
  {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    passwordSalt: { type: DataTypes.STRING, allowNull: false },
    // Opaque bearer token, valid until logout (or another login overwrites it) — no
    // refresh/expiry flow, out of scope for this app.
    sessionToken: { type: DataTypes.STRING, allowNull: true, unique: true },
    sex: { type: DataTypes.ENUM('female', 'male', 'other'), allowNull: true },
    // ponytail: raw age (not birthDate) because that's literally what the form asks for; revisit if "age drifts" ever matters.
    age: { type: DataTypes.INTEGER, allowNull: true },
    heightCm: { type: DataTypes.FLOAT, allowNull: true },
    weightKg: { type: DataTypes.FLOAT, allowNull: true },
    expoPushToken: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: 'user',
    // Auth secrets never leak through a normal query (profile responses, the AI's patient
    // context, medication `include: User`, ...) — routes that actually need them opt in
    // with `User.scope('withSecrets')`.
    defaultScope: { attributes: { exclude: ['passwordHash', 'passwordSalt', 'sessionToken'] } },
    scopes: { withSecrets: { attributes: {} } },
  }
);
