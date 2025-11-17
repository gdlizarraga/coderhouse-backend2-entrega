// JavaScript para la página de registro
document.addEventListener("DOMContentLoaded", function () {
  console.log("Register page script loaded");

  const registerForm = document.getElementById("registerForm");
  const submitBtn = document.getElementById("submitBtn");
  const registerSpinner = document.getElementById("registerSpinner");
  const togglePassword = document.getElementById("togglePassword");
  const toggleConfirmPassword = document.getElementById(
    "toggleConfirmPassword"
  );
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  console.log("Form elements found:", {
    registerForm: !!registerForm,
    submitBtn: !!submitBtn,
    registerSpinner: !!registerSpinner,
  });

  function togglePasswordVisibility(input, button) {
    if (!input || !button) return;

    const type =
      input.getAttribute("type") === "password" ? "text" : "password";
    input.setAttribute("type", type);

    const icon = button.querySelector("i");
    if (!icon) return;

    if (type === "password") {
      icon.classList.remove("bi-eye-slash");
      icon.classList.add("bi-eye");
    } else {
      icon.classList.remove("bi-eye");
      icon.classList.add("bi-eye-slash");
    }
  }

  // Toggle password visibility
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", function () {
      togglePasswordVisibility(passwordInput, this);
    });
  }

  if (toggleConfirmPassword && confirmPasswordInput) {
    toggleConfirmPassword.addEventListener("click", function () {
      togglePasswordVisibility(confirmPasswordInput, this);
    });
  }

  if (confirmPasswordInput && passwordInput) {
    confirmPasswordInput.addEventListener("input", function () {
      if (this.value !== passwordInput.value) {
        this.classList.add("is-invalid");
        const feedback =
          this.parentElement.parentElement.querySelector(".invalid-feedback");
        if (feedback) feedback.textContent = "Las contraseñas no coinciden";
      } else {
        this.classList.remove("is-invalid");
      }
    });

    passwordInput.addEventListener("input", function () {
      if (
        confirmPasswordInput.value &&
        confirmPasswordInput.value !== this.value
      ) {
        confirmPasswordInput.classList.add("is-invalid");
        const feedback =
          confirmPasswordInput.parentElement.parentElement.querySelector(
            ".invalid-feedback"
          );
        if (feedback) feedback.textContent = "Las contraseñas no coinciden";
      } else {
        confirmPasswordInput.classList.remove("is-invalid");
      }
    });
  }

  if (registerForm) {
    console.log("Adding submit event listener to form");

    registerForm.addEventListener("submit", async function (e) {
      console.log("Form submit event triggered");
      e.preventDefault(); // CRUCIAL: prevent default form GET submission
      e.stopPropagation(); // Also stop event bubbling

      console.log("Default prevented, processing form...");

      const formData = new FormData(this);

      // Validate password confirmation
      if (formData.get("password") !== formData.get("confirmPassword")) {
        if (window.showAlert) {
          showAlert("Las contraseñas no coinciden", "danger");
        } else {
          alert("Las contraseñas no coinciden");
        }
        return false;
      }

      const data = {
        first_name: formData.get("first_name"),
        last_name: formData.get("last_name"),
        email: formData.get("email"),
        age: parseInt(formData.get("age")) || null,
        password: formData.get("password"),
        role: formData.get("role") || "user",
      };

      console.log("Sending registration data:", data);

      try {
        // Show loading state
        if (submitBtn) submitBtn.disabled = true;
        if (registerSpinner) registerSpinner.classList.remove("d-none");

        const response = await fetch("/api/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        console.log("Response status:", response.status);

        const result = await response.json().catch(() => ({}));
        console.log("Response data:", result);

        if (response.ok && result.success) {
          if (window.showAlert) {
            showAlert(
              "¡Cuenta creada exitosamente! Redirigiendo al inicio de sesión...",
              "success"
            );
          } else {
            alert("¡Cuenta creada exitosamente!");
          }
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
        } else {
          if (window.showAlert) {
            showAlert(result.message || "Error al crear la cuenta", "danger");
          } else {
            alert(result.message || "Error al crear la cuenta");
          }
          clearFormErrors();
          if (result.errors) showFieldErrors(result.errors);
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
        if (submitBtn) submitBtn.disabled = false;
        if (registerSpinner) registerSpinner.classList.add("d-none");
      }

      return false; // Extra safety to prevent form submission
    });
  } else {
    console.error("Register form not found!");
  }

  function showFieldErrors(errors) {
    if (!Array.isArray(errors)) return;

    errors.forEach((error) => {
      const field =
        document.getElementById(error.field) ||
        document.querySelector(`[name="${error.field}"]`);
      if (field) {
        field.classList.add("is-invalid");
        const feedback =
          field.parentElement.querySelector(".invalid-feedback") ||
          field.parentElement.parentElement.querySelector(".invalid-feedback");
        if (feedback) feedback.textContent = error.message;
      }
    });
  }

  function clearFormErrors() {
    const invalidFields = document.querySelectorAll(".is-invalid");
    invalidFields.forEach((field) => field.classList.remove("is-invalid"));

    const errorMessages = document.querySelectorAll(".invalid-feedback");
    errorMessages.forEach((msg) => {
      if (msg) msg.textContent = "";
    });
  }

  // Age validation
  const ageInput = document.getElementById("age");
  if (ageInput) {
    ageInput.addEventListener("input", function () {
      const age = parseInt(this.value);
      const feedback = this.parentElement.querySelector(".invalid-feedback");

      if (age < 18) {
        this.classList.add("is-invalid");
        if (feedback) feedback.textContent = "Debes ser mayor de 18 años";
      } else if (age > 120) {
        this.classList.add("is-invalid");
        if (feedback)
          feedback.textContent = "Por favor, ingresa una edad válida";
      } else {
        this.classList.remove("is-invalid");
        if (feedback) feedback.textContent = "";
      }
    });
  }
});
