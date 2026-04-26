/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    "@dnd-agent/ui",
    "@dnd-agent/shared",
    "@dnd-agent/map-editor",
    "@dnd-agent/narrative-editor",
    "@dnd-agent/dm-terminal",
    "@dnd-agent/three-engine",
  ],
};

export default nextConfig;
