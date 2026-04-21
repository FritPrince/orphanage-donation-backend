import path from 'path';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
