import { Sequelize } from 'sequelize';
import 'dotenv/config';

// ponytail: SQLite file for the hackathon; swap DATABASE_URL to a postgres:// dsn to move to Postgres, Sequelize dialect stays compatible.
export const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, { logging: false })
  : new Sequelize({
      dialect: 'sqlite',
      storage: process.env.SQLITE_PATH || './data.sqlite',
      logging: false,
    });
