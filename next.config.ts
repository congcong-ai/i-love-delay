import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  // 产出独立可运行的 server.js + 最小依赖集
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'wx.qlogo.cn',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'thirdwx.qlogo.cn',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    // 部署构建时忽略 ESLint 错误，防止阻塞发布流程（本地请用 npm run lint 修复）
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);
