import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const isPagesBuild = Boolean((globalThis as {process?:{env?:Record<string,string>}}).process?.env?.GITHUB_ACTIONS);
export default defineConfig({
  base: isPagesBuild ? '/Onedaycafelife/' : '/',
  plugins:[react()],
  test:{include:['src/tests/**/*.test.ts']}
} as any);
