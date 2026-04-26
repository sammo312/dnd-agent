/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    "@dnd-agent/three-engine",
    "@dnd-agent/shared",
    "@dnd-agent/dm-terminal",
    "@dnd-agent/player-terminal",
    "@dnd-agent/ui",
  ],
};

export default nextConfig;
