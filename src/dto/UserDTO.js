/**
 * UserDTO - Data Transfer Object para Usuario
 * Transforma datos entre la capa de persistencia y la capa de presentación
 */
export class UserDTO {
  constructor(user) {
    this.id = user._id?.toString();
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.email = user.email;
    this.age = user.age;
    this.role = user.role;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    // No incluimos la contraseña por seguridad
  }

  /**
   * Convierte el DTO a un objeto plano para respuestas JSON
   */
  toJSON() {
    return {
      id: this.id,
      first_name: this.first_name,
      last_name: this.last_name,
      email: this.email,
      age: this.age,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Crea un UserDTO desde datos de entrada (para crear/actualizar)
   */
  static fromInput(data) {
    const input = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email?.toLowerCase(),
      age: data.age,
      password: data.password,
      role: data.role || "user",
    };

    // Incluir isActive si está definido
    if (data.isActive !== undefined) {
      input.isActive = data.isActive;
    }

    // Incluir campos de activación si existen
    if (data.activationToken) {
      input.activationToken = data.activationToken;
      input.activationTokenExpires = data.activationTokenExpires;
    }

    // Incluir campos de recuperación de contraseña si existen
    if (data.resetPasswordToken) {
      input.resetPasswordToken = data.resetPasswordToken;
      input.resetPasswordExpires = data.resetPasswordExpires;
    }

    return input;
  }

  /**
   * Versión mínima del usuario para JWT
   */
  toJWTPayload() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
    };
  }
}
