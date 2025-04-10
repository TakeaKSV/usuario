import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

export const validateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Log the Authorization header for debugging
    logger.info(`Authorization header: ${authHeader}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.error('Authorization header missing or malformed');
      return res.status(401).json({ error: 'Token de autorización no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      logger.error('Token missing in Authorization header');
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const SECRET_KEY = "c9PcgRFL2S8n0NYQp6MZUbbxRgTRHJxjYnvux54VrnA=";
    const decoded = jwt.verify(token, SECRET_KEY);

    // Log the decoded token for debugging
    logger.info(`Decoded token: ${JSON.stringify(decoded)}`);

    // Ensure the decoded token contains the required properties
    if (!decoded || !decoded.role) {
      logger.error('Decoded token is invalid or missing required properties');
      return res.status(401).json({ error: 'Token inválido o incompleto' });
    }

    req.user = decoded; // Assign the decoded token to req.user
    next();
  } catch (error) {
    logger.error(`Error al validar token: ${error.message}`);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso no autorizado. Se requiere rol de administrador.' });
  }
  next();
};