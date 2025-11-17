/**
 * DTOs (Data Transfer Objects) para evitar exponer información sensible
 */

/**
 * DTO para el usuario actual
 * Solo expone información no sensible necesaria para el cliente
 */
export class UserCurrentDTO {
  constructor(user) {
    this.id = user._id || user.id;
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.email = user.email;
    this.age = user.age;
    this.role = user.role;
    this.fullName = `${user.first_name} ${user.last_name}`;

    // Solo incluir el ID del carrito si existe, no todo el objeto
    // if (user.cart) {
    //   this.cart = user.cart._id || user.cart;
    // }
  }
}

/**
 * DTO para el usuario en respuesta de login
 * Incluye información adicional para la sesión inicial
 */
export class UserLoginDTO {
  constructor(user) {
    this.id = user._id || user.id;
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.email = user.email;
    this.age = user.age;
    this.role = user.role;
    this.fullName = `${user.first_name} ${user.last_name}`;

    // Incluir información del carrito si está populado
    if (user.cart) {
      this.cart = user.cart._id || user.cart;
    }
  }
}

/**
 * DTO para lista de usuarios (Admin)
 * Versión simplificada para listados
 */
export class UserListDTO {
  constructor(user) {
    this.id = user._id || user.id;
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.email = user.email;
    this.role = user.role;
    this.fullName = `${user.first_name} ${user.last_name}`;
    this.createdAt = user.createdAt;
  }
}

/**
 * DTO para perfil de usuario
 * Incluye información editable del perfil
 */
export class UserProfileDTO {
  constructor(user) {
    this.id = user._id || user.id;
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.email = user.email;
    this.age = user.age;
    this.role = user.role;
    this.fullName = `${user.first_name} ${user.last_name}`;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;

    if (user.cart) {
      this.cart = user.cart._id || user.cart;
    }
  }
}
