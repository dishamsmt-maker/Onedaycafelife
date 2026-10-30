import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: import.meta.env.GITHUB_ACTIONS ? '/Onedaycafelife/' : '/',
  plugins:[react()],
  test:{include:['src/tests/**/*.test.ts']}
} as any);
