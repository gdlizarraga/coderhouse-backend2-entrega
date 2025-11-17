// JavaScript para la página del carrito

let currentCart = null;

// Cargar carrito al cargar la página
document.addEventListener("DOMContentLoaded", async function () {
  await loadCart();

  // Event listeners
  document.getElementById("clearCartBtn")?.addEventListener("click", clearCart);
  document.getElementById("checkoutBtn")?.addEventListener("click", checkout);
});

// Función para cargar el carrito
async function loadCart() {
  const cartLoading = document.getElementById("cartLoading");
  const cartEmpty = document.getElementById("cartEmpty");
  const cartContent = document.getElementById("cartContent");

  try {
    const response = await fetch("/api/carts", {
      credentials: "include",
    });

    cartLoading.classList.add("d-none");

    if (response.status === 404) {
      // No hay carrito
      cartEmpty.classList.remove("d-none");
      return;
    }

    if (!response.ok) {
      throw new Error("Error al cargar el carrito");
    }

    const result = await response.json();

    if (result.success && result.data.products.length > 0) {
      currentCart = result.data;
      renderCart(currentCart);
      cartContent.classList.remove("d-none");
    } else {
      cartEmpty.classList.remove("d-none");
    }
  } catch (error) {
    console.error("Error al cargar carrito:", error);
    cartLoading.classList.add("d-none");
    cartEmpty.classList.remove("d-none");
    if (window.showAlert) {
      showAlert("Error al cargar el carrito", "danger");
    }
  }
}

// Función para renderizar el carrito
function renderCart(cart) {
  const cartItems = document.getElementById("cartItems");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartTotal = document.getElementById("cartTotal");
  const cartItemCount = document.getElementById("cartItemCount");

  if (!cart || !cart.products || cart.products.length === 0) {
    document.getElementById("cartContent").classList.add("d-none");
    document.getElementById("cartEmpty").classList.remove("d-none");
    return;
  }

  // Renderizar productos
  cartItems.innerHTML = cart.products
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
                "https://via.placeholder.com/60x60?text=Sin+Imagen"
              }" 
              alt="${product.title}"
              class="img-thumbnail me-3"
              style="width: 60px; height: 60px; object-fit: cover;"
              onerror="this.src='https://via.placeholder.com/60x60?text=Sin+Imagen'"
            >
            <div>
              <strong>${product.title}</strong>
              <br>
              <small class="text-muted">${product.category}</small>
              <br>
              <small class="text-muted">Stock disponible: ${
                product.stock
              }</small>
            </div>
          </div>
        </td>
        <td class="text-center align-middle">
          <strong>$${item.price.toFixed(2)}</strong>
        </td>
        <td class="text-center align-middle">
          <div class="input-group input-group-sm" style="max-width: 140px; margin: 0 auto;">
            <button class="btn btn-outline-secondary" type="button" onclick="updateQuantity('${
              product.id
            }', ${item.quantity - 1})">
              <i class="bi bi-dash"></i>
            </button>
            <input type="number" class="form-control text-center" value="${
              item.quantity
            }" min="1" max="${product.stock + item.quantity}" readonly>
            <button class="btn btn-outline-secondary" type="button" onclick="updateQuantity('${
              product.id
            }', ${item.quantity + 1})" ${product.stock === 0 ? "disabled" : ""}>
              <i class="bi bi-plus"></i>
            </button>
          </div>
        </td>
        <td class="text-center align-middle">
          <strong class="text-success">$${subtotal.toFixed(2)}</strong>
        </td>
        <td class="text-center align-middle">
          <button class="btn btn-sm btn-danger" onclick="removeProduct('${
            product.id
          }', '${product.title}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
    })
    .join("");

  // Actualizar totales
  const totalItems = cart.products.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  cartSubtotal.textContent = `$${cart.totalPrice.toFixed(2)}`;
  cartTotal.textContent = `$${cart.totalPrice.toFixed(2)}`;
  cartItemCount.textContent = totalItems;

  // Actualizar badge del navbar
  updateCartBadge(totalItems);
}

// Función para actualizar cantidad
async function updateQuantity(productId, newQuantity) {
  if (newQuantity < 1) {
    if (window.showAlert) {
      showAlert("La cantidad mínima es 1", "warning");
    }
    return;
  }

  try {
    // Verificar stock disponible
    const item = currentCart.products.find((p) => p.product.id === productId);
    if (!item) return;

    const maxQuantity = item.product.stock + item.quantity;
    if (newQuantity > maxQuantity) {
      if (window.showAlert) {
        showAlert(
          `Stock insuficiente. Solo hay ${item.product.stock} unidades disponibles`,
          "warning"
        );
      }
      return;
    }

    const response = await fetch(`/api/carts/products/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ quantity: newQuantity }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      currentCart = result.data;
      renderCart(currentCart);
      if (window.showAlert) {
        showAlert("Cantidad actualizada", "success");
      }
    } else {
      if (window.showAlert) {
        showAlert(result.message || "Error al actualizar cantidad", "danger");
      }
    }
  } catch (error) {
    console.error("Error al actualizar cantidad:", error);
    if (window.showAlert) {
      showAlert("Error al actualizar cantidad", "danger");
    }
  }
}

// Función para eliminar producto
async function removeProduct(productId, productTitle) {
  if (!confirm(`¿Eliminar "${productTitle}" del carrito?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/carts/products/${productId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const result = await response.json();

    if (response.ok && result.success) {
      currentCart = result.data;

      if (currentCart.products.length === 0) {
        document.getElementById("cartContent").classList.add("d-none");
        document.getElementById("cartEmpty").classList.remove("d-none");
        updateCartBadge(0);
      } else {
        renderCart(currentCart);
      }

      if (window.showAlert) {
        showAlert(`"${productTitle}" eliminado del carrito`, "success");
      }
    } else {
      if (window.showAlert) {
        showAlert(result.message || "Error al eliminar producto", "danger");
      }
    }
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    if (window.showAlert) {
      showAlert("Error al eliminar producto", "danger");
    }
  }
}

// Función para vaciar carrito
async function clearCart() {
  if (!confirm("¿Estás seguro de vaciar todo el carrito?")) {
    return;
  }

  try {
    const response = await fetch("/api/carts", {
      method: "DELETE",
      credentials: "include",
    });

    const result = await response.json();

    if (response.ok && result.success) {
      document.getElementById("cartContent").classList.add("d-none");
      document.getElementById("cartEmpty").classList.remove("d-none");
      updateCartBadge(0);

      if (window.showAlert) {
        showAlert("Carrito vaciado exitosamente", "success");
      }
    } else {
      if (window.showAlert) {
        showAlert(result.message || "Error al vaciar carrito", "danger");
      }
    }
  } catch (error) {
    console.error("Error al vaciar carrito:", error);
    if (window.showAlert) {
      showAlert("Error al vaciar carrito", "danger");
    }
  }
}

// Función para proceder al checkout
async function checkout() {
  if (!currentCart || !currentCart.id) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No hay un carrito activo",
      confirmButtonColor: "#0d6efd",
    });
    return;
  }

  // Confirmar compra con SweetAlert2
  const confirmResult = await Swal.fire({
    title: "¿Confirmar la compra?",
    text: "Se procesará el pago de los productos en tu carrito",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#198754",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Sí, confirmar",
    cancelButtonText: "Cancelar",
  });

  if (!confirmResult.isConfirmed) {
    return;
  }

  // Mostrar loading
  Swal.fire({
    title: "Procesando compra...",
    html: "Por favor espera mientras procesamos tu pago",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    const response = await fetch(`/api/carts/${currentCart.id}/purchase`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Limpiar la vista actual del carrito
      document.getElementById("cartContent").classList.add("d-none");

      // Mostrar detalles del ticket
      const ticket = result.data.ticket;
      const productsProcessed = result.data.productsProcessed || [];
      const productsNotProcessed = result.data.productsNotProcessed || [];

      let htmlContent = `
        <div class="text-start">
          <p class="mb-2"><strong>Código de Ticket:</strong> ${ticket.code}</p>
          <p class="mb-2"><strong>Monto Total:</strong> <span class="text-success fs-4">$${ticket.amount.toFixed(
            2
          )}</span></p>
          <p class="mb-2"><strong>Productos comprados:</strong> ${
            productsProcessed.length
          }</p>
      `;

      if (productsNotProcessed.length > 0) {
        htmlContent += `
          <div class="alert alert-warning mt-3 mb-0">
            <i class="bi bi-exclamation-triangle me-2"></i>
            ${productsNotProcessed.length} producto(s) sin stock suficiente quedaron en el carrito
          </div>
        `;
      }

      htmlContent += `</div>`;

      await Swal.fire({
        icon: "success",
        title: "¡Compra Finalizada!",
        html: htmlContent,
        confirmButtonColor: "#198754",
        confirmButtonText: "Ver Mis Compras",
        showCancelButton: true,
        cancelButtonColor: "#6c757d",
        cancelButtonText: "Seguir Comprando",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/tickets";
        }
      });

      // Recargar carrito para mostrar estado actualizado
      await loadCart();

      // Actualizar badge del navbar
      if (window.loadCartBadge) {
        await loadCartBadge();
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "Error al finalizar la compra",
        text: result.message || "Ocurrió un error al procesar la compra",
        confirmButtonColor: "#dc3545",
      });
    }
  } catch (error) {
    console.error("Error al finalizar compra:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Error al finalizar la compra",
      confirmButtonColor: "#dc3545",
    });
  }
}

// Función para actualizar el badge del carrito en el navbar
function updateCartBadge(count) {
  const cartBadge = document.getElementById("cartBadge");

  if (cartBadge) {
    if (count > 0) {
      cartBadge.textContent = count;
      cartBadge.classList.remove("d-none");
    } else {
      cartBadge.classList.add("d-none");
    }
  }
}
