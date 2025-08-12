import "./style.scss";

const UNIT_KEY = "unit";
let unit = localStorage.getItem(UNIT_KEY) || "metric";
let currentCity = null;
let lastCoords = null;

const I18N_KEY = "lang";
let currentLang = localStorage.getItem(I18N_KEY) || "ru";

const I18N = {
  "nav.favorites": { ru: "Избранное", en: "Favorites" },
  "nav.login": { ru: "Войти", en: "Log in" },
  "nav.logout": { ru: "Выйти", en: "Log out" },

  "search.placeholder": { ru: "Найти город...", en: "Search city..." },

  "weather.now": { ru: "Сейчас", en: "Now" },
  "weather.humidity": { ru: "Влажность", en: "Humidity" },
  "weather.wind": { ru: "Ветер", en: "Wind" },

  "msg.city_not_found": { ru: "Город не найден", en: "City not found" },
  "msg.geo_unavailable": {
    ru: "Геолокация не доступна",
    en: "Geolocation unavailable",
  },
  "msg.geo_denied": {
    ru: "Доступ к геолокации отклонён",
    en: "Geolocation permission denied",
  },
  "msg.load_error": { ru: "Ошибка сети", en: "Network error" },
  "msg.forecast_fail": {
    ru: "Не удалось загрузить прогноз",
    en: "Failed to load forecast",
  },
  "msg.geo_fail": {
    ru: "Не удалось получить погоду по геолокации",
    en: "Failed to get geolocation weather",
  },
  "msg.add_ok": {
    ru: "Город добавлен в избранное",
    en: "City added to favorites",
  },
  "msg.add_err": { ru: "Ошибка при добавлении", en: "Add to favorites failed" },
  "msg.no_city": {
    ru: "Не могу определить название города",
    en: "Can't detect city name",
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
function weekdayLocale() {
  return currentLang === "ru" ? "ru-RU" : "en-US";
}

function tUnit() {
  return unit === "metric" ? "°C" : "°F";
}
function windUnit() {
  return unit === "metric" ? "м/с" : "mph";
}
function attachUnitToggle(rootId = "unitToggle") {
  const wrap = document.getElementById(rootId);
  if (!wrap) return;
  const apply = () => {
    wrap.querySelectorAll("button[data-unit]").forEach((b) => {
      b.classList.toggle("active", b.dataset.unit === unit);
    });
  };
  apply();
  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-unit]");
    if (!btn) return;
    const newUnit = btn.dataset.unit;
    if (newUnit && newUnit !== unit) {
      unit = newUnit;
      localStorage.setItem(UNIT_KEY, unit);
      apply();
      refetchWeather();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyI18n(currentLang);

  const API_KEY = "a9c23e068a0e62f0ae23ab4a0336b395";

  const addButton = document.getElementById("addbutton");
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-btn");
  const citygeo = document.getElementById("city");
  const temp = document.getElementById("temp");
  const desc = document.getElementById("description");
  const humid = document.getElementById("humidity");
  const wind = document.getElementById("wind");
  const icon = document.getElementById("weather-icon");
  const accButton = document.getElementById("accButton");
  const accSett = document.getElementById("accSett");
  const closeSett = document.getElementById("closeSett");
  const video = document.getElementById("bg-video");
  const preloader = document.getElementById("preloader");
  const langBtn = document.getElementById("lang-toggle");

  attachUnitToggle("unitToggle");
  langBtn?.addEventListener("click", () => {
    const next = currentLang === "ru" ? "en" : "ru";
    setLang(next);
    refetchWeather();
  });

  video?.addEventListener("canplaythrough", () => {
    if (!preloader) return;
    preloader.style.opacity = "0";
    setTimeout(() => (preloader.style.display = "none"), 500);
  });

  accButton?.addEventListener("click", () => {
    if (!accSett) return;
    accSett.style.display = accSett.style.display === "flex" ? "none" : "flex";
  });
  closeSett?.addEventListener("click", () => {
    if (!accSett) return;
    accSett.style.display = accSett.style.display === "flex" ? "none" : "flex";
  });

  (function fillWhoAmI() {
    const authArea = document.getElementById("auth-area");
    if (!authArea) return;
    fetch("/api/whoami/", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) return;
        authArea.innerHTML = `
          <div class="user-badge">
            <span class="user-name">👋 ${data.username}</span>
            <a href="/favorites/" class="btn-ghost" data-i18n="nav.favorites">${I18N["nav.favorites"][currentLang]}</a>
            <a href="/logout/" class="btn-danger" data-i18n="nav.logout">${I18N["nav.logout"][currentLang]}</a>
          </div>
        `;
      })
      .catch(() => {});
  })();

  addButton?.addEventListener("click", async () => {
    const cityName = addButton.dataset.city || citygeo?.textContent?.trim();
    if (!cityName) {
      alert(I18N["msg.no_city"][currentLang]);
      return;
    }
    try {
      const res = await fetch("/api/favorites/add/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        credentials: "same-origin",
        body: JSON.stringify({ name: cityName }),
      });

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      alert(I18N["msg.add_ok"][currentLang]);
    } catch (err) {
      alert(I18N["msg.add_err"][currentLang]);
    }
  });

  function getCookie(name) {
    const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
    return m ? m.pop() : "";
  }

  function degToCompass(deg) {
    const idx = Math.floor(deg / 22.5 + 0.5) % 16;
    const ru8 = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];
    const en16 = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ];
    return currentLang === "ru" ? ru8[idx % ru8.length] : en16[idx];
  }

  function setBackgroundVideo(weatherMain, iconCode) {
    const isNight = iconCode && iconCode.includes("n");
    let src = "/static/videos/default.mp4";
    if (weatherMain === "Clear") {
      src = isNight
        ? "/static/videos/clear-night.mp4"
        : "/static/videos/sunny.mp4";
    } else if (weatherMain === "Rain") {
      src = isNight
        ? "/static/videos/rain-night.mp4"
        : "/static/videos/rain.mp4";
    } else if (weatherMain === "Snow") {
      src = isNight
        ? "/static/videos/snow-night.mp4"
        : "/static/videos/snow.mp4";
    } else if (weatherMain === "Clouds") {
      src = isNight
        ? "/static/videos/clouds-night.mp4"
        : "/static/videos/clouds.mp4";
    } else if (weatherMain === "Thunderstorm") {
      src = "/static/videos/thunder.mp4";
    } else if (weatherMain === "Drizzle") {
      src = "/static/videos/drizzle.mp4";
    } else if (weatherMain === "Mist" || weatherMain === "Fog") {
      src = "/static/videos/fog.mp4";
    }
    if (video) video.src = src;
  }

  function renderCurrentWeather(data) {
    citygeo.textContent = data.name;
    temp.textContent = `${Math.round(data.main.temp)}${tUnit()}`;
    desc.textContent = data.weather[0].description;
    humid.textContent = `${I18N["weather.humidity"][currentLang]}: ${data.main.humidity}%`;
    wind.textContent = `${I18N["weather.wind"][currentLang]}: ${
      data.wind.speed
    } ${windUnit()}, ${degToCompass(data.wind.deg)}`;
    icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    icon.alt = data.weather[0].description;
    setBackgroundVideo(data.weather[0].main, data.weather[0].icon);
  }

  function showHourlyForecast(list) {
    const hours = document.getElementById("hours");
    if (!hours) return;
    hours.innerHTML = "";
    list.forEach((item) => {
      const date = new Date(item.dt_txt);
      const hour = date.getHours().toString().padStart(2, "0");
      const div = document.createElement("div");
      div.className = "hour-card";
      div.innerHTML = `
        <p>${hour}:00</p>
        <img src="https://openweathermap.org/img/wn/${
          item.weather[0].icon
        }@2x.png" alt="${item.weather[0].description}">
        <p>${Math.round(item.main.temp)}${tUnit()}</p>
      `;
      hours.appendChild(div);
    });
  }

  async function getWeatherByCity(city) {
    currentCity = city;
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          city
        )}&appid=${API_KEY}&units=${unit}&lang=${currentLang}`
      );
      const data = await res.json();
      if (res.ok && Number(data.cod) === 200) {
        renderCurrentWeather(data);
        lastCoords = { lat: data.coord.lat, lon: data.coord.lon };
        if (addButton) addButton.dataset.city = data.name;
        await getWeekForecast(data.coord.lat, data.coord.lon);
        return true;
      } else {
        citygeo.textContent = I18N["msg.city_not_found"][currentLang];
        if (addButton) delete addButton.dataset.city;
        return false;
      }
    } catch {
      citygeo.textContent = I18N["msg.load_error"][currentLang];
      if (addButton) delete addButton.dataset.city;
      return false;
    }
  }

  async function getWeatherByCoords(lat, lon) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unit}&lang=${currentLang}`
      );
      const data = await res.json();
      if (res.ok && Number(data.cod) === 200) {
        renderCurrentWeather(data);
        currentCity = data.name;
        lastCoords = { lat, lon };
        if (addButton) addButton.dataset.city = data.name;
        await getWeekForecast(lat, lon);
      } else {
        citygeo.textContent = I18N["msg.geo_fail"][currentLang];
      }
    } catch {
      citygeo.textContent = I18N["msg.load_error"][currentLang];
    }
  }

  async function getWeekForecast(lat, lon) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unit}&lang=${currentLang}`
      );
      const data = await res.json();

      const days = {};
      data.list.forEach((item) => {
        const date = new Date(item.dt_txt);
        const key = date.toISOString().split("T")[0];
        if (!days[key]) days[key] = [];
        days[key].push(item);
      });

      const container = document.getElementById("week-forecast");
      if (!container) return;
      container.innerHTML = "";

      Object.keys(days).forEach((day, index) => {
        if (index === 0) return;
        const items = days[day];

        let min = Infinity,
          max = -Infinity;
        let midday =
          items.find((i) => i.dt_txt.includes("12:00:00")) ||
          items[Math.floor(items.length / 2)];

        items.forEach((i) => {
          if (i.main.temp_min < min) min = i.main.temp_min;
          if (i.main.temp_max > max) max = i.main.temp_max;
        });

        const card = document.createElement("div");
        card.className = "day-card";
        card.innerHTML = `
          <p class="day-name">${new Date(day).toLocaleDateString(
            weekdayLocale(),
            { weekday: "long" }
          )}</p>
          <img src="https://openweathermap.org/img/wn/${
            midday.weather[0].icon
          }@2x.png" id="weather-icon" alt="${midday.weather[0].description}">
          <p>${midday.weather[0].description}</p>
          <p>Мин: ${Math.round(min)}${tUnit()} | Макс: ${Math.round(
          max
        )}${tUnit()}</p>
        `;
        container.appendChild(card);

        card.addEventListener("click", () => {
          document
            .querySelectorAll(".day-card")
            .forEach((c) => c.classList.remove("active"));
          card.classList.add("active");
          showHourlyForecast(days[day]);
        });
      });

      const todayKey = Object.keys(days)[0];
      if (todayKey) {
        showHourlyForecast(days[todayKey]);
        const firstCard = document.getElementById("first-card");
        firstCard?.addEventListener("click", () => {
          document
            .querySelectorAll(".day-card")
            .forEach((c) => c.classList.remove("active"));
          showHourlyForecast(days[todayKey]);
        });
      }
    } catch {
      const container = document.getElementById("week-forecast");
      if (container)
        container.innerHTML = `<p>${I18N["msg.forecast_fail"][currentLang]}</p>`;
    }
  }

  function performSearch() {
    const query = (searchInput?.value || "").trim();
    if (query) window.location.href = `/search/?q=${encodeURIComponent(query)}`;
  }
  searchButton?.addEventListener("click", performSearch);
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") performSearch();
  });

  async function loadByGeolocation() {
    if (!navigator.geolocation) {
      citygeo.textContent = I18N["msg.geo_unavailable"][currentLang];
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        await getWeatherByCoords(lat, lon);
      },
      () => {
        citygeo.textContent = I18N["msg.geo_denied"][currentLang];
      }
    );
  }

  (async function initFromQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    const queryCity = urlParams.get("q");

    if (queryCity) {
      const ok = await getWeatherByCity(queryCity);
      if (!ok) {
        await loadByGeolocation();
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, "", "/search/");
        }
      }
    } else {
      await loadByGeolocation();
    }
  })();

  function refetchWeather() {
    if (currentCity) {
      getWeatherByCity(currentCity);
    } else if (lastCoords) {
      getWeatherByCoords(lastCoords.lat, lastCoords.lon);
    } else {
      loadByGeolocation();
    }
  }
  window.refetchForUnits = refetchWeather;
  window.refetchWeather = refetchWeather;
});
