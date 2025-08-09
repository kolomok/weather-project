import "./favorites.scss";

document.addEventListener("DOMContentLoaded", () => {
  // элементы
  const API_KEY = "a9c23e068a0e62f0ae23ab4a0336b395";
  const listEl = document.getElementById("fav-list");
  const emptyEl = document.getElementById("fav-empty"); // исправил опечатку

  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("search-input");

  // поиск
  const goSearch = () => {
    const q = (searchInput?.value || "").trim();
    if (q) window.location.href = `/search/?q=${encodeURIComponent(q)}`;
  };
  searchBtn?.addEventListener("click", goSearch);
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") goSearch();
  });

  // csrf
  function getCookie(name) {
    const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
    return m ? m.pop() : "";
  }
  const csrftoken = getCookie("csrftoken");

  // API

  async function apiRemoveFavorite(payload) {
    // можно отправлять id, а если его нет — name/country
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
    listEl.innerHTML = "";
    if (!items.length) {
      emptyEl.style.display = "block";
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
        <button class="btn-ghost" data-open>Открыть</button>
        <button class="btn-danger" data-remove>Удалить</button>
      </div>
    `;
      // обработчики кнопок (как у тебя было)
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

      // <-- ДОГРУЗКА ПОГОДЫ ДЛЯ КАРТОЧКИ
      fillCurrentWeather(it, card).catch(() => {
        // на ошибке просто оставим «…»
      });
    }
  }

  async function fillCurrentWeather(cityItem, cardEl) {
    const iconEl = cardEl.querySelector(".city-now__icon");
    const tempEl = cardEl.querySelector(".city-now__temp");

    // 1. Составляем URL
    let url;
    if (cityItem.lat != null && cityItem.lon != null) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${cityItem.lat}&lon=${cityItem.lon}&appid=${API_KEY}&units=metric&lang=ru`;
    } else {
      const q = encodeURIComponent(
        cityItem.country
          ? `${cityItem.name},${cityItem.country}`
          : cityItem.name
      );
      url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${API_KEY}&units=metric&lang=ru`;
    }

    // 2. Запрашиваем
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather http " + res.status);
    const data = await res.json();
    if (!data || !data.weather || !data.weather[0] || !data.main)
      throw new Error("bad payload");

    // 3. Проставляем
    const icon = data.weather[0].icon; // например "01d"
    const temp = Math.round(data.main.temp); // целые °C

    iconEl.src = `https://openweathermap.org/img/wn/${icon}.png`;
    iconEl.alt = data.weather[0].description || "";
    tempEl.textContent = `${temp}°C`;
  }

  // --- заменяем apiGetFavorites целиком ---
  async function apiGetFavorites() {
    try {
      const res = await fetch("/api/favorites/", {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });

      // Если редирект (обычно на логин)
      if (res.redirected) {
        console.warn("redirected to:", res.url);
        window.location.href = res.url;
        return [];
      }

      const status = res.status;
      const ct = (res.headers.get("content-type") || "").toLowerCase();

      // Попробуем сначала JSON, но аккуратно
      if (ct.includes("application/json")) {
        const data = await res.json();

        // Бек может вернуть разные структуры:
        // 1) {success: true, items: [...]}
        if (Array.isArray(data.items)) return data.items;

        // 2) {results: [...]}
        if (Array.isArray(data.results)) return data.results;

        // 3) просто массив [...]
        if (Array.isArray(data)) return data;

        // 4) {success:false, error:"..."} — покажем ошибку
        if (data.success === false) {
          throw new Error(data.error || "Backend error (success=false)");
        }

        // Иначе отдадим хотя бы пустой список
        console.warn("Unexpected JSON shape:", data);
        return [];
      }

      // Если не JSON — прочитаем кусок текста, чтобы понять что пришло
      const text = await res.text();
      console.error("Favorites: not JSON", {
        status,
        ct,
        preview: text.slice(0, 200),
      });

      // Частые кейсы:
      // 401/403 -> неавторизован/нет прав
      if (status === 401 || status === 403) {
        alert("Нужно войти в систему");
        return [];
      }

      // 500 -> ошибка на сервере
      if (status >= 500) {
        throw new Error("Сервер вернул ошибку 5xx. Проверь логи Django.");
      }

      throw new Error(
        `Не JSON (status ${status}, ct ${ct}). См. консоль для деталей.`
      );
    } catch (e) {
      // Пробрасываем наверх — поймаем в load()
      throw e;
    }
  }

  // --- и чуть правим load() чтобы показать причину пользователю ---
  async function load() {
    try {
      const items = await apiGetFavorites();
      render(items);
    } catch (e) {
      console.error("failed to load favorites:", e);
      emptyEl.style.display = "block";
      emptyEl.textContent =
        "Не удалось загрузить избранное: " + (e.message || e);
    }
  }

  // старт
  load();
});
