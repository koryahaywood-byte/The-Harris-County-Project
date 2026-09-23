import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The race board replaced the 2026 Ballot tool (Sep 2026). Query strings (?q=) carry over.
      { source: "/tools/ballot-2026", destination: "/races", permanent: true },
    ];
  },
};

export default nextConfig;
