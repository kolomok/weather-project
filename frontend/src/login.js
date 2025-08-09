import "./login.scss";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  const usernameInput = form.querySelector("input[type='text']");
  const passwordInput = form.querySelector("input[type='password']");
  const button = form.querySelector("button");

  button.addEventListener("click", function (e) {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      alert("Пожалуйста, заполните все поля");
      return;
    }

    fetch("/api/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Успешный вход");
          window.location.href = "/";
        } else {
          alert(data.error || "Ошибка входа");
        }
      })
      .catch((error) => {
        console.error("Ошибка:", error);
        alert("Что-то пошло не так");
      });
  });

  function getCookie(name) {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();

      if (cookie.startsWith(name + "=")) {
        return decodeURIComponent(cookie.substring(name.length + 1));
      }
    }

    return null;
  }
  if (user === user) {
    console.log("ok");
  }
});
