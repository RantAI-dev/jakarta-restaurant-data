import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Image runtime ramping untuk self-host (pola sama dengan platform/).
  // Di Vercel jangan dipakai: platform-nya menjalankan output tracing sendiri,
  // dan 'standalone' membuat build gagal (next-server.js.nft.json tidak ada).
  output: process.env.VERCEL ? undefined : 'standalone',
  // Repo induk punya lockfile sendiri; kunci root ke folder app ini.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default withMDX(config);
