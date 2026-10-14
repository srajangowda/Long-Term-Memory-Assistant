import { app } from './app';

const PORT = process.env.PORT || 5000;
const PROVIDER = process.env.LLM_PROVIDER || 'gemini';
const MODEL = PROVIDER === 'gemini' 
  ? (process.env.GEMINI_MODEL || 'gemini-2.5-flash')
  : (process.env.MOCK_MODEL || 'mock-model');
const HAS_KEY = Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith('replace_with'));

const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🤖 Long-Term Memory Assistant - Backend`);
  console.log(`   Phase 1: Basic AI Chat Foundation`);
  console.log(`=========================================`);
  console.log(`🚀 Server running on:  http://localhost:${PORT}`);
  console.log(`🧠 LLM Provider:       ${PROVIDER}`);
  console.log(`🎯 Active Model:       ${MODEL}`);
  console.log(`🔑 API Key Status:     ${PROVIDER === 'mock' ? 'Not Required (Mock Mode)' : HAS_KEY ? 'Configured ✅' : 'Missing / Unconfigured ⚠️'}`);
  console.log(`=========================================`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
