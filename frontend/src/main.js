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
  "msg.load_error": { ru: "Ошибка загрузки", en: "Load error" },
  "msg.forecast_fail": {
    ru: "Не удалось загрузить прогноз",
    en: "Failed to load forecast",
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

function tUnit() {
  return unit === "metric" ? "°C" : "°F";
}
function windUnit() {
  return unit === "metric" ? "м/с" : "mph";
}
function weekdayLocale() {
  return currentLang === "ru" ? "ru-RU" : "en-US";
}

const unitToggle = document.getElementById("unitToggle");
function applyUnitToggleUI() {
  const btns = unitToggle?.querySelectorAll("button[data-unit]");
  btns?.forEach((b) => b.classList.toggle("active", b.dataset.unit === unit));
}
applyUnitToggleUI();

unitToggle?.addEventListener("click", (e) => {
  const target = e.target.closest("button[data-unit]");
  if (!target) return;
  const newUnit = target.dataset.unit;
  if (newUnit !== unit) {
    unit = newUnit;
    localStorage.setItem(UNIT_KEY, unit);
    applyUnitToggleUI();

    refetchWeather();
  }
});

const langBtn = document.getElementById("lang-toggle");
if (langBtn) {
  langBtn.addEventListener("click", () => {
    const next = currentLang === "ru" ? "en" : "ru";
    setLang(next);
    refetchWeather();
  });
}

const API_KEY = "a9c23e068a0e62f0ae23ab4a0336b395";

const citygeo = document.getElementById("city");
const temp = document.getElementById("temp");
const desc = document.getElementById("description");
const humid = document.getElementById("humidity");
const wind = document.getElementById("wind");
const icon = document.getElementById("weather-icon");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-btn");
const accButton = document.getElementById("accButton");
const accSett = document.getElementById("accSett");
const closeSett = document.getElementById("closeSett");

applyI18n(currentLang);

accButton?.addEventListener("click", () => {
  accSett.style.display = accSett.style.display === "flex" ? "none" : "flex";
});
closeSett?.addEventListener("click", () => {
  accSett.style.display = accSett.style.display === "flex" ? "none" : "flex";
});

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
    const card = document.createElement("div");
    card.className = "hour-card";
    card.innerHTML = `
      <p>${hour}:00</p>
      <img src="https://openweathermap.org/img/wn/${
        item.weather[0].icon
      }@2x.png" alt="${item.weather[0].description}">
      <p>${Math.round(item.main.temp)}${tUnit()}</p>
    `;
    hours.appendChild(card);
  });
}

function setBackgroundVideo(weatherMain, iconCode) {
  const video = document.getElementById("bg-video");
  if (!video) return;
  let src = "/static/videos/default.mp4";
  const isNight = iconCode && iconCode.includes("n");

  if (weatherMain === "Clear") {
    src = isNight
      ? "/static/videos/clear-night.mp4"
      : "/static/videos/sunny.mp4";
  } else if (weatherMain === "Rain") {
    src = isNight ? "/static/videos/rain-night.mp4" : "/static/videos/rain.mp4";
  } else if (weatherMain === "Snow") {
    src = isNight ? "/static/videos/snow-night.mp4" : "/static/videos/snow.mp4";
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

  video.src = src;
}

function degToCompass(deg) {
  const val = Math.floor(deg / 22.5 + 0.5);
  const arr = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];

  const arrEn = [
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
  const idx = val % 16;
  return currentLang === "ru" ? arr[idx % arr.length] : arrEn[idx];
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

    if (res.ok && data.cod === 200) {
      renderCurrentWeather(data);
      lastCoords = { lat: data.coord.lat, lon: data.coord.lon };
      await getWeekForecast(data.coord.lat, data.coord.lon);
      return true;
    } else {
      citygeo.textContent = I18N["msg.city_not_found"][currentLang];
      temp.textContent = "";
      desc.textContent = "";
      humid.textContent = "";
      wind.textContent = "";
      return false;
    }
  } catch {
    citygeo.textContent = I18N["msg.load_error"][currentLang];
    return false;
  }
}

async function getWeatherByCoords(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unit}&lang=${currentLang}`
    );
    const data = await res.json();
    if (res.ok && data.cod === 200) {
      renderCurrentWeather(data);
      currentCity = data.name;
      lastCoords = { lat, lon };
      await getWeekForecast(lat, lon);
    } else {
      citygeo.textContent = I18N["msg.load_error"][currentLang];
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
      const dayKey = date.toISOString().split("T")[0];
      if (!days[dayKey]) days[dayKey] = [];
      days[dayKey].push(item);
    });

    const container = document.getElementById("week-forecast");
    if (!container) return;
    container.innerHTML = "";

    Object.keys(days).forEach((day, index) => {
      if (index === 0) return;
      const items = days[day];

      let minTemp = Infinity;
      let maxTemp = -Infinity;
      let midday = items.find((it) => it.dt_txt.includes("12:00:00"));
      if (!midday) midday = items[Math.floor(items.length / 2)];

      items.forEach((it) => {
        if (it.main.temp_min < minTemp) minTemp = it.main.temp_min;
        if (it.main.temp_max > maxTemp) maxTemp = it.main.temp_max;
      });

      const card = document.createElement("div");
      card.className = "day-card";
      card.dataset.date = day;
      card.innerHTML = `
        <p class="day-name">${new Date(day).toLocaleDateString(
          weekdayLocale(),
          { weekday: "long" }
        )}</p>
        <img src="https://openweathermap.org/img/wn/${
          midday.weather[0].icon
        }@2x.png" id="weather-icon" alt="${midday.weather[0].description}">
        <p>${midday.weather[0].description}</p>
        <p>Мин: ${Math.round(minTemp)}${tUnit()} | Макс: ${Math.round(
        maxTemp
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
      document.getElementById("first-card")?.addEventListener("click", () => {
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
searchButton?.addEventListener("click", () => {
  const city = (searchInput?.value || "").trim();
  if (city) getWeatherByCity(city);
});
searchInput?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const city = (searchInput?.value || "").trim();
    if (city) getWeatherByCity(city);
  }
});

(async function initFromQuery() {
  const urlParams = new URLSearchParams(window.location.search);
  const queryCity = urlParams.get("q");

  if (queryCity) {
    const ok = await getWeatherByCity(queryCity);
    if (!ok) {
      loadByGeolocation();
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, "", "/search/");
      }
    }
  } else {
    loadByGeolocation();
  }
})();

function loadByGeolocation() {
  if (!navigator.geolocation) {
    citygeo.textContent = I18N["msg.geo_unavailable"][currentLang];
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      getWeatherByCoords(lat, lon);
    },
    () => {
      citygeo.textContent = I18N["msg.geo_denied"][currentLang];
    }
  );
}

function refetchWeather() {
  if (currentCity) {
    getWeatherByCity(currentCity);
  } else if (lastCoords) {
    getWeatherByCoords(lastCoords.lat, lastCoords.lon);
  }
}

const video = document.getElementById("bg-video");
const preloader = document.getElementById("preloader");
video?.addEventListener("canplaythrough", () => {
  if (!preloader) return;
  preloader.style.opacity = "0";
  setTimeout(() => {
    preloader.style.display = "none";
  }, 500);
});
