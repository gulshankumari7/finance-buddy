#!/usr/bin/env node
// Finance Buddy — Auto Deploy Script
// Usage: GITHUB_TOKEN=xxx VERCEL_TOKEN=xxx GITHUB_USERNAME=xxx node deploy.mjs

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { createHash } from 'crypto';

const GH_TOKEN = process.env.GITHUB_TOKEN;
const VC_TOKEN = process.env.VERCEL_TOKEN;
const GH_USER  = process.env.GITHUB_USERNAME;
const REPO     = 'finance-buddy';
const VC_TEAM  = 'team_k4Bb2f3AaRXEuXQAehk4kti1';
const SB_URL   = 'https://fkqkkkqjvgikmjtrbwue.supabase.co';
const SB_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrcWtra3Fqdmdpa21qdHJid3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDE1NTIsImV4cCI6MjA5MDUxNzU1Mn0.-gxHs6pgYE-l5korC7K-sPLAENoKB19a4lk_xsp76q4';

if (!GH_TOKEN || !VC_TOKEN || !GH_USER) {
  console.error('Usage: GITHUB_TOKEN=xxx VERCEL_TOKEN=xxx GITHUB_USERNAME=xxx node deploy.mjs');
  process.exit(1);
}

const log = (msg, sym='▸') => console.log(`${sym} ${msg}`);
const ok  = (msg) => console.log(`\x1b[32m✓\x1b[0m ${msg}`);
const err = (msg) => console.log(`\x1b[31m✗\x1b[0m ${msg}`);

async function gh(path, method='GET', body=null) {
  const r = await fetch('https://api.github.com' + path, {
    method,
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
    body: body ? JSON.stringify(body) : null
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || JSON.stringify(d).slice(0,200));
  return d;
}

async function vc(path, method='GET', body=null) {
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(`https://api.vercel.com${path}${sep}teamId=${VC_TEAM}`, {
    method,
    headers: { Authorization: `Bearer ${VC_TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null
  });
  const d = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(d).slice(0,300));
  return d;
}

function walkDir(dir, base='') {
  const SKIP = new Set(['node_modules', '.next', '.git', '.vercel']);
  const SKIP_FILES = new Set(['tsconfig.tsbuildinfo', 'next-env.d.ts', 'package-lock.json']);
  const files = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry) || entry.startsWith('.env')) continue;
    const fullPath = join(dir, entry);
    const relPath  = base ? `${base}/${entry}` : entry;
    if (statSync(fullPath).isDirectory()) {
      files.push(...walkDir(fullPath, relPath));
    } else if (!SKIP_FILES.has(entry)) {
      files.push({ path: relPath, fullPath });
    }
  }
  return files;
}

async function main() {
  console.log('\n\x1b[1m🚀 Finance Buddy Auto-Deploy\x1b[0m\n');

  // ── 1. Create GitHub repo ───────────────────────────────────────────────
  log('Creating GitHub repository...');
  let repoUrl;
  try {
    const repo = await gh('/user/repos', 'POST', {
      name: REPO, description: 'Finance Buddy — Smart Personal Finance Tracker (Next.js + Supabase)',
      private: false, auto_init: false
    });
    repoUrl = repo.html_url;
    ok(`Repo created: ${repoUrl}`);
  } catch(e) {
    if (e.message.includes('already exists')) {
      repoUrl = `https://github.com/${GH_USER}/${REPO}`;
      ok(`Repo already exists — using it`);
    } else { err(e.message); process.exit(1); }
  }

  // ── 2. Get base SHA ─────────────────────────────────────────────────────
  let baseSha = null;
  try {
    const ref = await gh(`/repos/${GH_USER}/${REPO}/git/ref/heads/main`);
    baseSha = ref.object.sha;
  } catch(e) {}

  // ── 3. Read & upload all files as blobs ────────────────────────────────
  const srcDir = new URL('.', import.meta.url).pathname;
  const fileList = walkDir(srcDir);
  log(`Uploading ${fileList.length} source files to GitHub...`);

  const BATCH = 8;
  const blobs = [];
  for (let i = 0; i < fileList.length; i += BATCH) {
    const batch = fileList.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(async ({ path, fullPath }) => {
      const content = readFileSync(fullPath);
      let data, encoding;
      try { data = content.toString('utf-8'); encoding = 'utf-8'; }
      catch(_) { data = content.toString('base64'); encoding = 'base64'; }
      const blob = await gh(`/repos/${GH_USER}/${REPO}/git/blobs`, 'POST', { content: data, encoding });
      return { path, sha: blob.sha, mode: '100644', type: 'blob' };
    }));
    blobs.push(...results);
    process.stdout.write(`\r  ${Math.min(i+BATCH, fileList.length)}/${fileList.length} files...`);
  }
  console.log();

  // ── 4. Create tree + commit + push ─────────────────────────────────────
  log('Creating commit...');
  const tree   = await gh(`/repos/${GH_USER}/${REPO}/git/trees`, 'POST',
    { tree: blobs, ...(baseSha ? { base_tree: baseSha } : {}) });
  const commit = await gh(`/repos/${GH_USER}/${REPO}/git/commits`, 'POST',
    { message: 'feat: Finance Buddy initial release\n\nNext.js 15 + Supabase + Recharts finance tracker',
      tree: tree.sha, parents: baseSha ? [baseSha] : [] });
  try {
    await gh(`/repos/${GH_USER}/${REPO}/git/refs/heads/main`, 'PATCH', { sha: commit.sha, force: true });
  } catch(_) {
    await gh(`/repos/${GH_USER}/${REPO}/git/refs`, 'POST', { ref: 'refs/heads/main', sha: commit.sha });
  }
  ok(`${fileList.length} files pushed to GitHub!`);

  // ── 5. Create Vercel project ────────────────────────────────────────────
  log('Creating Vercel project...');
  let projectId;
  try {
    const proj = await vc('/v11/projects', 'POST', {
      name: REPO, framework: 'nextjs',
      gitRepository: { type: 'github', repo: `${GH_USER}/${REPO}` },
      environmentVariables: [
        { key: 'NEXT_PUBLIC_SUPABASE_URL',      value: SB_URL, type: 'plain',     target: ['production','preview','development'] },
        { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: SB_KEY, type: 'encrypted', target: ['production','preview','development'] }
      ]
    });
    projectId = proj.id;
    ok(`Vercel project created: ${proj.name}`);
  } catch(e) {
    if (e.message.includes('already exists') || e.message.includes('A project with that name')) {
      const p = await vc(`/v9/projects/${REPO}`);
      projectId = p.id;
      ok(`Vercel project found: ${projectId}`);
    } else { err(e.message); process.exit(1); }
  }

  // ── 6. Trigger production deployment ───────────────────────────────────
  log('Triggering production deployment...');
  const dep = await vc('/v13/deployments', 'POST', {
    name: REPO, project: projectId, target: 'production',
    gitSource: { type: 'github', org: GH_USER, repo: REPO, ref: 'main' }
  });
  ok(`Deployment queued! Status: ${dep.status || 'QUEUED'}`);

  // ── Done ────────────────────────────────────────────────────────────────
  const liveUrl = `https://${REPO}.vercel.app`;
  console.log(`
\x1b[1m\x1b[32m🎉 Finance Buddy is deploying!\x1b[0m

  🌐 Live URL (ready in ~2 min): ${liveUrl}
  📁 GitHub repo:                ${repoUrl}
  ⚡ Vercel dashboard:           https://vercel.com/dashboard
  ${dep.inspectorUrl ? `🔍 Build inspector:            ${dep.inspectorUrl}` : ''}

\x1b[33m📌 Final step:\x1b[0m Go to Supabase Dashboard → Authentication → URL Configuration
   and set Site URL to: ${liveUrl}
`);
}

main().catch(e => { err(e.message); process.exit(1); });
