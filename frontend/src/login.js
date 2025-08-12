import "./login.scss";

const I18N_KEY = "lang";
let currentLang = localStorage.getItem(I18N_KEY) || "ru";

const I18N = {
  "login.title": { ru: "Вход", en: "Log in" },
  "login.username": { ru: "Логин", en: "Username" },
  "login.password": { ru: "Пароль", en: "Password" },
  "login.submit": { ru: "Войти", en: "Log in" },
  "login.fill_all": {
    ru: "Пожалуйста, заполните все поля",
    en: "Please fill in all fields",
  },
  "login.success": { ru: "Успешный вход", en: "Logged in successfully" },
  "login.error": { ru: "Ошибка входа", en: "Login error" },
  "login.something_wrong": {
    ru: "Что-то пошло не так",
    en: "Something went wrong",
  },
  "login.haveacc": {
    ru: "У Вас нет аккаунта?",
    en: "Dont have account?",
  },
  "login.haheurl": {
    ru: "Зарегестрируйтесь сейчас!",
    en: "Register now!",
  },
};

function applyI18n(lang) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const pack = I18N[key];
    if (!pack || !pack[lang]) return;

    const attr = el.getAttribute("data-i18n-attr") || "text";
    const value = pack[lang];

    if (attr === "text") {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      } else {
        el.textContent = value;
      }
    } else {
      el.setAttribute(attr, value);
    }
  });

  const langBtn = document.getElementById("lang-toggle");
  if (langBtn) langBtn.textContent = lang === "ru" ? "EN" : "RU";
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem(I18N_KEY, lang);
  applyI18n(lang);
}

function getCookie(name) {
  const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
  return m ? m.pop() : "";
}

document.addEventListener("DOMContentLoaded", () => {
  applyI18n(currentLang);

  const form = document.querySelector("form");
  if (!form) return;

  const usernameInput = form.querySelector(
    "input[name='username'], input[type='text']"
  );
  const passwordInput = form.querySelector(
    "input[name='password'], input[type='password']"
  );
  const submitBtn = form.querySelector("button[type='submit'], button");

  const langBtn = document.getElementById("lang-toggle");
  langBtn?.addEventListener("click", () => {
    setLang(currentLang === "ru" ? "en" : "ru");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    doLogin();
  });

  submitBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    doLogin();
  });

  async function doLogin() {
    const username = (usernameInput?.value || "").trim();
    const password = passwordInput?.value || "";

    if (!username || !password) {
      alert(I18N["login.fill_all"][currentLang]);
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.prevText = submitBtn.textContent || "";
        submitBtn.textContent = "...";
      }

      const res = await fetch("/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (!ct.includes("application/json")) {
        const text = await res.text();
        throw new Error(
          `${I18N["login.error"][currentLang]}: ${text.slice(0, 120)}`
        );
      }

      const data = await res.json();

      if (res.ok && data.success) {
        alert(I18N["login.success"][currentLang]);
        window.location.href = "/";
      } else {
        alert(data.error || I18N["login.error"][currentLang]);
      }
    } catch (err) {
      console.error(err);
      alert(I18N["login.something_wrong"][currentLang]);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent =
          submitBtn.dataset.prevText || I18N["login.submit"][currentLang];
      }
    }
  }
});
