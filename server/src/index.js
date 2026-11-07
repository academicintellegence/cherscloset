import 'express-async-errors';
import mongoose from 'mongoose';
import { config } from './config.js';
import app from './app.js';

await mongoose.connect(config.MONGODB_URI);
console.log('MongoDB connected');

app.listen(config.PORT, () => console.log(`API listening on :${config.PORT}`));
