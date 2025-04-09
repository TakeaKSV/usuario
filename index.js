import app from './src/app.js';
import dotenv from 'dotenv';
import logger from './src/utils/logger.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`🚀 Servidor de usuarios corriendo en el puerto ${PORT}`);
});