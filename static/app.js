// FLIGHT DECK Frontend
const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');
let animEnabled = true;
let jetX = 0;
let stars = [];
let clouds = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Procedural pixel-art fighter jet
function drawJet(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // Fuselage
  ctx.fillStyle = '#1a237e';
  ctx.fillRect(-20, -4, 40, 8);
  // Wings
  ctx.fillStyle = '#283593';
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(-30, 12);
  ctx.lineTo(-15, 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(-30, -12);
  ctx.lineTo(-15, -4);
  ctx.closePath();
  ctx.fill();
  // Cockpit
  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(8, -3, 10, 6);
  // Afterburner
  ctx.fillStyle = '#ff6d00';
  ctx.fillRect(-28, -2, 6, 4);
  ctx.restore();
}

function initStars() {
  stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      s: Math.random() * 1.5 + 0.5
    });
  }
  clouds = [];
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.6,
      w: Math.random() * 100 + 50,
      h: Math.random() * 20 + 10
    });
  }
}
initStars();

function animate() {
  if (!animEnabled) {
    requestAnimationFrame(animate);
    return;
  }
  ctx.fillStyle = '#0a0e17';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Stars
  ctx.fillStyle = '#ffffff';
  stars.forEach(s => {
    ctx.globalAlpha = 0.6;
    ctx.fillRect(s.x, s.y, s.s, s.s);
    s.x -= 0.3;
    if (s.x < 0) s.x = canvas.width;
  });
  ctx.globalAlpha = 1;
  // Clouds (parallax)
  ctx.fillStyle = 'rgba(30, 40, 60, 0.4)';
  clouds.forEach(c => {
    ctx.fillRect(c.x, c.y, c.w, c.h);
    c.x -= 0.8;
    if (c.x + c.w < 0) c.x = canvas.width;
  });
  // Jet
  jetX = (jetX + 1.2) % (canvas.width + 100);
  drawJet(jetX - 50, canvas.height * 0.45, 2.5);
  requestAnimationFrame(animate);
}
animate();

// Clock
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('clock').textContent =
    `${h}:${m}:${s}  ${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
}
setInterval(updateClock, 1000);
updateClock();

// Data fetchers
async function fetchJSON(url) {
  try {
    const r = await fetch(url);
    return await r.json();
  } catch (e) {
    return { error: 'Network unavailable' };
  }
}

async function loadYouTube() {
  const data = await fetchJSON('/api/youtube');
  const el = document.getElementById('yt-content');
  if (data.error) {
    el.innerHTML = `<div class="metric">Status <span class="value">${data.error}</span></div>`;
    return;
  }
  let html = `<div class="metric">Channel <span class="value">${data.title || 'N/A'}</span></div>`;
  html += `<div class="metric">Subscribers <span class="value">${data.subscribers || 0}</span></div>`;
  html += `<div class="metric">Views <span class="value">${data.views || 0}</span></div>`;
  html += `<div class="metric">Videos <span class="value">${data.videos || 0}</span></div>`;
  if (data.recent && data.recent.length) {
    html += '<div style="margin-top:12px;font-size:0.8rem;color:#90a4ae">Recent</div>';
    data.recent.forEach(v => {
      html += `<div class="metric"><span>${v.title.substring(0,30)}</span></div>`;
    });
  }
  el.innerHTML = html;
}

async function loadWeather() {
  const data = await fetchJSON('/api/weather');
  const el = document.getElementById('weather-content');
  if (data.error || !data.current) {
    el.innerHTML = `<div class="metric">Status <span class="value">Unavailable</span></div>`;
    return;
  }
  const c = data.current;
  let html = `<div class="metric">Temp <span class="value">${c.temperature_2m}°C</span></div>`;
  html += `<div class="metric">Feels <span class="value">${c.apparent_temperature}°C</span></div>`;
  html += `<div class="metric">Wind <span class="value">${c.wind_speed_10m} km/h</span></div>`;
  html += `<div class="metric">Humidity <span class="value">${c.relative_humidity_2m}%</span></div>`;
  if (data.daily) {
    html += `<div class="metric">Sunrise <span class="value">${(data.daily.sunrise||[])[0]||''}</span></div>`;
  }
  el.innerHTML = html;
}

async function loadSystem() {
  const data = await fetchJSON('/api/system');
  const el = document.getElementById('system-content');
  let html = `<div class="metric">CPU <span class="value">${data.cpu != null ? data.cpu + '%' : 'N/A'}</span></div>`;
  html += `<div class="metric">Temp <span class="value">${data.temp != null ? data.temp + '°C' : 'N/A'}</span></div>`;
  html += `<div class="metric">RAM <span class="value">${data.ram_used || 0}/${data.ram_total || 0} MB (${data.ram_percent || 0}%)</span></div>`;
  html += `<div class="metric">Disk <span class="value">${data.disk_free || 0}/${data.disk_total || 0} MB free</span></div>`;
  if (data.uptime) {
    const h = Math.floor(data.uptime / 3600);
    html += `<div class="metric">Uptime <span class="value">${h}h</span></div>`;
  }
  el.innerHTML = html;
}

async function loadTasks() {
  const tasks = await fetchJSON('/api/tasks');
  const el = document.getElementById('tasks-list');
  el.innerHTML = '';
  (tasks || []).forEach(t => {
    const d = document.createElement('div');
    d.className = 'metric';
    d.innerHTML = `<span>${t.text}</span> <button data-id="${t.id}" class="del-task">×</button>`;
    el.appendChild(d);
  });
  el.querySelectorAll('.del-task').forEach(btn => {
    btn.onclick = async () => {
      await fetch('/api/tasks/' + btn.dataset.id, { method: 'DELETE' });
      loadTasks();
    };
  });
}

document.getElementById('task-input').addEventListener('keypress', async e => {
  if (e.key === 'Enter' && e.target.value.trim()) {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ text: e.target.value.trim() })
    });
    e.target.value = '';
    loadTasks();
  }
});

async function loadNotes() {
  const notes = await fetchJSON('/api/notes');
  const el = document.getElementById('notes-list');
  el.innerHTML = '';
  (notes || []).slice(0, 3).forEach(n => {
    const d = document.createElement('div');
    d.style.marginBottom = '8px';
    d.innerHTML = `<strong>${n.title}</strong><br><small>${n.content.substring(0,60)}</small>`;
    el.appendChild(d);
  });
}

document.getElementById('save-note').onclick = async () => {
  const content = document.getElementById('note-input').value.trim();
  if (content) {
    await fetch('/api/notes', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ title: 'Note', content })
    });
    document.getElementById('note-input').value = '';
    loadNotes();
  }
};

// Settings
document.getElementById('settings-btn').onclick = () => {
  document.getElementById('settings').classList.remove('hidden');
};
document.getElementById('close-settings').onclick = () => {
  document.getElementById('settings').classList.add('hidden');
};
document.getElementById('anim-toggle').onchange = e => {
  animEnabled = e.target.checked;
};
document.getElementById('fs-btn').onclick = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
};

// Initial load and refresh
function refreshAll() {
  loadYouTube();
  loadWeather();
  loadSystem();
  loadTasks();
  loadNotes();
}
refreshAll();
setInterval(loadYouTube, 300000);
setInterval(loadWeather, 600000);
setInterval(loadSystem, 5000);
setInterval(loadTasks, 10000);
