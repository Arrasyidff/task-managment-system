import { resolve } from 'path';
import { config } from 'dotenv';

// Load test environment variables
config({ path: resolve(__dirname, './.env.test') });