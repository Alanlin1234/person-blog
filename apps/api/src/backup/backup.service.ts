import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  statSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

const execFileAsync = promisify(execFile);

function parseMysqlUrl(url: string) {
  const u = new URL(url);
  const database = u.pathname.replace(/^\//, '').split('?')[0];
  return {
    host: u.hostname,
    port: u.port || '3306',
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database,
  };
}

/** Resolve SQLite path from DATABASE_URL (path relative to prisma/ per Prisma). */
function sqliteSourcePath(url: string): string {
  const rest = url.replace(/^file:/, '').replace(/^\.\//, '');
  return join(process.cwd(), 'prisma', rest);
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private config: ConfigService) {}

  private backupDir() {
    const dir = this.config.get<string>('BACKUP_DIR') || join(process.cwd(), 'backups');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  async runDump(): Promise<{ file: string; ok: boolean; message?: string }> {
    const url = this.config.get<string>('DATABASE_URL');
    if (!url) {
      return { file: '', ok: false, message: 'DATABASE_URL is not set' };
    }

    if (url.startsWith('file:')) {
      const src = sqliteSourcePath(url);
      if (!existsSync(src)) {
        return { file: '', ok: false, message: `SQLite file not found: ${src}` };
      }
      const name = `sqlite-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
      const out = join(this.backupDir(), name);
      try {
        copyFileSync(src, out);
        this.rotate(14);
        return { file: out, ok: true };
      } catch (e) {
        this.logger.warn(`SQLite backup copy failed: ${(e as Error).message}`);
        return { file: '', ok: false, message: (e as Error).message };
      }
    }

    if (!url.startsWith('mysql://')) {
      return {
        file: '',
        ok: false,
        message: 'DATABASE_URL must be file: (SQLite) or mysql:// for mysqldump',
      };
    }

    const mysqldump = this.config.get<string>('MYSQLDUMP_PATH') || 'mysqldump';
    const { host, port, user, password, database } = parseMysqlUrl(url);
    const name = `dump-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    const out = join(this.backupDir(), name);

    try {
      const { stdout } = await execFileAsync(
        mysqldump,
        ['-h', host, '-P', port, '-u', user, `-p${password}`, '--single-transaction', database],
        { maxBuffer: 64 * 1024 * 1024 },
      );
      writeFileSync(out, stdout, 'utf8');
      this.rotate(14);
      return { file: out, ok: true };
    } catch (e) {
      this.logger.warn(`mysqldump failed: ${(e as Error).message}`);
      return { file: '', ok: false, message: 'mysqldump failed (install client or set MYSQLDUMP_PATH)' };
    }
  }

  private rotate(keepDays: number) {
    const dir = this.backupDir();
    const cutoff = Date.now() - keepDays * 86400 * 1000;
    for (const f of readdirSync(dir)) {
      const isSqlDump = f.endsWith('.sql');
      const isSqliteCopy = f.startsWith('sqlite-backup-') && f.endsWith('.db');
      if (!isSqlDump && !isSqliteCopy) continue;
      const p = join(dir, f);
      try {
        const st = statSync(p);
        if (st.mtimeMs < cutoff) unlinkSync(p);
      } catch {
        /* ignore */
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduled() {
    const r = await this.runDump();
    if (r.ok) this.logger.log(`Backup written: ${r.file}`);
  }
}
