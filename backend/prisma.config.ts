import { defineConfig } from '@prisma/config';
import process from 'process';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' }); // Relative to backend root

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
