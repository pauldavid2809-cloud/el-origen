/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Demo para el cliente (página estática en public/demo, con datos de ejemplo).
  async rewrites() {
    return [{ source: "/demo", destination: "/demo/index.html" }];
  },
};

module.exports = nextConfig;
