import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import conversationRoutes from './routes/conversation.js';
import messageRoutes from './routes/messages.js';
import adminRoutes from './routes/admin.js';
import registrationRequestRoutes from './routes/registrationRequests.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json());
app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/conversations', conversationRoutes);
app.use('/messages', messageRoutes);
app.use('/admin', adminRoutes);
app.use('/registration-requests', registrationRequestRoutes);

app.get('/', (req, res) => {
  res.send('API running');
});

export default app;