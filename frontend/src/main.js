import "./style.scss";

document.addEventListener("DOMContentLoaded", () => {
  const API_KEY = "a9c23e068a0e62f0ae23ab4a0336b395";
  const cityEl = document.getElementById("city");
  const tempEl = document.getElementById("temp");
  const iconEl = document.getElementById("weather-icon");

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    cityEl.textContent = "Геолокация не поддерживается";
  }

  function success(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`
    )
      .then((res) => res.json())
      .then((data) => {
        cityEl.textContent = data.name;
        tempEl.textContent = `${Math.round(data.main.temp)}°C`;
        iconEl.className = `wi wi-owm-${data.weather[0].id}`;
      });
  }

  function error() {
    cityEl.textContent = "Не удалось определить местоположение";
  }
});
