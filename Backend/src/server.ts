import app from './app.js';
import http from 'http';
import { initSocket } from './socket.js';
import 'dotenv/config';

const server = http.createServer(app);

initSocket(server);

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});