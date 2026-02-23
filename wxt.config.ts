import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }),
  manifest: {
    permissions: ['storage', 'activeTab'],
    host_permissions: ['https://www.linkedin.com/*'],
  },
});
