import { promises as fs } from 'fs';
import path from 'path';

// File storage for local development only. Serverless hosts (e.g. Vercel) have a
// read-only/temporary disk, so swap these two functions for Supabase/Firebase.
const FILE = path.join(process.cwd(), 'data', 'complaints.json');

export async function readAll() {
  try { return JSON.parse(await fs.readFile(FILE, 'utf8')); } catch { return []; }
}

export async function add(item) {
  const all = await readAll();
  all.unshift(item); // newest first
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(all.slice(0, 5000)));
}
