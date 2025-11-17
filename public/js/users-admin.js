// JavaScript para la gestión de usuarios (página de admin)

// Esperar a que el DOM y Bootstrap estén completamente cargados
document.addEventListener("DOMContentLoaded", function () {
  console.log("users-admin.js: DOMContentLoaded ejecutado");

  // Verificar que Bootstrap esté disponible
  if (typeof bootstrap === "undefined") {
    console.error(
      "Bootstrap no está disponible. Asegúrate de que se carga antes que este script."
    );
    return;
  }
  console.log("users-admin.js: Bootstrap disponible");

  let currentPage = 1;
  let currentLimit = 10;
  let currentSearch = "";
  let currentRoleFilter = "";
  let usersData = [];

  // Elementos del DOM
  const searchInput = document.getElementById("searchInput");
  const roleFilter = document.getElementById("roleFilter");
  const limitSelect = document.getElementById("limitSelect");
  const loadingState = document.getElementById("loadingState");
  const usersTableContainer = document.getElementById("usersTableContainer");
  const emptyState = document.getElementById("emptyState");
  const usersTableBody = document.getElementById("usersTableBody");
  const totalUsersCount = document.getElementById("totalUsersCount");
  const pagination = document.getElementById("pagination");

  // Debug: verificar que todos los elementos existen
  console.log("Elementos del DOM encontrados:", {
    searchInput: !!searchInput,
    roleFilter: !!roleFilter,
    limitSelect: !!limitSelect,
    loadingState: !!loadingState,
    usersTableContainer: !!usersTableContainer,
    emptyState: !!emptyState,
    usersTableBody: !!usersTableBody,
    totalUsersCount: !!totalUsersCount,
    pagination: !!pagination,
  });

  // Modales
  const addUserModal = new bootstrap.Modal(
    document.getElementById("addUserModal")
  );
  const editUserModal = new bootstrap.Modal(
    document.getElementById("editUserModal")
  );
  const deleteUserModal = new bootstrap.Modal(
    document.getElementById("deleteUserModal")
  );

  // Formularios
  const addUserForm = document.getElementById("addUserForm");
  const editUserForm = document.getElementById("editUserForm");

  // Inicializar página
  console.log("users-admin.js: Llamando a loadUsers()");
  loadUsers();

  // Event listeners
  setupEventListeners();

  function setupEventListeners() {
    // Búsqueda con debounce
    searchInput.addEventListener(
      "input",
      debounce(function () {
        currentSearch = this.value.trim();
        currentPage = 1;
        loadUsers();
      }, 500)
    );

    // Filtro por rol
    roleFilter.addEventListener("change", function () {
      currentRoleFilter = this.value;
      currentPage = 1;
      loadUsers();
    });

    // Límite por página
    limitSelect.addEventListener("change", function () {
      currentLimit = parseInt(this.value);
      currentPage = 1;
      loadUsers();
    });

    // Formulario agregar usuario
    addUserForm.addEventListener("submit", handleAddUser);

    // Formulario editar usuario
    editUserForm.addEventListener("submit", handleEditUser);

    // Limpiar formularios al cerrar modales
    document
      .getElementById("addUserModal")
      .addEventListener("hidden.bs.modal", function () {
        addUserForm.reset();
        clearFormErrors(addUserForm);
      });

    document
      .getElementById("editUserModal")
      .addEventListener("hidden.bs.modal", function () {
        editUserForm.reset();
        clearFormErrors(editUserForm);
      });
  }

  async function loadUsers() {
    try {
      console.log("Iniciando loadUsers()");
      showLoadingState();

      const params = new URLSearchParams({
        page: currentPage,
        limit: currentLimit,
      });

      if (currentSearch) {
        params.append("search", currentSearch);
      }

      if (currentRoleFilter) {
        params.append("role", currentRoleFilter);
      }

      console.log("Haciendo petición a:", `/api/users?${params}`);

      // Verificar que authenticatedFetch esté disponible
      if (typeof window.authenticatedFetch !== "function") {
        console.error("authenticatedFetch no está disponible");
        throw new Error("Función de autenticación no disponible");
      }

      const response = await window.authenticatedFetch(`/api/users?${params}`);
      console.log("Respuesta recibida:", response.status, response.statusText);

      if (!response.ok) {
        throw new Error("Error al cargar usuarios");
      }

      const result = await response.json();
      console.log("Datos de usuarios:", result);

      if (result.success) {
        // Los datos pueden venir en diferentes formatos dependiendo de la API
        if (Array.isArray(result.data)) {
          // Si data es directamente un array de usuarios
          usersData = result.data;
          displayUsers({
            users: result.data,
            totalUsers: result.data.length,
            totalPages: 1,
            currentPage: currentPage,
          });
        } else if (result.data.users) {
          // Si data es un objeto con propiedad users
          usersData = result.data.users;
          displayUsers(result.data);
        } else {
          throw new Error("Formato de datos no reconocido");
        }
      } else {
        throw new Error(result.message || "Error al cargar usuarios");
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      console.error("Stack trace:", error.stack);

      // Verificar si showAlert está disponible
      if (typeof window.showAlert === "function") {
        window.showAlert(
          "Error al cargar los usuarios: " + error.message,
          "danger"
        );
      } else {
        alert("Error al cargar los usuarios: " + error.message);
      }

      showEmptyState();
    }
  }

  function displayUsers(data) {
    console.log("displayUsers llamado con:", data);
    hideLoadingState();

    if (!data.users || data.users.length === 0) {
      console.log("No hay usuarios para mostrar");
      showEmptyState();
      return;
    }

    console.log("Mostrando", data.users.length, "usuarios");
    showUsersTable();
    updateUsersCount(data.totalUsers || data.users.length);
    renderUsersTable(data.users);
    renderPagination(
      data.pagination || {
        currentPage: currentPage,
        totalPages: Math.ceil(data.totalUsers / currentLimit),
        totalUsers: data.totalUsers,
      }
    );
  }

  function renderUsersTable(users) {
    console.log("renderUsersTable llamado con", users.length, "usuarios");
    console.log("usersTableBody elemento:", usersTableBody);

    if (!usersTableBody) {
      console.error("No se encontró el elemento usersTableBody");
      return;
    }

    usersTableBody.innerHTML = "";

    users.forEach((user, index) => {
      console.log(`Creando fila para usuario ${index + 1}:`, user.email);
      const row = createUserRow(user);
      usersTableBody.appendChild(row);
    });

    console.log(
      "Tabla renderizada con",
      usersTableBody.children.length,
      "filas"
    );
  }

  function createUserRow(user) {
    const row = document.createElement("tr");

    const badgeClass = getRoleBadge(user.role);
    const roleIcon = getRoleIcon(user.role);

    row.innerHTML = `
        <td>
            <div class="d-flex align-items-center">
                <div class="me-3">
                    <i class="bi bi-${roleIcon} text-muted" style="font-size: 1.5rem;"></i>
                </div>
                <div>
                    <h6 class="mb-0">${user.first_name} ${user.last_name}</h6>
                    <small class="text-muted">ID: ${user.id}</small>
                </div>
            </div>
        </td>
        <td>
            <span class="text-break">${user.email}</span>
        </td>
        <td>
            <span class="badge bg-light text-dark">${user.age} años</span>
        </td>
        <td>
            <span class="badge ${badgeClass}">
                <i class="bi bi-${roleIcon} me-1"></i>
                ${capitalize(user.role)}
            </span>
        </td>
        <td>
            <small class="text-muted">
                ${user.createdAt ? formatDate(user.createdAt) : "N/A"}
            </small>
        </td>
        <td class="text-center">
            <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-outline-primary" 
                        onclick="editUser('${user.id}')" 
                        title="Editar usuario">
                    <i class="bi bi-pencil"></i>
                </button>
                <button type="button" class="btn btn-outline-danger" 
                        onclick="confirmDelete('${user.id}', '${
      user.first_name
    } ${user.last_name}')" 
                        title="Eliminar usuario"
                        ${user.role === "admin" ? "disabled" : ""}>
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </td>
    `;

    return row;
  }

  function renderPagination(pagination) {
    if (!pagination || pagination.totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    const totalPages = pagination.totalPages;
    const current = pagination.currentPage;

    let paginationHTML = "";

    // Botón Anterior
    paginationHTML += `
        <li class="page-item ${current === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${
              current - 1
            })" aria-label="Anterior">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;

    // Números de página
    const startPage = Math.max(1, current - 2);
    const endPage = Math.min(totalPages, current + 2);

    if (startPage > 1) {
      paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(1)">1</a></li>`;
      if (startPage > 2) {
        paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
            <li class="page-item ${i === current ? "active" : ""}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
      paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages})">${totalPages}</a></li>`;
    }

    // Botón Siguiente
    paginationHTML += `
        <li class="page-item ${current === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${
              current + 1
            })" aria-label="Siguiente">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;

    document.getElementById("pagination").innerHTML = paginationHTML;
  }

  function changePage(page) {
    if (page < 1) return;
    currentPage = page;
    loadUsers();
  }

  function showLoadingState() {
    loadingState.classList.remove("d-none");
    usersTableContainer.classList.add("d-none");
    emptyState.classList.add("d-none");
  }

  function hideLoadingState() {
    loadingState.classList.add("d-none");
  }

  function showUsersTable() {
    usersTableContainer.classList.remove("d-none");
    emptyState.classList.add("d-none");
  }

  function showEmptyState() {
    hideLoadingState();
    usersTableContainer.classList.add("d-none");
    emptyState.classList.remove("d-none");
    updateUsersCount(0);
  }

  function updateUsersCount(count) {
    totalUsersCount.textContent = `${count} usuario${count !== 1 ? "s" : ""}`;
  }

  async function handleAddUser(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const submitBtn = this.querySelector('button[type="submit"]');

    const userData = {
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      email: formData.get("email"),
      age: parseInt(formData.get("age")),
      password: formData.get("password"),
      role: formData.get("role"),
    };

    try {
      setButtonLoading(submitBtn, true);
      clearFormErrors(this);

      const response = await authenticatedFetch("/api/users/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showAlert("Usuario creado exitosamente", "success");
        addUserModal.hide();
        this.reset();
        loadUsers();
      } else {
        if (result.errors) {
          showFieldErrors(this, result.errors);
        } else {
          showAlert(result.message || "Error al crear usuario", "danger");
        }
      }
    } catch (error) {
      console.error("Error creando usuario:", error);
      showAlert("Error de conexión al crear usuario", "danger");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  }

  async function editUser(userId) {
    const user = usersData.find((u) => u.id === userId);
    if (!user) return;

    // Llenar formulario
    document.getElementById("edit_user_id").value = user.id;
    document.getElementById("edit_first_name").value = user.first_name;
    document.getElementById("edit_last_name").value = user.last_name;
    document.getElementById("edit_email").value = user.email;
    document.getElementById("edit_age").value = user.age;
    document.getElementById("edit_role").value = user.role;

    editUserModal.show();
  }

  async function handleEditUser(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const submitBtn = this.querySelector('button[type="submit"]');
    const userId = formData.get("user_id");

    const userData = {
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      email: formData.get("email"),
      age: parseInt(formData.get("age")),
      role: formData.get("role"),
    };

    try {
      setButtonLoading(submitBtn, true);
      clearFormErrors(this);

      const response = await authenticatedFetch(`/api/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showAlert("Usuario actualizado exitosamente", "success");
        editUserModal.hide();
        loadUsers();
      } else {
        if (result.errors) {
          showFieldErrors(this, result.errors);
        } else {
          showAlert(result.message || "Error al actualizar usuario", "danger");
        }
      }
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      showAlert("Error de conexión al actualizar usuario", "danger");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  }

  function confirmDelete(userId, userName) {
    document.getElementById("deleteUserId").value = userId;
    document.getElementById("deleteUserName").textContent = userName;
    deleteUserModal.show();
  }

  async function confirmDeleteUser() {
    const userId = document.getElementById("deleteUserId").value;
    const deleteBtn = document.querySelector("#deleteUserModal .btn-danger");

    try {
      setButtonLoading(deleteBtn, true);

      const response = await authenticatedFetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showAlert("Usuario eliminado exitosamente", "success");
        deleteUserModal.hide();
        loadUsers();
      } else {
        showAlert(result.message || "Error al eliminar usuario", "danger");
      }
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      showAlert("Error de conexión al eliminar usuario", "danger");
    } finally {
      setButtonLoading(deleteBtn, false);
    }
  }

  function refreshUsers() {
    currentPage = 1;
    currentSearch = "";
    currentRoleFilter = "";

    searchInput.value = "";
    roleFilter.value = "";

    loadUsers();
  }

  // Exportar funciones globales
  window.changePage = changePage;
  window.editUser = editUser;
  window.confirmDelete = confirmDelete;
  window.confirmDeleteUser = confirmDeleteUser;
  window.refreshUsers = refreshUsers;
}); // Fin del DOMContentLoaded
