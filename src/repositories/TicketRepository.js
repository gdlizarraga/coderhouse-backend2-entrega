import TicketDAO from "../dao/TicketDAO.js";
import { TicketDTO } from "../dto/TicketDTO.js";
import Ticket from "../models/Ticket.js";

/**
 * TicketRepository - Capa de lógica de negocio para Tickets
 * Usa el TicketDAO para acceder a datos y TicketDTO para transformarlos
 */
export class TicketRepository {
  constructor() {
    this.dao = TicketDAO;
  }

  /**
   * Obtener todos los tickets
   */
  async getAll(filters = {}, options = {}) {
    const tickets = await this.dao.findAll(filters, options);
    return tickets.map((ticket) => new TicketDTO(ticket));
  }

  /**
   * Obtener un ticket por ID
   */
  async getById(id) {
    const ticket = await this.dao.findById(id, [
      {
        path: "cart",
        populate: { path: "products.product" },
      },
    ]);
    return ticket ? new TicketDTO(ticket) : null;
  }

  /**
   * Obtener un ticket por código
   */
  async getByCode(code) {
    const ticket = await this.dao.findByCode(code);
    return ticket ? new TicketDTO(ticket) : null;
  }

  /**
   * Crear un nuevo ticket
   */
  async create(ticketData) {
    // Generar código único
    const code = await Ticket.generateUniqueCode();

    const ticketInput = {
      ...TicketDTO.fromInput(ticketData),
      code,
    };

    const ticket = await this.dao.create(ticketInput);
    return new TicketDTO(ticket);
  }

  /**
   * Actualizar un ticket
   */
  async update(id, updateData) {
    const ticket = await this.dao.updateById(id, updateData);
    return ticket ? new TicketDTO(ticket) : null;
  }

  /**
   * Eliminar un ticket
   */
  async delete(id) {
    const ticket = await this.dao.deleteById(id);
    return ticket ? new TicketDTO(ticket) : null;
  }

  /**
   * Obtener tickets por comprador (email)
   */
  async getByPurchaser(email) {
    const tickets = await this.dao.findByPurchaser(email);
    return tickets.map((ticket) => new TicketDTO(ticket));
  }

  /**
   * Verificar si existe un código
   */
  async codeExists(code) {
    return await this.dao.existsByCode(code);
  }

  /**
   * Obtener tickets por rango de fechas
   */
  async getByDateRange(startDate, endDate) {
    const tickets = await this.dao.findByDateRange(startDate, endDate);
    return tickets.map((ticket) => new TicketDTO(ticket));
  }

  /**
   * Contar tickets
   */
  async count(filters = {}) {
    return await this.dao.count(filters);
  }

  /**
   * Crear ticket desde compra de carrito
   */
  async createFromPurchase(purchaseData) {
    const { totalAmount, cartId, purchaserEmail } = purchaseData;

    const ticketData = {
      amount: totalAmount,
      purchaser: purchaserEmail,
      cart: cartId,
      purchase_datetime: new Date(),
    };

    return await this.create(ticketData);
  }
}

export default new TicketRepository();
