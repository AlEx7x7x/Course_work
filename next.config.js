// next.config.js (Оновлено)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚨 КРИТИЧНЕ ВИПРАВЛЕННЯ 1: Транспіляція MUI для усунення конфліктів модулів
  transpilePackages: ['@mui/material', '@mui/icons-material', '@mui/system'],

  // Конфігурація Webpack для ігнорування Leaflet на сервері (залишаємо)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push(
        'leaflet',
        'react-leaflet',
      );
    }
    return config;
  },
};

module.exports = nextConfig;