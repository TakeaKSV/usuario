import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

export const validateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autorización no proporcionado' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    // Asegúrate que process.env.JWT_SECRET esté configurado con el nuevo valor en .env
    // O modifica directamente:
    const decoded = jwt.verify(token, "c9PcgRFL2S8n0NYQp6MZUbbxRgTRHJxjYnvux54VrnA=");
    req.user = decoded;
    
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