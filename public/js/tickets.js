// JavaScript para la página de tickets (historial de compras)

document.addEventListener("DOMContentLoaded", async function () {
  await loadTickets();
});

// Función para cargar todos los tickets
async function loadTickets() {
  const ticketsLoading = document.getElementById("ticketsLoading");
  const ticketsEmpty = document.getElementById("ticketsEmpty");
  const ticketsContent = document.getElementById("ticketsContent");
  const ticketsList = document.getElementById("ticketsList");

  try {
    const response = await fetch("/api/tickets", {
      credentials: "include",
    });

    ticketsLoading.classList.add("d-none");

    if (!response.ok) {
      throw new Error("Error al cargar tickets");
    }

    const result = await response.json();

    if (result.success && result.data && result.data.length > 0) {
      renderTickets(result.data);
      ticketsContent.classList.remove("d-none");
    } else {
      ticketsEmpty.classList.remove("d-none");
    }
  } catch (error) {
    console.error("Error al cargar tickets:", error);
    ticketsLoading.classList.add("d-none");
    ticketsEmpty.classList.remove("d-none");
    if (window.showAlert) {
      showAlert("Error al cargar el historial de compras", "danger");
    }
  }
}

// Función para renderizar la lista de tickets
function renderTickets(tickets) {
  const ticketsList = document.getElementById("ticketsList");

  ticketsList.innerHTML = tickets
    .map((ticket) => {
      const date = new Date(ticket.purchase_datetime);
      const formattedDate = date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const productsCount = ticket.cart?.products?.length || 0;
      const totalItems =
        ticket.cart?.products?.reduce((sum, item) => sum + item.quantity, 0) ||
        0;

      return `
        <div class="col-md-6 col-lg-4 mb-3">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h5 class="card-title mb-0">
                  <i class="bi bi-receipt text-primary me-2"></i>
                  ${ticket.code}
                </h5>
              </div>
              <p class="card-text text-muted small mb-2">
                <i class="bi bi-calendar me-1"></i>
                ${formattedDate}
              </p>
              <p class="card-text mb-2">
                <i class="bi bi-bag me-1"></i>
                ${productsCount} producto${
        productsCount !== 1 ? "s" : ""
      } (${totalItems} unidad${totalItems !== 1 ? "es" : ""})
              </p>
              <h4 class="text-success mb-3">$${ticket.amount.toFixed(2)}</h4>
              <a href="/tickets/${ticket.id}" class="btn btn-primary w-100">
                <i class="bi bi-eye me-2"></i>
                Ver Detalle
              </a>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}
