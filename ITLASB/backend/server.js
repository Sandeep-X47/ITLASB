require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const routes   = require('./routes/index');
const { startSimulation, attachIO } = require('./services/simulation');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Socket.IO
io.on('connection', socket => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`❌ Client disconnected: ${socket.id}`));
});

attachIO(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`\n🚀 ITLASB Backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready`);
  try {
    await startSimulation();
  } catch (err) {
    console.warn('⚠️  Simulation failed to start (DB may not be ready):', err.message);
  }
});
