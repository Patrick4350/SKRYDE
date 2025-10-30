import app from './app';

const PORT = process.env.PORT || 5001;
console.log(`Connection String: ${process.env.DATABASE_URL}`);

app.listen(PORT, () => {
  console.log(`dYs- SKRYDE backend server running on port ${PORT}`);
  console.log(`dY"S Health check: http://localhost:${PORT}/api/health`);
  console.log(`Connection String: ${process.env.DATABASE_URL}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

export default app;

