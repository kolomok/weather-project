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

  // --- Видео по погоде ---
  function setBackgroundVideo(weatherMain, iconCode) {
    const video = document.getElementById("bg-video");
    let src = "./public/videos/default.mp4";

    const isNight = iconCode && iconCode.includes("n"); // проверка на ночь

    if (weatherMain === "Clear") {
      src = isNight
        ? "./public/videos/clear-night.mp4"
        : "./public/videos/sunny.mp4";
    } else if (weatherMain === "Rain") {
      src = isNight ? "./public/videos/пше.mp4" : "./public/videos/rain.mp4";
    } else if (weatherMain === "Snow") {
      src = isNight
        ? "./public/videos/snow-night.mp4"
        : "./public/videos/snow.mp4";
    } else if (weatherMain === "Clouds") {
      src = isNight
        ? "./public/videos/clouds-night.mp4"
        : "./public/videos/clouds.mp4";
    } else if (weatherMain === "Thunderstorm") {
      src = "./public/videos/thunder.mp4";
    } else if (weatherMain === "Drizzle") {
      src = "./public/videos/drizzle.mp4";
    } else if (weatherMain === "Mist" || weatherMain === "Fog") {
      src = "./public/videos/fog.mp4";
    }

    video.src = src;
  }

  // --- Получение погоды по названию города ---
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

  // --- События поиска ---
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

  // --- Геолокация ---
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

        setBackgroundVideo(data.weather[0].main, data.weather[0].icon);
        getWeekForecast(lat, lon);
      });
  }

  function error() {
    citygeo.textContent = "Не удалось получить местоположение...";
  }

  function degToCompass(deg) {
    const val = Math.floor(deg / 22.5 + 0.5);
    const arr = [
      "С",
      "ССВ",
      "СВ",
      "ВСВ",
      "В",
      "ВЮВ",
      "ЮВ",
      "ЮЮВ",
      "Ю",
      "ЮЮЗ",
      "ЮЗ",
      "ЗЮЗ",
      "З",
      "ЗСЗ",
      "СЗ",
      "ССЗ",
    ];
    return arr[val % 16];
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
          card.innerHTML = `
            <p class="day-name">${new Date(day).toLocaleDateString("ru-RU", {
              weekday: "long",
            })}</p>
            <img src="https://openweathermap.org/img/wn/${
              midday.weather[0].icon
            }@2x.png" id="weather-icon" alt="${midday.weather[0].description}">
            <p>${midday.weather[0].description}</p>
            <p>Мин: ${Math.round(minTemp)}°C | Макс: ${Math.round(
            maxTemp
          )}°C</p>
          `;
          container.appendChild(card);
        });
      });
  }
});
