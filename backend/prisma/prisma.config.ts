import { defineConfig } from '@prisma/config';
import process from 'process';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' }); // Since it's in prisma/ folder, .env might be in root

export default defineConfig({
  schema: 'schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
