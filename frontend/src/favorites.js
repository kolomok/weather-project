import "./favorites.scss";

const LANG_KEY = "lang";
let currentLang = localStorage.getItem(LANG_KEY) || "ru";

const I18N = {
  "search.placeholder": { ru: "Найти город...", en: "Search city..." },
  "favorites.empty": { ru: "Пусто", en: "Empty" },
  "favorites.open": { ru: "Открыть", en: "Open" },
  "favorites.remove": { ru: "Удалить", en: "Remove" },
  "auth.required": { ru: "Нужно войти в систему", en: "You need to sign in" },
};

function t(key) {
  return (I18N[key] && I18N[key][currentLang]) || key;
}

function applyStaticI18n() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.placeholder = t("search.placeholder");

  const langBtn = document.getElementById("lang-toggle");
  if (langBtn) langBtn.textContent = currentLang === "ru" ? "EN" : "RU";
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  applyStaticI18n();
  if (typeof rerenderFavorites === "function") rerenderFavorites();
}

const UNIT_KEY = "unit";
let unit = localStorage.getItem(UNIT_KEY) || "metric";
function tUnit() {
  return unit === "metric" ? "°C" : "°F";
}
function attachUnitToggle(rootId = "unitToggle", onChange) {
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
    const next = btn.dataset.unit;
    if (next && next !== unit) {
      unit = next;
      localStorage.setItem(UNIT_KEY, unit);
      apply();
      if (typeof onChange === "function") onChange();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyStaticI18n();

  const langBtn = document.getElementById("lang-toggle");
  langBtn?.addEventListener("click", () => {
    setLang(currentLang === "ru" ? "en" : "ru");
  });

  const API_KEY = "a9c23e068a0e62f0ae23ab4a0336b395";
  const listEl = document.getElementById("fav-list");
  const emptyEl = document.getElementById("fav-empty");
  let lastItems = [];

  attachUnitToggle("unitToggle", () => {
    load();
  });

  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("search-input");
  const goSearch = () => {
    const q = (searchInput?.value || "").trim();
    if (q) window.location.href = `/search/?q=${encodeURIComponent(q)}`;
  };
  searchBtn?.addEventListener("click", goSearch);
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") goSearch();
  });

  function getCookie(name) {
    const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
    return m ? m.pop() : "";
  }
  const csrftoken = getCookie("csrftoken");

  async function apiRemoveFavorite(payload) {
    await fetch("/api/favorites/remove/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken,
      },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });
  }

  function render(items) {
    lastItems = items.slice();
    listEl.innerHTML = "";

    if (!items.length) {
      emptyEl.style.display = "block";
      emptyEl.textContent = t("favorites.empty");
      return;
    }
    emptyEl.style.display = "none";

    for (const it of items) {
      const card = document.createElement("div");
      card.className = "city-card";
      card.innerHTML = `
        <div class="city-title">
          <h3>${it.name}${it.country ? `, ${it.country}` : ""}</h3>
        </div>

        <div class="city-now">
          <img class="city-now__icon" alt="" style="width:56px;height:auto;opacity:.7" />
          <span class="city-now__temp">…</span>
        </div>

        <div class="city-actions">
          <button class="btn-ghost" data-open>${t("favorites.open")}</button>
          <button class="btn-danger" data-remove>${t(
            "favorites.remove"
          )}</button>
        </div>
      `;

      card.querySelector("[data-open]")?.addEventListener("click", () => {
        window.location.href = `/search/?q=${encodeURIComponent(it.name)}`;
      });
      card
        .querySelector("[data-remove]")
        ?.addEventListener("click", async () => {
          try {
            if (it.id) await apiRemoveFavorite({ id: it.id });
            else
              await apiRemoveFavorite({
                name: it.name,
                country: it.country || "",
              });
            await load();
          } catch (e) {
            console.error("remove failed", e);
            alert("Не удалось удалить из избранного");
          }
        });

      listEl.appendChild(card);

      fillCurrentWeather(it, card).catch(() => {});
    }
  }

  window.rerenderFavorites = () => render(lastItems);

  async function fillCurrentWeather(cityItem, cardEl) {
    const iconEl = cardEl.querySelector(".city-now__icon");
    const tempEl = cardEl.querySelector(".city-now__temp");

    let url;
    if (cityItem.lat != null && cityItem.lon != null) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${
        cityItem.lat
      }&lon=${cityItem.lon}&appid=${API_KEY}&units=${unit}&lang=${
        currentLang === "ru" ? "ru" : "en"
      }`;
    } else {
      const q = encodeURIComponent(
        cityItem.country
          ? `${cityItem.name},${cityItem.country}`
          : cityItem.name
      );
      url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${API_KEY}&units=${unit}&lang=${
        currentLang === "ru" ? "ru" : "en"
      }`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error("weather http " + res.status);
    const data = await res.json();
    if (!data?.weather?.[0] || !data?.main) throw new Error("bad payload");

    const icon = data.weather[0].icon;
    const temp = Math.round(data.main.temp);

    iconEl.src = `https://openweathermap.org/img/wn/${icon}.png`;
    iconEl.alt = data.weather[0].description || "";
    tempEl.textContent = `${temp}${tUnit()}`;
  }

  async function apiGetFavorites() {
    const res = await fetch("/api/favorites/", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });

    if (res.redirected) {
      window.location.href = res.url;
      return [];
    }

    const status = res.status;
    const ct = (res.headers.get("content-type") || "").toLowerCase();

    if (ct.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.results)) return data.results;
      if (Array.isArray(data)) return data;
      if (data.success === false) {
        throw new Error(data.error || "Backend error (success=false)");
      }
      console.warn("Unexpected JSON shape:", data);
      return [];
    }

    const text = await res.text();
    console.error("Favorites: not JSON", {
      status,
      ct,
      preview: text.slice(0, 200),
    });

    if (status === 401 || status === 403) {
      alert(t("auth.required"));
      return [];
    }
    if (status >= 500) {
      throw new Error("Сервер вернул ошибку 5xx. Проверь логи Django.");
    }
    throw new Error(`Не JSON (status ${status}, ct ${ct}).`);
  }

  async function load() {
    try {
      const items = await apiGetFavorites();
      render(items);
    } catch (e) {
      console.error("failed to load favorites:", e);
      emptyEl.style.display = "block";
      emptyEl.textContent = `${t("favorites.empty")}`;
    }
  }

  load();
});
