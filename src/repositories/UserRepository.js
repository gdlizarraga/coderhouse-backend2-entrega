import UserDAO from "../dao/UserDAO.js";
import { UserDTO } from "../dto/UserDTO.js";
import bcrypt from "bcrypt";

/**
 * UserRepository - Capa de lógica de negocio para Usuarios
 * Usa el UserDAO para acceder a datos y UserDTO para transformarlos
 */
export class UserRepository {
  constructor() {
    this.dao = UserDAO;
  }

  /**
   * Obtener todos los usuarios
   */
  async getAll(filters = {}, options = {}) {
    const users = await this.dao.findAll(filters, options);
    return users.map((user) => new UserDTO(user));
  }

  /**
   * Obtener un usuario por ID
   */
  async getById(id) {
    const user = await this.dao.findById(id);
    return user ? new UserDTO(user) : null;
  }

  /**
   * Obtener un usuario por email
   */
  async getByEmail(email) {
    const user = await this.dao.findByEmail(email);
    return user ? new UserDTO(user) : null;
  }

  /**
   * Obtener usuario completo por email (con password para autenticación)
   */
  async getByEmailWithPassword(email) {
    return await this.dao.findByEmail(email);
  }

  /**
   * Crear un nuevo usuario
   */
  async create(userData) {
    // Preparar datos usando el DTO
    const userInput = UserDTO.fromInput(userData);

    // NO hashear aquí - el modelo User lo hace automáticamente en el pre-save hook

    const user = await this.dao.create(userInput);
    return new UserDTO(user);
  }

  /**
   * Actualizar un usuario
   */
  async update(id, updateData) {
    // Preparar datos para actualización
    const dataToUpdate = { ...updateData };

    // NO hashear aquí - si se actualiza la contraseña, usar findByIdAndUpdate
    // que NO ejecuta los hooks, o usar save() que sí los ejecuta

    // Actualizar fecha de modificación
    dataToUpdate.updatedAt = new Date();

    // Si hay cambio de contraseña, usar save() para que ejecute el hook
    if (dataToUpdate.password) {
      const user = await this.dao.findById(id);
      if (!user) return null;

      Object.assign(user, dataToUpdate);
      await user.save(); // Esto ejecutará el pre-save hook que hashea la password
      return new UserDTO(user);
    }

    const user = await this.dao.updateById(id, dataToUpdate);
    return user ? new UserDTO(user) : null;
  }

  /**
   * Eliminar un usuario
   */
  async delete(id) {
    const user = await this.dao.deleteById(id);
    return user ? new UserDTO(user) : null;
  }

  /**
   * Verificar si existe un email
   */
  async emailExists(email) {
    return await this.dao.existsByEmail(email);
  }

  /**
   * Obtener usuarios por rol
   */
  async getByRole(role) {
    const users = await this.dao.findByRole(role);
    return users.map((user) => new UserDTO(user));
  }

  /**
   * Contar usuarios
   */
  async count(filters = {}) {
    return await this.dao.count(filters);
  }

  /**
   * Validar credenciales de usuario
   */
  async validateCredentials(email, password) {
    const user = await this.dao.findByEmail(email);
    if (!user) return null;

    const isValid = bcrypt.compareSync(password, user.password);
    return isValid ? new UserDTO(user) : null;
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(id, currentPassword, newPassword) {
    const user = await this.dao.findById(id);
    if (!user) return { success: false, message: "Usuario no encontrado" };

    const isValid = bcrypt.compareSync(currentPassword, user.password);
    if (!isValid)
      return { success: false, message: "Contraseña actual incorrecta" };

    const hashedPassword = bcrypt.hashSync(newPassword, 12);
    await this.dao.updateById(id, { password: hashedPassword });

    return { success: true, message: "Contraseña actualizada exitosamente" };
  }
}

export default new UserRepository();
