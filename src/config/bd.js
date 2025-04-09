import dotenv from "dotenv";
import { Sequelize } from "sequelize";
dotenv.config();
const sequelize = new Sequelize(process.env.MYSQL_URL, {
  dialect: "mysql",
  logging: false, // Se puede activar para ver las consultas SQL
});

// Añadir a los archivos de configuración de la base de datos
const connectWithRetry = async (maxRetries = 5, retryInterval = 5000) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await sequelize.authenticate();
      console.log("✅ Conexión a la base de datos establecida");
      
      // Sincronizar modelos con la base de datos
      await sequelize.sync({ alter: true });
      console.log("✅ Tablas sincronizadas con la base de datos");
      
      return true;
    } catch (error) {
      retries++;
      console.error(`❌ Intento ${retries}/${maxRetries} fallido: ${error.message}`);
      console.log(`Reintentando en ${retryInterval/1000} segundos...`);
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
  
  console.error("❌ No se pudo establecer conexión después de múltiples intentos");
  return false;
};

export { connectWithRetry };
export default sequelize;