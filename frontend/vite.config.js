import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import http from 'node:http';

const proxyAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 10000,
  maxSockets: 100
});

const proxyConfig = {
  target: 'http://127.0.0.1:5060',
  changeOrigin: true,
  agent: proxyAgent,
  timeout: 120000,
  proxyTimeout: 120000,
  configure: (proxy) => {
    // Intercept proxy error emissions to cleanly handle and silence benign client-side aborts / ECONNRESET
    const originalEmit = proxy.emit;
    proxy.emit = function (event, ...args) {
      if (event === 'error') {
        const [err, req, res] = args;
        const isClientAbort =
          err?.code === 'ECONNRESET' ||
          err?.code === 'EPIPE' ||
          err?.code === 'ERR_STREAM_PREMATURE_CLOSE' ||
          err?.message?.includes('socket hang up') ||
          req?.destroyed ||
          res?.destroyed ||
          res?.socket?.destroyed;

        if (isClientAbort) {
          // Client cleanly aborted or disconnected (browser navigation, page refresh, or request cancellation)
          if (res && !res.headersSent && !res.writableEnded && typeof res.end === 'function') {
            try {
              res.end();
            } catch {
              // Socket already ended
            }
          }
          // Return false to suppress Vite's default logger from dumping red ECONNRESET stack traces in terminal
          return false;
        }

        // True backend connection error (e.g. backend server down / ECONNREFUSED): respond with structured 502
        if (res && !res.headersSent && !res.writableEnded && typeof res.writeHead === 'function') {
          try {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              message: 'Unable to communicate with the backend server. Please verify the backend is running on http://127.0.0.1:5060.',
              errorCode: 'BACKEND_GATEWAY_ERROR',
              detail: err?.message || 'Proxy connection error'
            }));
          } catch {
            // Ignore response write error if socket closed
          }
        }
      }
      return originalEmit.apply(this, [event, ...args]);
    };
  }
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5174,
    proxy: {
      '/api': proxyConfig
    }
  },
  preview: {
    port: 5174,
    proxy: {
      '/api': proxyConfig
    }
  }
});
