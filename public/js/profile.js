document.addEventListener("DOMContentLoaded", function () {
  const editProfileBtn = document.getElementById("editProfileBtn");
  const editProfileModal = new bootstrap.Modal(
    document.getElementById("editProfileModal")
  );
  const editProfileForm = document.getElementById("editProfileForm");

  editProfileBtn.addEventListener("click", function () {
    editProfileModal.show();
  });

  editProfileForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    // Limpiar campos vacíos de contraseña
    if (!data.currentPassword) {
      delete data.currentPassword;
      delete data.newPassword;
      delete data.confirmPassword;
    }

    try {
      const saveBtn = document.getElementById("saveProfileBtn");
      const spinner = document.getElementById("saveProfileSpinner");

      saveBtn.disabled = true;
      spinner.classList.remove("d-none");

      const response = await window.authenticatedFetch(
        "/api/users/profile/me",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        if (window.showAlert) {
          window.showAlert("Perfil actualizado exitosamente", "success");
        } else {
          alert("Perfil actualizado exitosamente");
        }
        editProfileModal.hide();
        // Recargar la página para mostrar los cambios
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        if (window.showAlert) {
          window.showAlert(
            result.message || "Error al actualizar el perfil",
            "danger"
          );
        } else {
          alert(result.message || "Error al actualizar el perfil");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      if (window.showAlert) {
        window.showAlert(
          "Error de conexión. Por favor, intenta de nuevo.",
          "danger"
        );
      } else {
        alert("Error de conexión. Por favor, intenta de nuevo.");
      }
    } finally {
      const saveBtn = document.getElementById("saveProfileBtn");
      const spinner = document.getElementById("saveProfileSpinner");

      saveBtn.disabled = false;
      spinner.classList.add("d-none");
    }
  });
});
