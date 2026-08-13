/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // @clickhouse/client dipakai di server saja.
  serverExternalPackages: ["@clickhouse/client"],
};
export default nextConfig;
