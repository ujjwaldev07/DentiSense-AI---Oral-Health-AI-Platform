import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import mongoose from 'mongoose';

const HOST = '0.0.0.0';

// Global uncaught exception and unhandled rejection guards
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [PROCESS GUARD] Unhandled Promise Rejection at:', promise, 'reason:', reason);
  // Do not crash the entire process for non-fatal async errors
});

process.on('uncaughtException', (error) => {
  console.error('💥 [PROCESS GUARD] Uncaught Exception:', error.message, error.stack);
  // Allow running server to clean up rather than abruptly resetting sockets
});

const startServer = async () => {
  try {
    // Start listening on HTTP port immediately to prevent ECONNREFUSED during frontend startup
    const server = app.listen(ENV.PORT, HOST, () => {
      console.log(`\n======================================================`);
      console.log(`🦷 DentiSense AI — AI-Powered Oral Health & Dental Disease Prediction Platform`);
      console.log(`🚀 Server listening on http://localhost:${ENV.PORT} (${HOST}:${ENV.PORT})`);
      console.log(`🩺 Mode: ${ENV.NODE_ENV}`);
      console.log(`🤖 Gemini Model: ${ENV.GEMINI_MODEL}`);
      console.log(`======================================================\n`);
    });

    // Configure resilient keep-alive socket timeouts (exceeding standard 60s proxy timeouts)
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    // Connect to database in the background without blocking port availability
    connectDB().catch((dbErr) => {
      console.error('❌ MongoDB initial background connection error:', dbErr.message);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${ENV.PORT} is already in use by another process.`);
        console.error(`👉 Please ensure any previous server instance on port ${ENV.PORT} is stopped before starting a new one.\n`);
      } else {
        console.error('❌ Server error:', error.message);
      }
      process.exit(1);
    });

    let isShuttingDown = false;
    const shutdown = (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log(`\nReceived ${signal}. Shutting down server gracefully...`);

      // Force close sockets if they do not close within timeout
      const forceExitTimer = setTimeout(() => {
        console.warn('⚠️ Forcing shutdown after timeout.');
        process.exit(1);
      }, 5000);
      forceExitTimer.unref();

      // Close all active connections (Node.js 18.2+)
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }

      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close(false);
            console.log('MongoDB connection closed.');
          }
        } catch (dbErr) {
          console.error('Error closing MongoDB connection:', dbErr.message);
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Fatal server startup error:', error.message);
    process.exit(1);
  }
};

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'DentiSense AI API',
    timestamp: new Date().toISOString()
  });
});

startServer();
