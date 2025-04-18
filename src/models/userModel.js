import { DataTypes } from "sequelize";
import sequelize from "../config/bd.js";

export const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  role: {
    type: DataTypes.ENUM("cliente", "admin"),
    allowNull: false,
    defaultValue: "cliente",
  },
  status: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  creationDate: {
    type    : DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
    timestamps: false, // Desactiva createdAt y updatedAt
    tableName: "users", //Debe coincidir con el nombre de la tabla
});

export default User;  // Mantén esta línea para compatibilidad con otros imports
