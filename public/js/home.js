// JavaScript para la página de inicio (home)

// Cargar productos al cargar la página
document.addEventListener("DOMContentLoaded", async function () {
  const productsLoading = document.getElementById("productsLoading");
  const productsEmpty = document.getElementById("productsEmpty");
  const productsGrid = document.getElementById("productsGrid");

  try {
    const response = await fetch("/api/products");
    const result = await response.json();

    productsLoading.classList.add("d-none");

    if (response.ok && result.success && result.data.products.length > 0) {
      const products = result.data.products;

      productsGrid.innerHTML = products
        .map(
          (product) => `
        <div class="col-md-6 col-lg-3">
          <div class="card h-100 shadow-sm">
            <img 
              src="${
                product.thumbnail ||
                "https://via.placeholder.com/300x200?text=Sin+Imagen"
              }" 
              class="card-img-top" 
              alt="${product.title}"
              style="height: 200px; object-fit: cover;"
              onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'"
            >
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${product.title}</h5>
              <p class="card-text text-muted small flex-grow-1" style="max-height: 60px; overflow: hidden;">
                ${product.description}
              </p>
              <div class="mt-auto">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="fw-bold text-success fs-4">$${parseFloat(
                    product.price
                  ).toFixed(2)}</span>
                  ${
                    product.stock > 0
                      ? `<span class="badge bg-primary">${product.stock} disponibles</span>`
                      : `<span class="badge bg-danger">Sin Stock</span>`
                  }
                </div>
                <p class="text-muted small mb-2">
                  <i class="bi bi-tag me-1"></i>
                  ${product.category}
                </p>
                ${
                  product.stock > 0
                    ? `<button class="btn btn-primary w-100" onclick="addToCart('${product.id}', '${product.title}')">
                      <i class="bi bi-cart-plus me-1"></i>
                      Agregar al Carrito
                    </button>`
                    : ""
                }
              </div>
            </div>
          </div>
        </div>
      `
        )
        .join("");

      productsGrid.classList.remove("d-none");
    } else {
      productsEmpty.classList.remove("d-none");
    }
  } catch (error) {
    console.error("Error al cargar productos:", error);
    productsLoading.classList.add("d-none");
    productsEmpty.classList.remove("d-none");
  }
});

// Función para agregar al carrito
async function addToCart(productId, productTitle) {
  try {
    // Verificar autenticación primero
    const authResponse = await fetch("/api/sessions/current", {
      credentials: "include",
    });

    if (!authResponse.ok) {
      // Usuario no autenticado
      if (window.showAlert) {
        showAlert(
          "Debes iniciar sesión para agregar productos al carrito",
          "warning"
        );
      } else {
        alert("Debes iniciar sesión para agregar productos al carrito");
      }
      // Redirigir al login después de un momento
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
      return;
    }

    // Usuario autenticado, agregar producto al carrito
    const cartResponse = await fetch("/api/carts/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        productId: productId,
        quantity: 1,
      }),
    });

    const cartResult = await cartResponse.json();

    if (cartResponse.ok && cartResult.success) {
      if (window.showAlert) {
        showAlert(`Producto "${productTitle}" agregado al carrito`, "success");
      } else {
        alert(`Producto "${productTitle}" agregado al carrito`);
      }

      // Recargar el badge del carrito
      if (window.loadCartBadge) {
        window.loadCartBadge();
      }
      console.log("Producto agregado exitosamente:", cartResult.data);
    } else {
      // Error al agregar producto
      if (window.showAlert) {
        showAlert(
          cartResult.message || "Error al agregar producto al carrito",
          "danger"
        );
      } else {
        alert(cartResult.message || "Error al agregar producto al carrito");
      }
    }
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    if (window.showAlert) {
      showAlert("Error al agregar producto al carrito", "danger");
    } else {
      alert("Error al agregar producto al carrito");
    }
  }
}
