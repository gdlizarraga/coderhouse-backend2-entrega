// JavaScript para la página de detalle de ticket

document.addEventListener("DOMContentLoaded", async function () {
  if (typeof ticketId !== "undefined" && ticketId) {
    await loadTicketDetail(ticketId);
  }
});

// Función para cargar el detalle del ticket
async function loadTicketDetail(id) {
  const ticketLoading = document.getElementById("ticketLoading");
  const ticketDetail = document.getElementById("ticketDetail");
  const ticketError = document.getElementById("ticketError");

  try {
    const response = await fetch(`/api/tickets/${id}`, {
      credentials: "include",
    });

    ticketLoading.classList.add("d-none");

    if (!response.ok) {
      throw new Error("Error al cargar el ticket");
    }

    const result = await response.json();

    if (result.success && result.data) {
      renderTicketDetail(result.data);
      ticketDetail.classList.remove("d-none");
    } else {
      throw new Error(result.message || "Ticket no encontrado");
    }
  } catch (error) {
    console.error("Error al cargar ticket:", error);
    ticketLoading.classList.add("d-none");
    ticketError.classList.remove("d-none");
    document.getElementById("ticketErrorMessage").textContent =
      error.message || "Error al cargar el ticket";
  }
}

// Función para renderizar el detalle del ticket
function renderTicketDetail(ticket) {
  // Información del ticket
  document.getElementById("ticketCode").textContent = ticket.code;

  const date = new Date(ticket.purchase_datetime);
  const formattedDate = date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  document.getElementById("ticketDate").textContent = formattedDate;

  document.getElementById("ticketPurchaser").textContent = ticket.purchaser;
  document.getElementById(
    "ticketAmount"
  ).textContent = `$${ticket.amount.toFixed(2)}`;

  // Productos del carrito
  const ticketProducts = document.getElementById("ticketProducts");

  if (ticket.cart && ticket.cart.products && ticket.cart.products.length > 0) {
    ticketProducts.innerHTML = ticket.cart.products
      .map((item) => {
        const product = item.product;
        const subtotal = item.price * item.quantity;

        return `
          <tr>
            <td>
              <div class="d-flex align-items-center">
                <img 
                  src="${
                    product.thumbnail ||
                    "https://via.placeholder.com/50x50?text=Sin+Imagen"
                  }" 
                  alt="${product.title}"
                  class="img-thumbnail me-2"
                  style="width: 50px; height: 50px; object-fit: cover;"
                  onerror="this.src='https://via.placeholder.com/50x50?text=Sin+Imagen'"
                >
                <div>
                  <strong>${product.title}</strong>
                  <br>
                  <small class="text-muted">${
                    product.category || "Sin categoría"
                  }</small>
                </div>
              </div>
            </td>
            <td class="text-center align-middle">
              <span class="badge bg-secondary">${item.quantity}</span>
            </td>
            <td class="text-end align-middle">$${item.price.toFixed(2)}</td>
            <td class="text-end align-middle">
              <strong>$${subtotal.toFixed(2)}</strong>
            </td>
          </tr>
        `;
      })
      .join("");
  } else {
    ticketProducts.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-4">
          No hay productos en esta compra
        </td>
      </tr>
    `;
  }
}
