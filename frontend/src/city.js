import "./style.scss";

document.addEventListener("DOMContentLoaded", () => {
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

  video.addEventListener("canplaythrough", () => {
    preloader.style.opacity = "0";
    setTimeout(() => {
      preloader.style.display = "none";
    }, 500);
  });

  document.addEventListener("DOMContentLoaded", () => {
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
          <a href="/favorites/" class="btn-ghost">Избранное</a>
          <a href="/logout/" class="btn-danger">Выйти</a>
        </div>
      `;
      })
      .catch(() => {});
  });

  addButton?.addEventListener("click", async () => {
    const cityName = addButton.dataset.city || citygeo?.textContent?.trim();
    if (!cityName) {
      alert("Не могу определить название города");
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

      alert("Город добавлен в избранное");
    } catch (err) {
      alert(err.message || "Ошибка при добавлении");
    }
  });

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  accButton?.addEventListener("click", () => {
    accSett.style.display = accSett.style.display === "flex" ? "none" : "flex";
  });

  closeSett?.addEventListener("click", () => {
    accSett.style.display = accSett.style.display === "flex" ? "none" : "flex";
  });

  function degToCompass(deg) {
    const val = Math.floor(deg / 22.5 + 0.5);
    const arr = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];
    return arr[val % arr.length];
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

    video.src = src;
  }

  function getWeatherByCity(city) {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&appid=${API_KEY}&units=metric&lang=ru`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.cod !== 200) throw new Error("City not found");

        citygeo.textContent = data.name;
        temp.textContent = `${Math.round(data.main.temp)}°C`;
        desc.textContent = data.weather[0].description;
        humid.textContent = `Влажность: ${data.main.humidity}%`;
        wind.textContent = `Ветер: ${data.wind.speed} м/с, ${degToCompass(
          data.wind.deg
        )}`;
        icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
        icon.alt = data.weather[0].description;

        if (addButton) addButton.dataset.city = data.name;

        setBackgroundVideo(data.weather[0].main, data.weather[0].icon);
        getWeekForecast(data.coord.lat, data.coord.lon);
      })
      .catch(() => {
        citygeo.textContent = "Город не найден";
        if (addButton) delete addButton.dataset.city;
      });
  }

  function getWeekForecast(lat, lon) {
    fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`
    )
      .then((res) => res.json())
      .then((data) => {
        const days = {};
        data.list.forEach((item) => {
          const date = new Date(item.dt_txt);
          const key = date.toISOString().split("T")[0];
          if (!days[key]) days[key] = [];
          days[key].push(item);
        });

        const container = document.getElementById("week-forecast");
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
            <p class="day-name">${new Date(day).toLocaleDateString("ru-RU", {
              weekday: "long",
            })}</p>
            <img src="https://openweathermap.org/img/wn/${
              midday.weather[0].icon
            }@2x.png" id="weather-icon" alt="${midday.weather[0].description}">
            <p>${midday.weather[0].description}</p>
            <p>Мин: ${Math.round(min)}°C | Макс: ${Math.round(max)}°C</p>
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
        showHourlyForecast(days[todayKey]);

        document.getElementById("first-card").addEventListener("click", () => {
          document
            .querySelectorAll(".day-card")
            .forEach((c) => c.classList.remove("active"));
          showHourlyForecast(days[todayKey]);

          const today = Object.keys(days)[0];
          showHourlyForecast(days[today]);
        });
      });
  }

  function showHourlyForecast(list) {
    const hours = document.getElementById("hours");
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
        <p>${Math.round(item.main.temp)}°C</p>
      `;
      hours.appendChild(div);
    });
  }

  function performSearch() {
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `/search/?q=${encodeURIComponent(query)}`;
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  const queryCity = urlParams.get("q");
  if (queryCity) getWeatherByCity(queryCity);

  searchButton?.addEventListener("click", performSearch);
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  });
  async function toggleFavorite(city) {
    const csrftoken = getCookie("csrftoken");
    const res = await fetch("/api/favorites/add/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
      body: JSON.stringify({
        name: city.name,
        country: city.country || "",
        lat: city.lat,
        lon: city.lon,
      }),
      credentials: "same-origin",
    });
    const data = await res.json();
    if (!data.ok) {
    }
  }
  async function getWeatherByCity(city) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          city
        )}&appid=${API_KEY}&units=metric&lang=ru`
      );
      const data = await res.json();

      if (res.ok && data.cod === 200) {
        citygeo.textContent = data.name;
        temp.textContent = `${Math.round(data.main.temp)}°C`;
        desc.textContent = data.weather[0].description;
        humid.textContent = `Влажность: ${data.main.humidity}%`;
        wind.textContent = `Ветер: ${data.wind.speed} м/с, ${degToCompass(
          data.wind.deg
        )}`;
        icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
        icon.alt = data.weather[0].description;

        setBackgroundVideo(data.weather[0].main, data.weather[0].icon);
        await getWeekForecast(data.coord.lat, data.coord.lon);

        const addButton = document.getElementById("addbutton");
        if (addButton) addButton.dataset.city = data.name;

        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  function loadByGeolocation() {
    if (!navigator.geolocation) {
      citygeo.textContent = "Геолокация не доступна";
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`
          );
          const data = await res.json();
          if (res.ok && data.cod === 200) {
            citygeo.textContent = data.name;
            temp.textContent = `${Math.round(data.main.temp)}°C`;
            desc.textContent = data.weather[0].description;
            humid.textContent = `Влажность: ${data.main.humidity}%`;
            wind.textContent = `Ветер: ${data.wind.speed} м/с, ${degToCompass(
              data.wind.deg
            )}`;
            icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
            icon.alt = data.weather[0].description;

            setBackgroundVideo(data.weather[0].main, data.weather[0].icon);
            await getWeekForecast(lat, lon);
          } else {
            citygeo.textContent = "Не удалось получить погоду по геолокации";
          }
        } catch {
          citygeo.textContent = "Ошибка сети при получении геолокации";
        }
      },
      () => {
        citygeo.textContent = "Доступ к геолокации отклонён";
      }
    );
  }

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
});
