import "./register.scss";

const I18N_KEY = "lang";
let currentLang = localStorage.getItem(I18N_KEY) || "ru";

const I18N = {
  "register.title": { ru: "Регистрация", en: "Sign up" },
  "register.username": { ru: "Логин", en: "Username" },
  "register.password": { ru: "Пароль", en: "Password" },
  "register.password2": { ru: "Повторите пароль", en: "Repeat password" },
  "register.submit": { ru: "Зарегистрироваться", en: "Sign up" },
  "register.have_account": {
    ru: "Уже есть аккаунт?",
    en: "Already have an account?",
  },
  "register.login_link": { ru: "Войти", en: "Log in" },

  "msg.fill_all": {
    ru: "Пожалуйста, заполните все поля",
    en: "Please fill all fields",
  },
  "msg.pass_mismatch": {
    ru: "Пароли не совпадают",
    en: "Passwords do not match",
  },
  "msg.success": { ru: "Регистрация прошла успешно", en: "Sign up successful" },
  "msg.net_error": {
    ru: "Произошла ошибка при подключении",
    en: "Network error occurred",
  },
};

function t(key) {
  return (I18N[key] && I18N[key][currentLang]) || key;
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const attr = el.getAttribute("data-i18n-attr") || "text";
    const val = t(key);
    if (attr === "text") {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
        return;
      el.textContent = val;
    } else {
      el.setAttribute(attr, val);
    }
  });

  const btn = document.getElementById("lang-toggle");
  if (btn) btn.textContent = currentLang === "ru" ? "EN" : "RU";
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem(I18N_KEY, lang);
  applyI18n();
}

(function bindLangToggle() {
  document.addEventListener("DOMContentLoaded", () => {
    applyI18n();
    const btn = document.getElementById("lang-toggle");
    if (btn) {
      btn.addEventListener("click", () => {
        setLang(currentLang === "ru" ? "en" : "ru");
      });
    }
  });
})();

function getCookie(name) {
  const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
  return m ? m.pop() : "";
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  if (!form) return;

  const usernameInput =
    form.querySelector("input[name='username']") ||
    form.querySelector("input[type='text']");
  const password1Input =
    form.querySelector("input[name='password1']") ||
    form.querySelectorAll("input[type='password']")[0];
  const password2Input =
    form.querySelector("input[name='password2']") ||
    form.querySelectorAll("input[type='password']")[1];
  const submitBtn = form.querySelector("button[type='submit'], button");

  async function submitHandler(e) {
    e.preventDefault();

    const username = (usernameInput?.value || "").trim();
    const password1 = password1Input?.value || "";
    const password2 = password2Input?.value || "";

    if (!username || !password1 || !password2) {
      alert(t("msg.fill_all"));
      return;
    }
    if (password1 !== password2) {
      alert(t("msg.pass_mismatch"));
      return;
    }

    try {
      submitBtn && (submitBtn.disabled = true);

      const res = await fetch("/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ username, password1, password2 }),
      });

      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const data = ct.includes("application/json") ? await res.json() : {};

      if (!res.ok || data.success !== true) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      alert(t("msg.success"));
      window.location.href = "/";
    } catch (err) {
      console.error("register error:", err);
      alert(t("msg.net_error"));
    } finally {
      submitBtn && (submitBtn.disabled = false);
    }
  }

  form.addEventListener("submit", submitHandler);
  submitBtn?.addEventListener("click", submitHandler);
});
