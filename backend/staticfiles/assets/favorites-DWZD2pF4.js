document.addEventListener("DOMContentLoaded",()=>{const o=document.getElementById("fav-list"),c=document.getElementById("faw-empty"),s=document.getElementById("search-btn"),a=document.getElementById("search-input");s.addEventListener("click",()=>{const t=(a.value||"").trim();t&&(window.location.href=`/search/?q=${encodeURIComponent(t)}`)}),a.addEventListener("keydown",t=>{if(t.key==="Enter"){const e=(a.value||"").trim();e&&(window.location.href=`/search/?q=${encodeURIComponent(e)}`)}});function r(t){const e=document.cookie.match("(^|;)\\s*"+t+"\\s*=\\s*([^;]+)");return e?e.pop():""}const d=r("csrftoken");async function l(){const t=await fetch("/api/favorites/");if(!t.ok)throw new Error("failed to load favorites");return(await t.json()).items||[]}function m(t){if(o.innerHTML="",!t.length){c.style.display="block";return}c.style.display="none";for(const e of t){const n=document.createElement("div");n.className="city-card",n.innerHTML=`
        <div class="city-title">
          <h3>${e.name}${e.country?`, ${e.country}`:""}</h3>
          <button class="btn-ghost" title="Открыть погоду">➡️</button>
        </div>
        <div class="city-actions">
          <button class="btn" data-open>Открыть</button>
          <button class="btn-danger" data-remove>Удалить</button>
        </div>
      `,n.querySelector("[data-open]").addEventListener("click",()=>{window.location.href=`/search/?q=${encodeURIComponent(e.name)}`}),n.querySelector("[data-remove]").addEventListener("click",async()=>{await u(e.id,e.name,e.country),i()}),o.appendChild(n)}}async function u(t,e,n){await fetch("/api/favorites/remove/",{method:"POST",headers:{"Content-Type":"application/json","X-CSRFToken":d},body:JSON.stringify({id:t,name:e,country:n}),credentials:"same-origin"})}async function i(){try{const t=await l();m(t)}catch(t){console.error(t),o.innerHTML='<div class="empty">Ошибка загрузки.</div>'}}i()});
