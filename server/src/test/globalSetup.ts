import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '../..');

export default function globalSetup() {
  // Use --skip-generate to avoid Windows EPERM errors from the DLL lock
  // Use --skip-seed since we seed per-test
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    cwd: serverDir,
    stdio: 'inherit',
    env: { ...process.env },
  });
}
