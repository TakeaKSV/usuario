import User from './userModel.js';  // No user.js sino userModel.js
import Role from './Role.js';
import UserRole from './UserRole.js';

export default function setupAssociations() {
  // Relaciones Usuario-Rol (si existen estos modelos)
  User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId' });
  Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId' });
  
  console.log('✅ Asociaciones del servicio de Usuarios establecidas');
}