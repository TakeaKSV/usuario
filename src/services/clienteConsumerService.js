import amqp from 'amqplib';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import { User } from '../models/userModel.js';

dotenv.config();

const RABBITMQ_EXCHANGE = 'cliente_event';
const RABBITMQ_QUEUE = 'cliente_to_user_queue'; // Cambiado para coincidir con la cola de clientes
const RABBITMQ_ROUTING_KEY = 'cliente.created'; // Cambiado para escuchar el evento correcto

export async function startClienteConsumer() {
  let connection;
  let retries = 0;
  const maxRetries = 5;
  
  while (retries < maxRetries) {
    try {
      connection = await amqp.connect(process.env.RABBITMQ_URL); // Use RABBITMQ_URL here
      
      const channel = await connection.createChannel();
      
      // Declarar exchange
      await channel.assertExchange(RABBITMQ_EXCHANGE, 'topic', { durable: true });
      
      // Declarar cola
      await channel.assertQueue(RABBITMQ_QUEUE, { durable: true });
      
      // Vincular cola con exchange
      await channel.bindQueue(RABBITMQ_QUEUE, RABBITMQ_EXCHANGE, RABBITMQ_ROUTING_KEY);
      
      logger.info(`[👂] Consumidor esperando mensajes en cola ${RABBITMQ_QUEUE}`);
      
      // Consumir mensajes
      channel.consume(RABBITMQ_QUEUE, async (msg) => {
        try {
          const content = JSON.parse(msg.content.toString());
          logger.info(`[📥] Mensaje recibido: ${JSON.stringify(content)}`);
          
          // Revisar si ya existe un usuario con ese correo
          const userExists = await User.findOne({ where: { username: content.username } });
          
          if (!userExists) {
            // Crear nuevo usuario
            const newUser = await User.create({
              username: content.username,
              password: content.password,
              phone: content.phone,
              status: true,
              creationDate: new Date(),
            });
            
            logger.info(`[✅] Usuario creado para cliente ID ${content.id}: ${newUser.id}`);
            
            // Asignar rol de cliente
            const clientRole = await Role.findOne({ where: { name: 'client' } });
            if (clientRole) {
              await UserRole.create({
                userId: newUser.id,
                roleId: clientRole.id
              });
            }
          } else {
            logger.warn(`[⚠️] Ya existe un usuario con el correo ${content.username}`);
          }
          
          channel.ack(msg);
        } catch (error) {
          logger.error(`[❌] Error procesando mensaje: ${error.message}`);
          // En caso de error, no confirmamos el mensaje para que se reprocese
          channel.nack(msg, false, true);
        }
      });
      
      // Manejo de cierre de conexión
      connection.on('close', () => {
        logger.error('[❌] Conexión RabbitMQ cerrada. Intentando reconectar...');
        setTimeout(startClienteConsumer, 5000);
      });
      
      // Si llegamos aquí, la conexión fue exitosa
      return;
    } catch (error) {
      retries++;
      logger.error(`[❌] Error conectando a RabbitMQ (intento ${retries}/${maxRetries}): ${error.message}`);
      
      if (retries >= maxRetries) {
        logger.error('[❌] Número máximo de intentos alcanzado. No se pudo iniciar el consumidor.');
        throw error;
      }
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}