import sequelize from "./bd.js";
import User from "../models/userModel.js";
import Role from "../models/Role.js";
import UserRole from "../models/UserRole.js";
import setupAssociations from "../models/associations.js";

async function initializeDatabase() {
  try {
    // Establecer asociaciones entre modelos
    setupAssociations();
    
    // Sincronizar modelos con la base de datos (crea las tablas si no existen)
    await sequelize.sync({ force: false, alter: true });
    console.log("✅ Base de datos sincronizada correctamente");
    
    // Crear roles por defecto si no existen
    const roles = ['admin', 'user', 'client'];
    for (const roleName of roles) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleName }
      });
      if (created) {
        console.log(`✅ Rol '${roleName}' creado`);
      }
    }
    
    // Crear usuario admin por defecto si no existe
    const [adminUser, created] = await User.findOrCreate({
      where: { username: 'admin@example.com' },
      defaults: {
        password: 'Admin123!',
        phone: '0000000000',
        status: true,
        creationDate: new Date()
      }
    });
    
    if (created) {
      console.log('✅ Usuario administrador creado');
      
      // Asignar rol de administrador
      const adminRole = await Role.findOne({ where: { name: 'admin' } });
      if (adminRole) {
        await UserRole.create({
          userId: adminUser.id,
          roleId: adminRole.id
        });
        console.log('✅ Rol de administrador asignado');
      }
    }
    
    console.log('✅ Inicialización de la base de datos completada');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
    return false;
  }
}

export default initializeDatabase;