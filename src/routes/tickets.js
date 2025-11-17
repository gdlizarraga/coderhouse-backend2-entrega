import express from "express";
import TicketRepository from "../repositories/TicketRepository.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Todos los endpoints requieren autenticación y role "user"
router.use(authenticateJWT, authorizeRoles("user"));

/**
 * @route   GET /api/tickets
 * @desc    Obtener todos los tickets del usuario autenticado
 * @access  Private/User
 */
router.get("/", async (req, res) => {
  try {
    const ticketDTOs = await TicketRepository.getByPurchaser(req.user.email);

    res.json({
      success: true,
      message: "Tickets obtenidos exitosamente",
      data: ticketDTOs.map((t) => t.toJSON()),
    });
  } catch (error) {
    console.error("Error al obtener tickets:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al obtener tickets",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/tickets/:id
 * @desc    Obtener un ticket específico por ID
 * @access  Private/User
 */
router.get("/:id", async (req, res) => {
  try {
    const ticketDTO = await TicketRepository.getById(req.params.id);

    if (!ticketDTO) {
      return res.status(404).json({
        success: false,
        message: "Ticket no encontrado",
        code: "TICKET_NOT_FOUND",
      });
    }

    // Verificar que el ticket pertenece al usuario
    if (ticketDTO.purchaser !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para ver este ticket",
        code: "FORBIDDEN",
      });
    }

    res.json({
      success: true,
      message: "Ticket obtenido exitosamente",
      data: ticketDTO.toJSON(),
    });
  } catch (error) {
    console.error("Error al obtener ticket:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al obtener ticket",
      error: error.message,
    });
  }
});

export default router;
