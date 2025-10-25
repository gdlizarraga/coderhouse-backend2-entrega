// Archivo JavaScript principal para todas las páginas

// Variables globales
window.API_BASE_URL = "/api";

// Funciones de utilidad
function getAuthToken() {
  return (
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
  );
}

function setAuthToken(token, remember = false) {
  if (remember) {
    localStorage.setItem("authToken", token);
    sessionStorage.removeItem("authToken");
  } else {
    sessionStorage.setItem("authToken", token);
    localStorage.removeItem("authToken");
  }
}

function removeAuthToken() {
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
  // Also remove the cookie
  document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

// Función para hacer requests autenticados
async function authenticatedFetch(url, options = {}) {
  const token = getAuthToken();

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);

    // Si el token expiró, redirect al login
    if (response.status === 401) {
      removeAuthToken();
      window.location.href = "/login";
      return null;
    }

    return response;
  } catch (error) {
    console.error("Error en request autenticado:", error);
    throw error;
  }
}

// Función para mostrar alertas
function showAlert(message, type = "info", duration = 5000) {
  const alertsContainer = document.getElementById("alertsContainer");
  if (!alertsContainer) return;

  const alertId = "alert-" + Date.now();
  const alertHTML = `
        <div class="container mt-3">
            <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
                <i class="bi bi-${getAlertIcon(type)} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        </div>
    `;

  alertsContainer.insertAdjacentHTML("beforeend", alertHTML);

  // Auto-hide después de duration
  if (duration > 0) {
    setTimeout(() => {
      const alertElement = document.getElementById(alertId);
      if (alertElement) {
        const bsAlert = new bootstrap.Alert(alertElement);
        bsAlert.close();
      }
    }, duration);
  }
}

function getAlertIcon(type) {
  const icons = {
    success: "check-circle",
    danger: "exclamation-triangle",
    warning: "exclamation-triangle",
    info: "info-circle",
    primary: "info-circle",
  };
  return icons[type] || "info-circle";
}

// Función para actualizar el navbar con información del usuario
function updateNavbarWithUser(user) {
  // Actualizar menú de navegación principal
  const navbarNav = document.querySelector("#navbarNav .navbar-nav.me-auto");
  if (navbarNav && user) {
    navbarNav.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="/">
          <i class="bi bi-house-door me-1"></i>
          Inicio
        </a>
      </li>
      ${
        user.role === "admin"
          ? `
      <li class="nav-item">
        <a class="nav-link" href="/users">
          <i class="bi bi-people me-1"></i>
          Gestionar Usuarios
        </a>
      </li>
      `
          : ""
      }
    `;
  }

  // Actualizar menú de usuario (lado derecho)
  const userNavbar = document.querySelector(
    "#navbarNav .navbar-nav:last-child"
  );
  if (userNavbar && user) {
    userNavbar.innerHTML = `
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown">
          <i class="bi bi-person-circle me-1"></i>
          ${user.fullName || user.email}
        </a>
        <ul class="dropdown-menu">
          <li>
            <h6 class="dropdown-header">
              <i class="bi bi-person me-1"></i>
              ${user.fullName || "Usuario"}
            </h6>
          </li>
          <li><hr class="dropdown-divider"></li>
          <li>
            <span class="dropdown-item-text">
              <small class="text-muted">
                <i class="bi bi-envelope me-1"></i>
                ${user.email}
              </small>
            </span>
          </li>
          <li>
            <span class="dropdown-item-text">
              <small class="text-muted">
                <i class="bi bi-shield me-1"></i>
                Rol: <span class="badge ${getRoleBadge(user.role)}">${
      user.role
    }</span>
              </small>
            </span>
          </li>
          <li><hr class="dropdown-divider"></li>
          <li>
            <a class="dropdown-item" href="#" onclick="logout()">
              <i class="bi bi-box-arrow-right me-1"></i>
              Cerrar Sesión
            </a>
          </li>
        </ul>
      </li>
    `;
  }

  // Actualizar contenido principal si estamos en la página home
  if (window.location.pathname === "/" || window.location.pathname === "") {
    updateHomePageContent(user);
  }
}

// Función para actualizar el contenido de la página home según el usuario
function updateHomePageContent(user) {
  // Buscar la sección principal (jumbotron) que contiene los botones de login/register
  const jumbotron = document.querySelector(".jumbotron");
  if (jumbotron && user) {
    // Contenido específico según el rol del usuario
    let additionalContent = "";
    if (user.role === "admin") {
      additionalContent = `
        <div class="mt-4">
          <div class="alert alert-info border-0 shadow-sm">
            <i class="bi bi-info-circle me-2"></i>
            <strong>Panel de Administrador:</strong> 
            Usa el menú "Gestionar Usuarios" para acceder al panel de administración.
          </div>
        </div>
      `;
    }

    // Reemplazar el contenido con la vista para usuarios autenticados
    jumbotron.innerHTML = `
      <h1 class="display-4">
        ¡Bienvenido, ${user.fullName || user.first_name || user.email}!
      </h1>
      <p class="lead">
        Has iniciado sesión exitosamente en el Sistema de Gestión de Usuarios
      </p>
      <hr class="my-4" style="border-color: rgba(255,255,255,0.3);">
      <p>
        <i class="bi bi-shield-check me-2"></i>
        Tu rol actual es: <strong>${user.role}</strong>
      </p>
      ${additionalContent}
    `;

    // Cambiar las clases para que tenga el mismo estilo que la versión autenticada
    jumbotron.className = "jumbotron bg-primary text-white p-5 rounded mb-4";
  }

  // Ocultar la sección de características si existe (es para usuarios no autenticados)
  const featuresSection = document.querySelector(".row.g-4.mb-5");
  if (featuresSection && user) {
    featuresSection.style.display = "none";
  }
}

// Función para logout
async function logout() {
  try {
    const token = getAuthToken();
    if (token) {
      await fetch("/api/sessions/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error("Error durante logout:", error);
  } finally {
    removeAuthToken();
    window.location.href = "/login";
  }
}

// Función para formatear fechas
function formatDate(dateString) {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("es-ES", options);
}

// Función para validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función para capitalizar texto
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Función para obtener badge de rol
function getRoleBadge(role) {
  const badges = {
    admin: "bg-danger",
    premium: "bg-warning text-dark",
    user: "bg-primary",
  };
  return badges[role] || "bg-secondary";
}

// Función para obtener icono de rol
function getRoleIcon(role) {
  const icons = {
    admin: "shield-fill-exclamation",
    premium: "star-fill",
    user: "person-circle",
  };
  return icons[role] || "person";
}

// Función para debounce (útil para búsquedas)
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Función para mostrar loading en botones
function setButtonLoading(button, loading = true) {
  const spinner = button.querySelector(".spinner-border");
  const icon = button.querySelector("i:not(.spinner-border)");

  if (loading) {
    button.disabled = true;
    if (spinner) spinner.classList.remove("d-none");
    if (icon) icon.classList.add("d-none");
  } else {
    button.disabled = false;
    if (spinner) spinner.classList.add("d-none");
    if (icon) icon.classList.remove("d-none");
  }
}

// Función para limpiar errores de formulario
function clearFormErrors(form) {
  const invalidFields = form.querySelectorAll(".is-invalid");
  invalidFields.forEach((field) => {
    field.classList.remove("is-invalid");
  });

  const errorMessages = form.querySelectorAll(".invalid-feedback");
  errorMessages.forEach((msg) => {
    msg.textContent = "";
  });
}

// Función para mostrar errores de campo
function showFieldErrors(form, errors) {
  errors.forEach((error) => {
    const field =
      form.querySelector(`[name="${error.field}"]`) ||
      form.querySelector(`#${error.field}`);
    if (field) {
      field.classList.add("is-invalid");
      const feedback = field.parentElement.querySelector(".invalid-feedback");
      if (feedback) {
        feedback.textContent = error.message;
      }
    }
  });
}

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", function () {
  // Configurar tooltips de Bootstrap
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Verificar si hay token válido y actualizar UI si es necesario
  const token = getAuthToken();

  if (
    token &&
    window.location.pathname !== "/login" &&
    window.location.pathname !== "/register"
  ) {
    // Verificar validez del token
    fetch("/api/sessions/validate", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          removeAuthToken();
          if (
            window.location.pathname !== "/" &&
            window.location.pathname !== "/login" &&
            window.location.pathname !== "/register"
          ) {
            window.location.href = "/login";
          }
        } else {
          // Token válido, obtener información del usuario y actualizar menú
          return response.json();
        }
      })
      .then((result) => {
        if (result && result.success && result.data.user) {
          updateNavbarWithUser(result.data.user);
        }
      })
      .catch((error) => {
        console.error("Error validando token:", error);
      });
  }

  // Manejar enlaces que requieren autenticación
  const protectedLinks = document.querySelectorAll("[data-require-auth]");
  protectedLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (!getAuthToken()) {
        e.preventDefault();
        showAlert("Debes iniciar sesión para acceder a esta página", "warning");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    });
  });
});

// Función para manejar errores de red
window.addEventListener("online", function () {
  showAlert("Conexión restablecida", "success", 3000);
});

window.addEventListener("offline", function () {
  showAlert("Sin conexión a internet", "warning", 0);
});

// Exportar funciones globales
window.showAlert = showAlert;
window.logout = logout;
window.authenticatedFetch = authenticatedFetch;
window.getAuthToken = getAuthToken;
window.setAuthToken = setAuthToken;
window.removeAuthToken = removeAuthToken;
window.updateNavbarWithUser = updateNavbarWithUser;
window.updateHomePageContent = updateHomePageContent;
window.formatDate = formatDate;
window.isValidEmail = isValidEmail;
window.capitalize = capitalize;
window.getRoleBadge = getRoleBadge;
window.getRoleIcon = getRoleIcon;
window.debounce = debounce;
window.setButtonLoading = setButtonLoading;
window.clearFormErrors = clearFormErrors;
window.showFieldErrors = showFieldErrors;
