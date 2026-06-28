import { readFile, readdir } from 'fs/promises';
import path from 'path';
import type { AiChatDomain, OkfChunk } from '../types';
import { parseChunkMeta } from './scoreChunks';

const OKF_ROOT = path.resolve(process.cwd(), '../../knowledge/okf');

interface BundleManifest {
  id: string;
  title: string;
  domain: AiChatDomain;
  tags?: string[];
  chunks: Array<{ file: string; id: string }>;
}

function safeResolve(base: string, ...segments: string[]): string | null {
  const resolved = path.resolve(base, ...segments);
  if (!resolved.startsWith(base)) return null;
  return resolved;
}

async function loadBundle(bundleDir: string): Promise<OkfChunk[]> {
  const manifestPath = safeResolve(bundleDir, 'bundle.json');
  if (!manifestPath) return [];

  const raw = await readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(raw) as BundleManifest;
  const tags = manifest.tags ?? [];
  const chunks: OkfChunk[] = [];

  for (const ref of manifest.chunks) {
    const chunkPath = safeResolve(bundleDir, ref.file);
    if (!chunkPath) continue;
    const content = await readFile(chunkPath, 'utf-8');
    chunks.push(
      parseChunkMeta(content, manifest.id, ref.file, manifest.domain, ref.id, tags)
    );
  }

  return chunks;
}

/** Load all OKF chunks from filesystem (server-side API route). */
export async function loadAllOkfChunks(): Promise<OkfChunk[]> {
  const bundlesDir = safeResolve(OKF_ROOT, 'bundles');
  if (!bundlesDir) return [];

  const entries = await readdir(bundlesDir, { withFileTypes: true });
  const all: OkfChunk[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const bundlePath = path.join(bundlesDir, entry.name);
    const chunks = await loadBundle(bundlePath);
    all.push(...chunks);
  }

  return all;
}

/** Load chunks for specific bundle IDs. */
export async function loadOkfChunksByBundles(bundleIds: string[]): Promise<OkfChunk[]> {
  const all = await loadAllOkfChunks();
  if (bundleIds.length === 0) return all;
  return all.filter((c) => bundleIds.includes(c.bundleId));
}