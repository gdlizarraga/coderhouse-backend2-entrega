import Ticket from "../models/Ticket.js";

/**
 * TicketDAO - Data Access Object para Ticket
 * Maneja todas las operaciones de persistencia con la base de datos
 */
export class TicketDAO {
  /**
   * Obtener todos los tickets con filtros opcionales
   */
  async findAll(filters = {}, options = {}) {
    const { limit, skip, sort, populate } = options;
    let query = Ticket.find(filters);

    if (populate) {
      populate.forEach((pop) => {
        query = query.populate(pop);
      });
    }

    if (sort) query = query.sort(sort);
    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);

    return await query.exec();
  }

  /**
   * Obtener un ticket por ID
   */
  async findById(id, populate = null) {
    let query = Ticket.findById(id);

    if (populate) {
      populate.forEach((pop) => {
        query = query.populate(pop);
      });
    }

    return await query.exec();
  }

  /**
   * Obtener un ticket por código
   */
  async findByCode(code) {
    return await Ticket.findOne({ code });
  }

  /**
   * Crear un nuevo ticket
   */
  async create(ticketData) {
    const ticket = new Ticket(ticketData);
    return await ticket.save();
  }

  /**
   * Actualizar un ticket por ID
   */
  async updateById(id, updateData) {
    return await Ticket.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Eliminar un ticket por ID
   */
  async deleteById(id) {
    return await Ticket.findByIdAndDelete(id);
  }

  /**
   * Obtener tickets por comprador (email)
   */
  async findByPurchaser(email) {
    return await Ticket.find({ purchaser: email })
      .populate({
        path: "cart",
        populate: { path: "products.product" },
      })
      .sort({ purchase_datetime: -1 });
  }

  /**
   * Contar tickets con filtros opcionales
   */
  async count(filters = {}) {
    return await Ticket.countDocuments(filters);
  }

  /**
   * Verificar si existe un ticket con un código
   */
  async existsByCode(code) {
    const count = await Ticket.countDocuments({ code });
    return count > 0;
  }

  /**
   * Obtener tickets por rango de fechas
   */
  async findByDateRange(startDate, endDate) {
    return await Ticket.find({
      purchase_datetime: { $gte: startDate, $lte: endDate },
    }).sort({ purchase_datetime: -1 });
  }
}

export default new TicketDAO();
