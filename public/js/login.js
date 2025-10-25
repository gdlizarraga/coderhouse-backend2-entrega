// JavaScript para la página de login
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const submitBtn = document.getElementById("submitBtn");
  const loginSpinner = document.getElementById("loginSpinner");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  // Toggle password visibility
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", function () {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);

      const icon = this.querySelector("i");
      if (icon) {
        if (type === "password") {
          icon.classList.remove("bi-eye-slash");
          icon.classList.add("bi-eye");
        } else {
          icon.classList.remove("bi-eye");
          icon.classList.add("bi-eye-slash");
        }
      }
    });
  }

  // Handle form submission
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault(); // Prevent default form GET submission
      e.stopPropagation(); // Stop event bubbling

      const formData = new FormData(this);
      const data = {
        email: formData.get("email"),
        password: formData.get("password"),
      };

      try {
        // Show loading state
        if (submitBtn) submitBtn.disabled = true;
        if (loginSpinner) loginSpinner.classList.remove("d-none");

        const response = await fetch("/api/sessions/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Store token using the utility function
          if (window.setAuthToken) {
            window.setAuthToken(
              result.data.token,
              !!formData.get("rememberMe")
            );
          } else {
            // Fallback manual storage
            if (formData.get("rememberMe")) {
              localStorage.setItem("authToken", result.data.token);
              sessionStorage.removeItem("authToken");
            } else {
              sessionStorage.setItem("authToken", result.data.token);
              localStorage.removeItem("authToken");
            }
          }

          // Also set as cookie for server-side access
          const expirationDays = formData.get("rememberMe") ? 7 : 1;
          document.cookie = `authToken=${result.data.token}; path=/; max-age=${
            expirationDays * 24 * 60 * 60
          }; SameSite=Lax`;

          if (window.showAlert) {
            showAlert("¡Inicio de sesión exitoso! Redirigiendo...", "success");
          } else {
            alert("¡Inicio de sesión exitoso!");
          }

          // Actualizar el menú con la información del usuario si la función está disponible
          if (window.updateNavbarWithUser && result.data.user) {
            window.updateNavbarWithUser(result.data.user);
          }

          // Redirect all users to home first
          // Admins will see the "Gestionar Usuarios" menu option to navigate to /users
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        } else {
          if (window.showAlert) {
            showAlert(result.message || "Error al iniciar sesión", "danger");
          } else {
            alert(result.message || "Error al iniciar sesión");
          }
          clearFormErrors();

          // Show field-specific errors if available
          if (result.errors) {
            showFieldErrors(result.errors);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        if (window.showAlert) {
          showAlert(
            "Error de conexión. Por favor, intenta de nuevo.",
            "danger"
          );
        } else {
          alert("Error de conexión. Por favor, intenta de nuevo.");
        }
      } finally {
        // Hide loading state
        if (submitBtn) submitBtn.disabled = false;
        if (loginSpinner) loginSpinner.classList.add("d-none");
      }

      return false; // Extra safety to prevent form submission
    });
  } else {
    console.error("Login form not found!");
  }

  function showFieldErrors(errors) {
    if (!Array.isArray(errors)) return;

    errors.forEach((error) => {
      const field = document.getElementById(error.field);
      if (field) {
        field.classList.add("is-invalid");
        const feedback = field.parentElement.querySelector(".invalid-feedback");
        if (feedback) {
          feedback.textContent = error.message;
        }
      }
    });
  }

  function clearFormErrors() {
    const invalidFields = document.querySelectorAll(".is-invalid");
    invalidFields.forEach((field) => {
      field.classList.remove("is-invalid");
    });
  }

  // Clear validation on input
  const inputs = document.querySelectorAll("input");
  inputs.forEach((input) => {
    input.addEventListener("input", function () {
      this.classList.remove("is-invalid");
    });
  });
});
