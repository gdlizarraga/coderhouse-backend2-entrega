import User from "../models/User.js";

/**
 * UserDAO - Data Access Object para Usuario
 * Maneja todas las operaciones de persistencia con la base de datos
 */
export class UserDAO {
  /**
   * Obtener todos los usuarios con filtros opcionales
   */
  async findAll(filters = {}, options = {}) {
    const { limit, skip, sort } = options;
    let query = User.find(filters);

    if (sort) query = query.sort(sort);
    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);

    return await query.exec();
  }

  /**
   * Obtener un usuario por ID
   */
  async findById(id) {
    return await User.findById(id);
  }

  /**
   * Obtener un usuario por email
   */
  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }

  /**
   * Crear un nuevo usuario
   */
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  /**
   * Actualizar un usuario por ID
   */
  async updateById(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Eliminar un usuario por ID
   */
  async deleteById(id) {
    return await User.findByIdAndDelete(id);
  }

  /**
   * Contar usuarios con filtros opcionales
   */
  async count(filters = {}) {
    return await User.countDocuments(filters);
  }

  /**
   * Verificar si existe un usuario con un email
   */
  async existsByEmail(email) {
    const count = await User.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  /**
   * Buscar usuarios por rol
   */
  async findByRole(role) {
    return await User.find({ role });
  }
}

export default new UserDAO();
