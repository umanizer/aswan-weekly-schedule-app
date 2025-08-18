/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 本番ビルド時にESLintエラーを無視（警告のみ）
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;