import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  console.log("==> command", command)
  console.log("==> mode", mode)
  
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  console.log("Loaded environment variables:", env);
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    define: {
      // Expose environment variables to the client
      // Only expose variables that start with VITE_
      ...Object.keys(env).reduce((acc, key) => {
        if (key.startsWith('VITE_')) {
          acc[`process.env.${key}`] = JSON.stringify(env[key]);
        }
        return acc;
      }, {} as Record<string, string>),
    },
  }
});
