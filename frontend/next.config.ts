import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // dev 環境用 Docker 部署，只放執行需要的檔案，image 比較小，見 docs/devops/setup-dev.md
  output: "standalone",
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // 只有本機開發用 Next.js 轉發到後端；其他環境由前面的反向代理轉發，見 docs/devops/
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
