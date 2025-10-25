document.addEventListener("DOMContentLoaded", function () {
  // Cargar configuraciones guardadas
  loadUserSettings();

  // Event listeners para formularios
  setupEventListeners();
});

function setupEventListeners() {
  // Formulario de cambio de contraseña
  const changePasswordForm = document.getElementById("changePasswordForm");
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", handlePasswordChange);
  }

  // Switches de notificaciones
  const notificationSwitches = document.querySelectorAll(
    "#emailNotifications, #securityAlerts, #systemUpdates"
  );
  notificationSwitches.forEach((toggle) => {
    toggle.addEventListener("change", function () {
      console.log(`${this.id} changed to: ${this.checked}`);
    });
  });
}

async function handlePasswordChange(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  // Validar que las contraseñas coincidan
  if (newPassword !== confirmPassword) {
    showAlert("Las contraseñas no coinciden", "error");
    return;
  }

  // Validar longitud mínima
  if (newPassword.length < 6) {
    showAlert("La contraseña debe tener al menos 6 caracteres", "error");
    return;
  }

  try {
    showLoading(true);

    const response = await authenticatedFetch("/api/users/profile/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword: currentPassword,
        password: newPassword,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showAlert("Contraseña actualizada correctamente", "success");

      // Cerrar modal y limpiar formulario
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("changePasswordModal")
      );
      modal.hide();
      e.target.reset();
    } else {
      showAlert(data.message || "Error al cambiar la contraseña", "error");
    }
  } catch (error) {
    console.error("Error changing password:", error);
    showAlert("Error al cambiar la contraseña", "error");
  } finally {
    showLoading(false);
  }
}

function saveNotificationSettings() {
  const settings = {
    emailNotifications: document.getElementById("emailNotifications").checked,
    securityAlerts: document.getElementById("securityAlerts").checked,
    systemUpdates: document.getElementById("systemUpdates").checked,
  };

  // Guardar en localStorage por ahora (se podría implementar en el backend)
  localStorage.setItem("userSettings", JSON.stringify(settings));

  showAlert("Configuración guardada correctamente", "success");
  console.log("Settings saved:", settings);
}

function loadUserSettings() {
  // Cargar configuraciones desde localStorage
  const savedSettings = localStorage.getItem("userSettings");

  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);

      // Aplicar configuraciones guardadas
      Object.keys(settings).forEach((key) => {
        const element = document.getElementById(key);
        if (element && typeof settings[key] === "boolean") {
          element.checked = settings[key];
        }
      });
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  } else {
    // Configuraciones por defecto
    const defaults = {
      emailNotifications: true,
      securityAlerts: true,
      systemUpdates: false,
    };

    Object.keys(defaults).forEach((key) => {
      const element = document.getElementById(key);
      if (element) {
        element.checked = defaults[key];
      }
    });
  }
}

async function logoutEverywhere() {
  if (
    !confirm(
      "¿Estás seguro de que quieres cerrar todas las sesiones? Tendrás que volver a iniciar sesión."
    )
  ) {
    return;
  }

  try {
    showLoading(true);

    // Llamar al endpoint de logout (si existe)
    const response = await authenticatedFetch("/api/auth/logout-all", {
      method: "POST",
    });

    if (response.ok || response.status === 404) {
      // Limpiar tokens locales
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      document.cookie =
        "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";

      showAlert(
        "Todas las sesiones han sido cerradas. Serás redirigido...",
        "success"
      );

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } else {
      showAlert("Error al cerrar las sesiones", "error");
    }
  } catch (error) {
    console.error("Error logging out everywhere:", error);
    // Aún así limpiar tokens locales
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";

    showAlert("Sesiones locales cerradas. Serás redirigido...", "success");
    setTimeout(() => {
      window.location.href = "/login";
    }, 2000);
  } finally {
    showLoading(false);
  }
}

// Función auxiliar para mostrar alertas
function showAlert(message, type) {
  // Crear elemento de alerta
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${
    type === "error" ? "danger" : type === "success" ? "success" : "info"
  } alert-dismissible fade show`;
  alertDiv.style.position = "fixed";
  alertDiv.style.top = "20px";
  alertDiv.style.right = "20px";
  alertDiv.style.zIndex = "9999";
  alertDiv.style.minWidth = "300px";

  alertDiv.innerHTML = `
        <i class="fas fa-${
          type === "error"
            ? "exclamation-circle"
            : type === "success"
            ? "check-circle"
            : "info-circle"
        } me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

  document.body.appendChild(alertDiv);

  // Auto-remove después de 5 segundos
  setTimeout(() => {
    if (alertDiv && alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}

// Función auxiliar para mostrar/ocultar loading
function showLoading(show) {
  const existingLoader = document.getElementById("settingsLoader");

  if (show && !existingLoader) {
    const loader = document.createElement("div");
    loader.id = "settingsLoader";
    loader.className =
      "position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center";
    loader.style.backgroundColor = "rgba(0,0,0,0.5)";
    loader.style.zIndex = "9998";

    loader.innerHTML = `
            <div class="spinner-border text-light" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
        `;

    document.body.appendChild(loader);
  } else if (!show && existingLoader) {
    existingLoader.remove();
  }
}
