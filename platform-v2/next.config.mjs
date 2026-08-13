/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output → slim Docker runtime image (self-host di Portainer).
  output: "standalone",
};

export default nextConfig;
