import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import removeConsole from 'vite-plugin-remove-console';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  imports: false,
  manifest: {
    name: 'JobZap',
    description: 'LinkedIn job filter',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['https://www.linkedin.com/*'],
  },
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  vite: (env) => ({
    plugins: [
      tailwindcss(),
      ...(env.mode === 'production'
        ? [removeConsole({ includes: ['log'] })]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }),
});
