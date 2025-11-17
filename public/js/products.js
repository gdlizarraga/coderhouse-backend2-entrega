// JavaScript para la gestión de productos (página de admin)

document.addEventListener("DOMContentLoaded", function () {
  console.log("products.js: DOMContentLoaded ejecutado");

  // Verificar que Bootstrap esté disponible
  if (typeof bootstrap === "undefined") {
    console.error("Bootstrap no está disponible.");
    return;
  }

  let productsData = [];
  let filteredProducts = [];

  // Elementos del DOM
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortSelect = document.getElementById("sortSelect");
  const loadingState = document.getElementById("loadingState");
  const productsTableContainer = document.getElementById(
    "productsTableContainer"
  );
  const emptyState = document.getElementById("emptyState");
  const productsTableBody = document.getElementById("productsTableBody");
  const totalProductsCount = document.getElementById("totalProductsCount");

  // Modales
  const addProductModalElement = document.getElementById("addProductModal");
  const editProductModalElement = document.getElementById("editProductModal");
  const viewProductModalElement = document.getElementById("viewProductModal");

  const addProductModal = new bootstrap.Modal(addProductModalElement);
  const editProductModal = new bootstrap.Modal(editProductModalElement);
  const viewProductModal = new bootstrap.Modal(viewProductModalElement);

  // Formularios
  const addProductForm = document.getElementById("addProductForm");
  const editProductForm = document.getElementById("editProductForm");

  // Inicializar página
  loadProducts();

  // Event listeners
  setupEventListeners();

  function setupEventListeners() {
    // Búsqueda con debounce
    searchInput.addEventListener(
      "input",
      debounce(function () {
        filterProducts();
      }, 300)
    );

    // Filtro por categoría
    categoryFilter.addEventListener("change", function () {
      filterProducts();
    });

    // Ordenamiento
    sortSelect.addEventListener("change", function () {
      filterProducts();
    });

    // Formulario agregar producto
    addProductForm.addEventListener("submit", handleAddProduct);

    // Formulario editar producto
    editProductForm.addEventListener("submit", handleEditProduct);

    // Limpiar formularios al cerrar modales
    addProductModalElement.addEventListener("hidden.bs.modal", function () {
      addProductForm.reset();
      clearFormErrors(addProductForm);
    });

    editProductModalElement.addEventListener("hidden.bs.modal", function () {
      editProductForm.reset();
      clearFormErrors(editProductForm);
    });
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  async function loadProducts() {
    try {
      showLoading(true);

      // Verificar que authenticatedFetch esté disponible
      if (typeof window.authenticatedFetch !== "function") {
        console.error("authenticatedFetch no está disponible");
        throw new Error("Función de autenticación no disponible");
      }

      const response = await window.authenticatedFetch("/api/products");

      if (!response.ok) {
        throw new Error("Error al cargar productos");
      }

      const result = await response.json();
      productsData = result.data.products || [];

      // Extraer categorías únicas para el filtro
      updateCategoryFilter();

      filterProducts();
    } catch (error) {
      console.error("Error:", error);
      if (window.showAlert) {
        showAlert("Error al cargar los productos", "danger");
      }
      showLoading(false);
    }
  }

  function updateCategoryFilter() {
    const categories = [...new Set(productsData.map((p) => p.category))].sort();

    categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
  }

  function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;
    const sortOption = sortSelect.value;

    // Filtrar
    filteredProducts = productsData.filter((product) => {
      const matchesSearch =
        !searchTerm ||
        product.title.toLowerCase().includes(searchTerm) ||
        product.code.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm);

      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // Ordenar
    if (sortOption === "title") {
      filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === "price_asc") {
      filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price_desc") {
      filteredProducts.sort((a, b) => b.price - a.price);
    }

    renderProducts();
  }

  function renderProducts() {
    showLoading(false);

    totalProductsCount.textContent = `${filteredProducts.length} producto${
      filteredProducts.length !== 1 ? "s" : ""
    }`;

    if (filteredProducts.length === 0) {
      productsTableContainer.classList.add("d-none");
      emptyState.classList.remove("d-none");
      return;
    }

    emptyState.classList.add("d-none");
    productsTableContainer.classList.remove("d-none");

    productsTableBody.innerHTML = filteredProducts
      .map(
        (product) => `
      <tr>
        <td>
          <img 
            src="${product.thumbnail || "https://via.placeholder.com/60"}" 
            alt="${product.title}" 
            class="rounded"
            style="width: 60px; height: 60px; object-fit: cover;"
            onerror="this.src='https://via.placeholder.com/60?text=No+Image'"
          />
        </td>
        <td><code>${product.code}</code></td>
        <td>${product.title}</td>
        <td><span class="badge bg-secondary">${product.category}</span></td>
        <td class="text-success fw-bold">$${parseFloat(product.price).toFixed(
          2
        )}</td>
        <td>
          <span class="badge ${
            product.stock > 10
              ? "bg-success"
              : product.stock > 0
              ? "bg-warning"
              : "bg-danger"
          }">
            ${product.stock}
          </span>
        </td>
        <td>${new Date(product.createdAt).toLocaleDateString("es-ES")}</td>
        <td class="text-center">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-info" onclick="viewProduct('${
              product.id
            }')" title="Ver detalles">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-warning" onclick="editProduct('${
              product.id
            }')" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-danger" onclick="confirmDeleteProduct('${
              product.id
            }', '${product.title}')" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");
  }

  function showLoading(show) {
    if (show) {
      loadingState.classList.remove("d-none");
      productsTableContainer.classList.add("d-none");
      emptyState.classList.add("d-none");
    } else {
      loadingState.classList.add("d-none");
    }
  }

  async function handleAddProduct(e) {
    e.preventDefault();

    const formDataOriginal = new FormData(addProductForm);

    // Crear FormData para enviar al servidor (incluyendo el archivo)
    const formData = new FormData();
    formData.append("title", formDataOriginal.get("title"));
    formData.append("description", formDataOriginal.get("description"));
    formData.append("code", formDataOriginal.get("code").toUpperCase());
    formData.append("price", formDataOriginal.get("price"));
    formData.append("stock", formDataOriginal.get("stock"));
    formData.append("category", formDataOriginal.get("category"));

    // Agregar el archivo si existe
    const thumbnailFile = formDataOriginal.get("thumbnail");
    if (thumbnailFile && thumbnailFile.size > 0) {
      formData.append("thumbnail", thumbnailFile);
    }

    const spinner = document.getElementById("addProductSpinner");

    try {
      spinner.classList.remove("d-none");

      const response = await window.authenticatedFetch("/api/products", {
        method: "POST",
        body: formData, // Enviar FormData directamente, sin Content-Type header
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (window.showAlert) {
          showAlert("Producto creado exitosamente", "success");
        }
        addProductModal.hide();
        addProductForm.reset();
        loadProducts();
      } else {
        if (window.showAlert) {
          showAlert(result.message || "Error al crear producto", "danger");
        }
        if (result.errors) showFieldErrors(addProductForm, result.errors);
      }
    } catch (error) {
      console.error("Error:", error);
      if (window.showAlert) {
        showAlert("Error de conexión", "danger");
      }
    } finally {
      spinner.classList.add("d-none");
    }
  }

  window.viewProduct = async function (productId) {
    try {
      const response = await window.authenticatedFetch(
        `/api/products/${productId}`
      );

      const result = await response.json();

      if (response.ok && result.success) {
        const product = result.data.product;

        document.getElementById("viewTitle").textContent = product.title;
        document.getElementById("viewDescription").textContent =
          product.description;
        document.getElementById("viewCode").textContent = product.code;
        document.getElementById("viewCategory").textContent = product.category;
        document.getElementById("viewPrice").textContent = `$${parseFloat(
          product.price
        ).toFixed(2)}`;
        document.getElementById("viewStock").innerHTML = `<span class="badge ${
          product.stock > 10
            ? "bg-success"
            : product.stock > 0
            ? "bg-warning"
            : "bg-danger"
        }">${product.stock}</span>`;
        document.getElementById("viewCreatedAt").textContent = new Date(
          product.createdAt
        ).toLocaleString("es-ES");

        const thumbnailImg = document.getElementById("viewThumbnail");
        thumbnailImg.src =
          product.thumbnail ||
          "https://via.placeholder.com/300?text=Sin+Imagen";
        thumbnailImg.onerror = function () {
          this.src = "https://via.placeholder.com/300?text=Sin+Imagen";
        };

        viewProductModal.show();
      } else {
        if (window.showAlert) {
          showAlert(result.message || "Error al obtener producto", "danger");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      if (window.showAlert) {
        showAlert("Error de conexión", "danger");
      }
    }
  };

  window.editProduct = async function (productId) {
    try {
      const response = await window.authenticatedFetch(
        `/api/products/${productId}`
      );

      const result = await response.json();

      if (response.ok && result.success) {
        const product = result.data.product;

        document.getElementById("editProductId").value = product.id;
        document.getElementById("editTitle").value = product.title;
        document.getElementById("editDescription").value = product.description;
        document.getElementById("editCode").value = product.code;
        document.getElementById("editPrice").value = product.price;
        document.getElementById("editStock").value = product.stock;
        document.getElementById("editCategory").value = product.category;

        // No podemos establecer el valor de un file input, pero podemos mostrar la imagen actual
        // Limpiar el input de archivo
        document.getElementById("editThumbnail").value = "";

        // Agregar un mensaje o imagen de vista previa si existe
        const editForm = document.getElementById("editProductForm");
        let currentImageInfo = editForm.querySelector(".current-image-info");
        if (currentImageInfo) {
          currentImageInfo.remove();
        }

        if (product.thumbnail) {
          const imageInfoDiv = document.createElement("div");
          imageInfoDiv.className = "current-image-info alert alert-info mt-2";
          imageInfoDiv.innerHTML = `
            <small>Imagen actual:</small><br>
            <img src="${product.thumbnail}" alt="Imagen actual" style="max-width: 100px; max-height: 100px; object-fit: cover;" 
                 onerror="this.style.display='none'">
            <p class="mb-0 mt-1"><small>Seleccione un nuevo archivo solo si desea cambiar la imagen</small></p>
          `;
          document
            .getElementById("editThumbnail")
            .parentElement.appendChild(imageInfoDiv);
        }

        editProductModal.show();
      } else {
        if (window.showAlert) {
          showAlert(result.message || "Error al obtener producto", "danger");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      if (window.showAlert) {
        showAlert("Error de conexión", "danger");
      }
    }
  };

  async function handleEditProduct(e) {
    e.preventDefault();

    const productId = document.getElementById("editProductId").value;
    const formDataOriginal = new FormData(editProductForm);

    // Crear FormData para enviar al servidor (incluyendo el archivo)
    const formData = new FormData();
    formData.append("title", formDataOriginal.get("title"));
    formData.append("description", formDataOriginal.get("description"));
    formData.append("code", formDataOriginal.get("code").toUpperCase());
    formData.append("price", formDataOriginal.get("price"));
    formData.append("stock", formDataOriginal.get("stock"));
    formData.append("category", formDataOriginal.get("category"));

    // Agregar el archivo si existe
    const thumbnailFile = formDataOriginal.get("thumbnail");
    if (thumbnailFile && thumbnailFile.size > 0) {
      formData.append("thumbnail", thumbnailFile);
    }

    const spinner = document.getElementById("editProductSpinner");

    try {
      spinner.classList.remove("d-none");

      const response = await window.authenticatedFetch(
        `/api/products/${productId}`,
        {
          method: "PUT",
          body: formData, // Enviar FormData directamente, sin Content-Type header
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        if (window.showAlert) {
          showAlert("Producto actualizado exitosamente", "success");
        }
        editProductModal.hide();
        editProductForm.reset();
        loadProducts();
      } else {
        if (window.showAlert) {
          showAlert(result.message || "Error al actualizar producto", "danger");
        }
        if (result.errors) showFieldErrors(editProductForm, result.errors);
      }
    } catch (error) {
      console.error("Error:", error);
      if (window.showAlert) {
        showAlert("Error de conexión", "danger");
      }
    } finally {
      spinner.classList.add("d-none");
    }
  }

  window.confirmDeleteProduct = function (productId, productTitle) {
    if (
      confirm(
        `¿Estás seguro de que deseas eliminar el producto "${productTitle}"?`
      )
    ) {
      deleteProduct(productId);
    }
  };

  async function deleteProduct(productId) {
    try {
      const response = await window.authenticatedFetch(
        `/api/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        if (window.showAlert) {
          showAlert("Producto eliminado exitosamente", "success");
        }
        loadProducts();
      } else {
        if (window.showAlert) {
          showAlert(result.message || "Error al eliminar producto", "danger");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      if (window.showAlert) {
        showAlert("Error de conexión", "danger");
      }
    }
  }

  window.refreshProducts = function () {
    loadProducts();
  };

  function showFieldErrors(form, errors) {
    clearFormErrors(form);

    errors.forEach((error) => {
      const field = form.querySelector(`[name="${error.field}"]`);
      if (field) {
        field.classList.add("is-invalid");
        const feedback = field.parentElement.querySelector(".invalid-feedback");
        if (feedback) feedback.textContent = error.message;
      }
    });
  }

  function clearFormErrors(form) {
    const invalidFields = form.querySelectorAll(".is-invalid");
    invalidFields.forEach((field) => field.classList.remove("is-invalid"));

    const errorMessages = form.querySelectorAll(".invalid-feedback");
    errorMessages.forEach((msg) => {
      if (msg) msg.textContent = "";
    });
  }
});
