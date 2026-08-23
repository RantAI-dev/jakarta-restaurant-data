import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Image runtime ramping untuk self-host (pola sama dengan platform/).
  output: 'standalone',
  // Repo induk punya lockfile sendiri; kunci root ke folder app ini.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default withMDX(config);
