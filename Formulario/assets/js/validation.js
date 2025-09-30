document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos
  const form = document.getElementById("formRegistro");
  const btnSubmit = document.getElementById("btnSubmit");
  const successMsg = document.getElementById("form-success");

  const nombre = document.getElementById("nombre");
  const email = document.getElementById("email");
  const fechaNacimiento = document.getElementById("fechaNacimiento");
  const celular = document.getElementById("celular");
  const telefono = document.getElementById("telefono");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const terminos = document.getElementById("terminos");
  const captcha = document.getElementById("captcha");
  const touched = new Set(); // ids de campos “tocados”
  let submitted = false; // se vuelve true al intentar enviar

  //validador del captcha (usa grecaptcha)
  function validateCaptcha() {
    const token = (window.grecaptcha && grecaptcha.getResponse()) || "";
    const isValid = token.length > 0;

    //rellenar el input oculto para satisfacer "required"
    captcha.value = isValid ? token : "";

    setFieldState(
      captcha,
      isValid,
      isValid ? "" : "Por favor marca la casilla 'No soy un robot'."
    );
    return isValid;
  }

  //callbacks globales:
  window.onCaptchaSuccess = function () {
    validateCaptcha();
    updateSubmitState();
  };

  window.onCaptchaExpired = function () {
    if (window.grecaptcha) grecaptcha.reset();
    captcha.value = ""; // <<< limpia el valor
    setFieldState(captcha, false, "El captcha expiró. Vuelve a marcarlo.");
    updateSubmitState();
  };

  /** Aplica estilos y mensaje de error para un campo */
  function setFieldState(input, isValid, message = "") {
    const errorEl = document.getElementById(`${input.id}-error`);

    // Clases visuales solo si el usuario ya tocó el campo o hubo submit
    if (shouldShow(input)) {
      input.classList.toggle("is-invalid", !isValid);
      input.classList.toggle("is-valid", isValid);
      if (errorEl) errorEl.textContent = isValid ? "" : message;
    } else {
      // Estado inicial: sin clases y sin texto
      input.classList.remove("is-invalid", "is-valid");
      if (errorEl) errorEl.textContent = "";
    }

    // Mantén la validez del navegador (para habilitar/deshabilitar el botón)
    input.setCustomValidity(isValid ? "" : message || "Campo inválido");
  }

  /** Habilita/deshabilita el botón de enviar según la validez global */
  function updateSubmitState() {
    const isFormValid = form.checkValidity();
    btnSubmit.disabled = !isFormValid;
  }

  /** Calcula si la persona tiene al menos 18 años */
  function esMayorDe18(dateStr) {
    const hoy = new Date();
    const fecha = new Date(dateStr);
    if (isNaN(fecha.getTime())) return false;

    let edad = hoy.getFullYear() - fecha.getFullYear();
    const m = hoy.getMonth() - fecha.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) {
      edad--;
    }
    return edad >= 18;
  }

  /** Normaliza una cadena a sólo dígitos */
  function soloDigitos(value) {
    return (value || "").replace(/\D+/g, "");
  }

  // === Validaciones individuales ===

  function validateNombre() {
    const value = nombre.value.trim();
    const isValid = value.length >= 3;
    setFieldState(
      nombre,
      isValid,
      isValid ? "" : "Escribe tu nombre (mínimo 3 caracteres)."
    );
  }

  function validateEmail() {
    // Normalizamos: quitamos espacios y pasamos a minúsculas
    const cleaned = email.value.trim().replace(/\s+/g, "").toLowerCase();
    if (email.value !== cleaned) email.value = cleaned;

    // Regex básico: algo@algo.algo (al menos un punto en el dominio)
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = cleaned !== "" && re.test(cleaned);

    setFieldState(
      email,
      isValid,
      isValid
        ? ""
        : "Ingresa un correo electrónico válido (ej. usuario@dominio.com)."
    );
  }

  function validateFechaNacimiento() {
    const value = fechaNacimiento.value;
    const isValid = value && esMayorDe18(value);
    setFieldState(
      fechaNacimiento,
      isValid,
      isValid ? "" : "Debes ser mayor de 18 años."
    );
  }

  function validateCelular() {
    /*
      Formato Colombia:
      - Opcional prefijo +57
      - Debe iniciar en 3 y tener 10 dígitos totales (3XX XXX XXXX)
    */
    const regexCelular = /^(?:\+57\s?)?(3\d{2})[\s.-]?\d{3}[\s.-]?\d{4}$/;
    const value = celular.value.trim();
    const isValid = regexCelular.test(value);
    setFieldState(
      celular,
      isValid,
      isValid ? "" : "Celular inválido. Ej: +57 3XX XXX XXXX o 3XXXXXXXXX."
    );
  }

  function validateTelefono() {
    /*
      Campo opcional. Si viene vacío, es válido.
      Si NO está vacío: al menos 10 dígitos (permitiendo +, (), espacios y guiones).
    */
    const value = telefono.value.trim();
    if (value === "") {
      setFieldState(telefono, true, "");
      return;
    }
    const digits = soloDigitos(value);
    const isValid = digits.length >= 10;
    setFieldState(
      telefono,
      isValid,
      isValid ? "" : "Si lo ingresas, debe tener al menos 10 dígitos."
    );
  }

  function validatePassword() {
    /*
      Reglas: min 8, 1 mayúscula, 1 dígito y 1 carácter especial.
      También aprovechamos pattern en el HTML.
    */
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-]).{8,}$/;
    const value = password.value;
    const isValid = regex.test(value);
    setFieldState(
      password,
      isValid,
      isValid
        ? ""
        : "Incluye 1 mayúscula, 1 número y 1 carácter especial (mín. 8)."
    );
    // Si cambia la contraseña, revalidamos la confirmación
    if (confirmPassword.value) validateConfirmPassword();
  }

  function validateConfirmPassword() {
    const isValid =
      confirmPassword.value !== "" && confirmPassword.value === password.value;
    setFieldState(
      confirmPassword,
      isValid,
      isValid ? "" : "Las contraseñas no coinciden."
    );
  }

  function validateTerminos() {
    const isValid = terminos.checked;
    setFieldState(
      terminos,
      isValid,
      isValid ? "" : "Debes aceptar los términos para continuar."
    );
  }

  // Marca un campo como "tocado" cuando pierde el foco
  [
    nombre,
    email,
    fechaNacimiento,
    celular,
    telefono,
    password,
    confirmPassword,
    terminos,
    captcha,
  ].forEach((el) => {
    el.addEventListener("blur", () => touched.add(el.id));
    // Si el usuario empieza a escribir, también lo consideramos "tocado"
    el.addEventListener("input", () => {
      if (el.type !== "checkbox" && el.value.trim() !== "") {
        touched.add(el.id);
      }
    });
  });

  // === Listeners por campo para validación en vivo ===
  nombre.addEventListener("input", () => {
    validateNombre();
    updateSubmitState();
  });
  email.addEventListener("input", () => {
    validateEmail();
    updateSubmitState();
  });
  fechaNacimiento.addEventListener("input", () => {
    validateFechaNacimiento();
    updateSubmitState();
  });
  celular.addEventListener("input", () => {
    validateCelular();
    updateSubmitState();
  });
  telefono.addEventListener("input", () => {
    validateTelefono();
    updateSubmitState();
  });
  password.addEventListener("input", () => {
    validatePassword();
    updateSubmitState();
  });
  confirmPassword.addEventListener("input", () => {
    validateConfirmPassword();
    updateSubmitState();
  });
  terminos.addEventListener("change", () => {
    validateTerminos();
    updateSubmitState();
  });

  // === Inicialización ===
  // 1) Definir el máximo permitido para fecha de nacimiento (hoy - 18 años)
  (function setMaxFechaNacimiento() {
    const hoy = new Date();
    const max = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
    const yyyy = max.getFullYear();
    const mm = String(max.getMonth() + 1).padStart(2, "0");
    const dd = String(max.getDate()).padStart(2, "0");
    fechaNacimiento.setAttribute("max", `${yyyy}-${mm}-${dd}`);
  })();

  function shouldShow(input) {
    return touched.has(input.id) || submitted;
  }

  updateSubmitState();

  // === Envío del formulario ===
  form.addEventListener("submit", (e) => {
    // Prevenimos el envío real; en un proyecto real aquí enviaríamos al backend.
    e.preventDefault();
    submitted = true; // ahora sí se muestran todos los mensajes

    [
      validateNombre,
      validateEmail,
      validateFechaNacimiento,
      validateCelular,
      validateTelefono,
      validatePassword,
      validateConfirmPassword,
      validateTerminos,
      validateCaptcha,
    ].forEach((fn) => fn());
    updateSubmitState();

    if (form.checkValidity()) {
      const fd = new FormData(form);

      fetch("http://localhost:8000/api/contacto/", {
        method: "POST",
        body: fd,
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            // Muestra errores devueltos por el backend en tus campos
            for (const [key, val] of Object.entries(data)) {
              const input =
                document.getElementById(key) ||
                document.querySelector(`[name="${key}"]`);
              if (input)
                setFieldState(
                  input,
                  false,
                  Array.isArray(val) ? val.join(" ") : String(val)
                );
            }
            throw new Error("Error en el envío");
          }
          return res.json();
        })
        .then(() => {
          successMsg.hidden = false;
          setTimeout(() => {
            form.reset();
            document
              .querySelectorAll(".is-valid, .is-invalid")
              .forEach((el) => el.classList.remove("is-valid", "is-invalid"));
            document
              .querySelectorAll(".error-message")
              .forEach((el) => (el.textContent = ""));
            touched.clear();
            submitted = false;
            if (window.grecaptcha) grecaptcha.reset();
            successMsg.hidden = true;
            updateSubmitState();
          }, 800);
        })
        .catch((err) => {
          console.error(err);
        });

      return; // evitar que sigan los resets simulados
    } else {
      successMsg.hidden = true;
    }
  });
});
