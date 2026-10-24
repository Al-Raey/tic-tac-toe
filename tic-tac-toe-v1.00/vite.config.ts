import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Keep the development server bound to the local machine by default.
  // Do not expose it to the LAN unless a developer deliberately opts in.
  server: { host: '127.0.0.1' },
  // Preview is a separate server; bind it explicitly as well.
  preview: { host: '127.0.0.1' },
});
