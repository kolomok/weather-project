import "./register.scss";
console.log("OK");

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  const usernameInput = form.querySelector("input[type='text']");
  const password1Input = form.querySelectorAll("input[type='password']")[0];
  const password2Input = form.querySelectorAll("input[type='password']")[1];
  const button = form.querySelector("button");

  button.addEventListener("click", function (e) {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password1 = password1Input.value;
    const password2 = password2Input.value;

    if (!username || !password1 || !password2) {
      alert("Пожалуйста, заполните все поля");
      return;
    }

    if (password1 !== password2) {
      alert("Пароли не совпадают");
      return;
    }

    fetch("/api/register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({
        username: username,
        password1: password1,
        password2: password2,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Регистрация прошла успешно");
          window.location.href = "/";
        } else {
          alert(data.error || "Ошибка регистрации");
        }
      })
      .catch((error) => {
        console.error("Ошибка:", error);
        alert("Произошла ошибка при подключении");
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
});
