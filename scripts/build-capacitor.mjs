import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const apiDir = path.join(rootDir, 'app', 'api');
const backupDir = path.join(rootDir, '.api-backup-tmp');

let movedApi = false;

try {
  if (fs.existsSync(apiDir)) {
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
    fs.renameSync(apiDir, backupDir);
    movedApi = true;
    console.log('Temporarily moved app/api aside for Capacitor static export build...');
  }

  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      CAPACITOR_BUILD: 'true',
    },
  });
} finally {
  if (movedApi && fs.existsSync(backupDir)) {
    fs.renameSync(backupDir, apiDir);
    console.log('Restored app/api after Capacitor static export build.');
  }
}
