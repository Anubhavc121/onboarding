/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // ⬇⬇⬇ ONLY proxy API calls, NOT /onboarding
    const apiBase =
      process.env.ONBOARDING_API_BASE || "https://onboarding-piym.onrender.com";

    return [
      {
        source: "/api/onboarding/:path*",
        destination: `${apiBase}/onboarding/:path*`,
      },
    ];
  },
};

export default nextConfig;
