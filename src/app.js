//Configuración de express
import bodyParser from "body-parser";
import express from "express";
import usersRoutes from "./routes/usersRoutes.js";
import swaggerSpec from "./api-docs.js"
import swaggerUI from "swagger-ui-express"
import dotenv from 'dotenv';
import { startClienteConsumer } from "./services/clienteConsumerService.js";
import { connectWithRetry } from "./config/bd.js";

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use("/app/users", usersRoutes);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// Inicializar base de datos y asociaciones
connectWithRetry().then(success => {
  if (success) {
      
    // Iniciar consumidor de eventos de cliente
    startClienteConsumer().catch(err => {
      console.error("Error iniciando consumidor de clientes:", err);
    });
  } else {
    console.error("No se pudo conectar a la base de datos. Servicio en estado degradado.");
  }
});

export default app;
