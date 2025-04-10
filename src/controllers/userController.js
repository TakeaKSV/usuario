import User from "../models/userModel.js";
import { userCreatedEvent } from "../services/rabbitServiceEvent.js";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";

// Función helper para respuestas de error
const errorResponse = (res, status, message) => {
  return res.status(status).json({ error: message });
};

// Middleware para verificar el token
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Log the Authorization header for debugging
  console.log("Authorization header:", authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, "Token no proporcionado o malformado");
  }

  const token = authHeader.split(' ')[1]; // Extract the token after "Bearer"

  try {
    const SECRET_KEY = "c9PcgRFL2S8n0NYQp6MZUbbxRgTRHJxjYnvux54VrnA=";
    const decoded = jwt.verify(token, SECRET_KEY);

    // Log the decoded token for debugging
    console.log("Decoded token:", decoded);

    req.user = decoded.user; // Assign the user object from the token to req.user
    next();
  } catch (error) {
    console.error("Error al verificar el token:", error.message);
    return errorResponse(res, 401, "Token inválido");
  }
};

export const getUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return errorResponse(res, 403, "Acceso denegado: solo los administradores pueden realizar esta operación");
    }

    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    errorResponse(res, 500, "Error al listar usuarios");
  }
};

export const createUser = [
  verifyToken, // Add verifyToken middleware
  async (req, res) => {
    const { username, password, phone } = req.body;

    // Validar campos requeridos
    if (!username || !password || !phone) {
      return errorResponse(res, 400, "Todos los campos son requeridos");
    }

    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      return errorResponse(res, 400, "El formato del correo electrónico no es válido");
    }

    // Validar formato de teléfono (10 dígitos)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return errorResponse(res, 400, "El teléfono debe contener exactamente 10 dígitos numéricos");
    }

    // Validar longitud de contraseña
    if (password.length < 8) {
      return errorResponse(res, 400, "La contraseña debe tener 8 o más caracteres");
    }

    try {
      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ username }, { phone }],
        },
      });

      if (existingUser) {
        return errorResponse(res, 400, existingUser.username === username 
          ? "El correo ya está en uso" 
          : "El teléfono ya está en uso");
      }

      // Crear el usuario
      const newUser = await User.create({
        phone,
        username,
        password, // Idealmente deberías hashear la contraseña
        status: true,
        creationDate: new Date(),
      });

      // Publicar evento
      await userCreatedEvent({
        id: newUser.id,
        username: newUser.username,
        phone: newUser.phone,
        creationDate: newUser.creationDate,
      });

      return res.status(201).json({ 
        message: "Usuario creado correctamente", 
        data: {
          id: newUser.id,
          username: newUser.username,
          phone: newUser.phone,
          status: newUser.status,
          creationDate: newUser.creationDate
        }
      });
    } catch (error) {
      console.error("Error al crear usuario:", error);
      errorResponse(res, 500, "Error al crear usuario");
    }
  }
];

export const updateUser = [
  verifyToken, // Add verifyToken middleware
  async (req, res) => {
    const { id } = req.params;
    const { password, phone } = req.body;

    try {
      const user = await User.findByPk(id);
      if (!user) {
        return errorResponse(res, 404, "Usuario no encontrado");
      }

      if (phone) {
        const phoneExists = await User.findOne({ where: { phone, id: { [Op.ne]: id } } });
        if (phoneExists) {
          return errorResponse(res, 400, "El teléfono ya está en uso");
        }
        if (!/^\d{10}$/.test(phone)) {
          return errorResponse(res, 400, "El teléfono debe contener exactamente 10 dígitos numéricos");
        }
      }

      const usernameExists = await User.findOne({ where: { username: user.username, id: { [Op.ne]: id } } });
      if (usernameExists) {
        return errorResponse(res, 400, "El correo ya está en uso");
      }

      if (password && password.length < 8) {
        return errorResponse(res, 400, "La contraseña debe tener al menos 8 caracteres");
      }

      await user.update({
        password: password ?? user.password,
        phone: phone ?? user.phone,
      });

      return res.status(200).json({ message: "Usuario actualizado correctamente", data: user });
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      errorResponse(res, 500, "Error al actualizar usuario");
    }
  }
];

export const deleteUser = [
  verifyToken, // Add verifyToken middleware
  async (req, res) => {
    const { id } = req.params;

    try {
      const user = await User.findByPk(id);
      if (!user) {
        return errorResponse(res, 404, "Usuario no encontrado");
      }

      await user.update({ status: false });

      return res.status(200).json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      errorResponse(res, 500, "Error al eliminar usuario");
    }
  }
];

export const login = async (req, res) => {
  try {
    const SECRET_KEY = "c9PcgRFL2S8n0NYQp6MZUbbxRgTRHJxjYnvux54VrnA=";

    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return errorResponse(res, 401, "Credenciales inválidas");
    }

    if (user.password !== password) {
      return errorResponse(res, 401, "Credenciales inválidas");
    }

    // Include the role in the token payloadpayload
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ message: 'Inicio de sesión exitoso', token });

  } catch (error) {
    console.error('Error en el login: ', error);
    errorResponse(res, 500, 'Error en el servidor');
  }
};

export const promoteToAdmin = async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return errorResponse(res, 400, "El correo del usuario es requerido");
  }

  try {
    // Ensure req.user is populated by verifyToken middleware
    if (!req.user) {
      console.error("Error: req.user is undefined. Ensure verifyToken middleware is applied.");
      return errorResponse(res, 401, "No se pudo verificar el usuario autenticado");
    }

    if (req.user.role !== "admin") {
      return errorResponse(res, 403, "Acceso denegado: solo los administradores pueden realizar esta operación");
    }

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return errorResponse(res, 404, "Usuario no encontrado");
    }

    if (user.role === "admin") {
      return errorResponse(res, 400, "El usuario ya tiene el rol de administrador");
    }

    await user.update({ role: "admin" });

    return res.status(200).json({ message: "El usuario ha sido promovido a administrador", data: user });
  } catch (error) {
    console.error("Error al promover usuario a administrador:", error);
    errorResponse(res, 500, "Error al promover usuario a administrador");
  }
};