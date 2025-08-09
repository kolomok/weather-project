import "./style.scss";

document.addEventListener("DOMContentLoaded", () => {
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
  accButton.addEventListener("click", () => {
    accSett.style.display = accSett.style.display === "flex" ? "none" : "flex";
  });

  closeSett.addEventListener("click", () => {
    accSett.style.display = accSett.style.display === "flex" ? "none" : "flex";
  });

  function showHourlyForecast(list) {
    const hours = document.getElementById("hours");
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
      <p>${Math.round(item.main.temp)}°C</p>
    `;
      hours.appendChild(card);
    });
  }

  function setBackgroundVideo(weatherMain, iconCode) {
    const video = document.getElementById("bg-video");
    let src = "/static/videos/default.mp4";

    const isNight = iconCode && iconCode.includes("n");

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
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=ru`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.cod === 200) {
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
          getWeekForecast(data.coord.lat, data.coord.lon);
        } else {
          citygeo.textContent = "Город не найден";
        }
      });
  }

  searchButton.addEventListener("click", () => {
    const city = searchInput.value.trim();
    if (city) getWeatherByCity(city);
  });

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const city = searchInput.value.trim();
      if (city) getWeatherByCity(city);
    }
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    citygeo.textContent = "Геолокация не работает...";
  }

  function success(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`
    )
      .then((res) => res.json())
      .then((data) => {
        citygeo.textContent = data.name;
        temp.textContent = `${Math.round(data.main.temp)}°C`;
        desc.textContent = data.weather[0].description;
        humid.textContent = `Влажность: ${data.main.humidity}%`;
        wind.textContent = `Ветер: ${data.wind.speed} м/с, ${degToCompass(
          data.wind.deg
        )}`;
        icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
        icon.alt = data.weather[0].description;

        if (data.main.temp < 20) {
          temp.style.color = "blue";
        } else {
          temp.style.color = "red";
        }

        setBackgroundVideo(data.weather[0].main, data.weather[0].icon);
        getWeekForecast(lat, lon);
      });
  }

  function error() {
    citygeo.textContent = "Не удалось получить местоположение...";
  }

  function degToCompass(deg) {
    const val = Math.floor(deg / 22.5 + 0.5);
    const arr = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];
    return arr[val % arr.length];
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
          const dayKey = date.toISOString().split("T")[0];
          if (!days[dayKey]) days[dayKey] = [];
          days[dayKey].push(item);
        });

        const container = document.getElementById("week-forecast");
        container.innerHTML = "";
        Object.keys(days).forEach((day, index) => {
          if (index === 0) return;
          const items = days[day];
          let minTemp = Infinity;
          let maxTemp = -Infinity;
          let midday = items.find((item) => item.dt_txt.includes("12:00:00"));
          if (!midday) midday = items[Math.floor(items.length / 2)];

          items.forEach((item) => {
            if (item.main.temp_min < minTemp) minTemp = item.main.temp_min;
            if (item.main.temp_max > maxTemp) maxTemp = item.main.temp_max;
          });

          const card = document.createElement("div");
          card.className = "day-card";
          card.dataset.date = day;
          card.innerHTML = `
          <p class="day-name">${new Date(day).toLocaleDateString("ru-RU", {
            weekday: "long",
          })}</p>
          <img src="https://openweathermap.org/img/wn/${
            midday.weather[0].icon
          }@2x.png" id="weather-icon" alt="${midday.weather[0].description}">
          <p>${midday.weather[0].description}</p>
          <p>Мин: ${Math.round(minTemp)}°C | Макс: ${Math.round(maxTemp)}°C</p>
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
        });
      });
  }
});
const video = document.getElementById("bg-video");
const preloader = document.getElementById("preloader");

video.addEventListener("canplaythrough", () => {
  preloader.style.opacity = "0";
  setTimeout(() => {
    preloader.style.display = "none";
  }, 500);
});
