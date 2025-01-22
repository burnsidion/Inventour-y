import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

//API routes
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});