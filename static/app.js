// FLIGHT DECK Frontend - Improved pixel-art animation
(function() {
  var canvas = document.getElementById('bg');
  var ctx = canvas.getContext('2d');
  var animEnabled = true;
  var intensity = 1.0;
  var jetX = -100;
  var jetY = 0;
  var jetBob = 0;
  var stars = [];
  var clouds = [];
  var mountains = [];
  var engineFlicker = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    jetY = canvas.height * 0.42;
    initBackground();
  }
  window.addEventListener('resize', resize);

  // Pixel-art style fighter jet drawn with discrete pixels
  function drawPixelJet(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;

    // Pixel grid (1 unit = 1 pixel at scale 1)
    var pixels = [
      // Fuselage core
      [0,0,'#1565c0'], [1,0,'#1976d2'], [2,0,'#1e88e5'], [3,0,'#42a5f5'], [4,0,'#64b5f6'],
      [0,1,'#0d47a1'], [1,1,'#1565c0'], [2,1,'#1976d2'], [3,1,'#1e88e5'], [4,1,'#42a5f5'], [5,1,'#90caf9'],
      [0,2,'#0d47a1'], [1,2,'#1565c0'], [2,2,'#1976d2'], [3,2,'#1e88e5'], [4,2,'#42a5f5'], [5,2,'#64b5f6'], [6,2,'#bbdefb'],
      [1,3,'#0d47a1'], [2,3,'#1565c0'], [3,3,'#1976d2'], [4,3,'#1e88e5'], [5,3,'#42a5f5'],
      // Wings
      [-2,1,'#283593'], [-1,1,'#303f9f'], [-3,2,'#1a237e'], [-2,2,'#283593'], [-1,2,'#303f9f'], [0,2,'#3949ab'],
      [-2,-1,'#283593'], [-1,-1,'#303f9f'], [-3,-2,'#1a237e'], [-2,-2,'#283593'], [-1,-2,'#303f9f'], [0,-2,'#3949ab'],
      // Tail
      [-4,0,'#0d47a1'], [-3,0,'#1565c0'], [-5,1,'#1a237e'], [-4,1,'#0d47a1'], [-5,-1,'#1a237e'], [-4,-1,'#0d47a1'],
      // Cockpit canopy
      [3,-1,'#4fc3f7'], [4,-1,'#81d4fa'], [5,-1,'#b3e5fc'],
      [3,1,'#29b6f6'], [4,1,'#4fc3f7'],
      // Engine glow (animated)
      [-6,0, engineFlicker > 0.5 ? '#ff6d00' : '#ff9100'],
      [-7,0, engineFlicker > 0.3 ? '#ff3d00' : '#ff6d00'],
      [-6,1,'#ff5722'], [-6,-1,'#ff5722']
    ];

    for (var i = 0; i < pixels.length; i++) {
      var p = pixels[i];
      ctx.fillStyle = p[2];
      ctx.fillRect(p[0]*3, p[1]*3, 3, 3);
    }
    ctx.restore();
  }

  function initBackground() {
    stars = [];
    for (var i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        s: Math.random() * 1.8 + 0.4,
        speed: Math.random() * 0.4 + 0.1
      });
    }
    clouds = [];
    for (var j = 0; j < 6; j++) {
      clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5 + 20,
        w: Math.random() * 120 + 60,
        h: Math.random() * 18 + 8,
        speed: Math.random() * 0.6 + 0.3
      });
    }
    mountains = [];
    for (var k = 0; k < 4; k++) {
      mountains.push({
        x: Math.random() * canvas.width,
        y: canvas.height * 0.65,
        w: Math.random() * 180 + 100,
        h: Math.random() * 40 + 30,
        speed: 0.15
      });
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!animEnabled) return;

    var speedMul = intensity;

    // Background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Distant mountains (slow parallax)
    ctx.fillStyle = 'rgba(15, 25, 45, 0.6)';
    for (var m = 0; m < mountains.length; m++) {
      var mt = mountains[m];
      ctx.fillRect(mt.x, mt.y, mt.w, mt.h);
      mt.x -= mt.speed * speedMul;
      if (mt.x + mt.w < 0) mt.x = canvas.width;
    }

    // Stars
    ctx.fillStyle = '#ffffff';
    for (var s = 0; s < stars.length; s++) {
      var star = stars[s];
      ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.001 + s) * 0.3;
      ctx.fillRect(star.x, star.y, star.s, star.s);
      star.x -= star.speed * speedMul;
      if (star.x < 0) star.x = canvas.width;
    }
    ctx.globalAlpha = 1;

    // Clouds
    ctx.fillStyle = 'rgba(40, 55, 80, 0.35)';
    for (var c = 0; c < clouds.length; c++) {
      var cl = clouds[c];
      ctx.fillRect(cl.x, cl.y, cl.w, cl.h);
      cl.x -= cl.speed * speedMul;
      if (cl.x + cl.w < 0) cl.x = canvas.width;
    }

    // Jet movement
    engineFlicker = Math.sin(Date.now() * 0.015) * 0.5 + 0.5;
    jetBob = Math.sin(Date.now() * 0.002) * 8;
    jetX += 1.4 * speedMul;
    if (jetX > canvas.width + 120) jetX = -120;

    drawPixelJet(jetX, jetY + jetBob, 3.2);
  }

  resize();
  animate();

  // Clock (compatible)
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function updateClock() {
    var now = new Date();
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var text = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds()) +
               '  ' + days[now.getDay()] + ' ' + now.getDate() + ' ' + months[now.getMonth()];
    var el = document.getElementById('clock');
    if (el) el.textContent = text;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Data helpers
  function fetchJSON(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try { cb(JSON.parse(xhr.responseText)); }
          catch (e) { cb({error: 'Parse error'}); }
        } else {
          cb({error: 'Network unavailable'});
        }
      }
    };
    xhr.send();
  }

  function loadYouTube() {
    fetchJSON('/api/youtube', function(data) {
      var el = document.getElementById('yt-content');
      if (!el) return;
      if (data.error) {
        el.innerHTML = '<div class="metric">Status <span class="value">' + data.error + '</span></div>';
        return;
      }
      var html = '<div class="metric">Channel <span class="value">' + (data.title || 'N/A') + '</span></div>';
      html += '<div class="metric">Subscribers <span class="value">' + (data.subscribers || 0) + '</span></div>';
      html += '<div class="metric">Views <span class="value">' + (data.views || 0) + '</span></div>';
      html += '<div class="metric">Videos <span class="value">' + (data.videos || 0) + '</span></div>';
      if (data.recent && data.recent.length) {
        html += '<div style="margin-top:12px;font-size:0.8rem;color:#90a4ae">Recent</div>';
        for (var i = 0; i < data.recent.length; i++) {
          var v = data.recent[i];
          html += '<div class="metric"><span>' + (v.title || '').substring(0, 32) + '</span></div>';
        }
      }
      el.innerHTML = html;
    });
  }

  function loadWeather() {
    fetchJSON('/api/weather', function(data) {
      var el = document.getElementById('weather-content');
      if (!el) return;
      if (data.error || !data.current) {
        el.innerHTML = '<div class="metric">Status <span class="value">Unavailable</span></div>';
        return;
      }
      var c = data.current;
      var html = '<div class="metric">Temp <span class="value">' + c.temperature_2m + '\u00b0C</span></div>';
      html += '<div class="metric">Feels <span class="value">' + c.apparent_temperature + '\u00b0C</span></div>';
      html += '<div class="metric">Wind <span class="value">' + c.wind_speed_10m + ' km/h</span></div>';
      html += '<div class="metric">Humidity <span class="value">' + c.relative_humidity_2m + '%</span></div>';
      if (data.daily && data.daily.sunrise) {
        html += '<div class="metric">Sunrise <span class="value">' + (data.daily.sunrise[0] || '') + '</span></div>';
      }
      el.innerHTML = html;
    });
  }

  function loadSystem() {
    fetchJSON('/api/system', function(data) {
      var el = document.getElementById('system-content');
      if (!el) return;
      var html = '<div class="metric">CPU <span class="value">' + (data.cpu != null ? data.cpu + '%' : 'N/A') + '</span></div>';
      html += '<div class="metric">Temp <span class="value">' + (data.temp != null ? data.temp + '\u00b0C' : 'N/A') + '</span></div>';
      html += '<div class="metric">RAM <span class="value">' + (data.ram_used || 0) + '/' + (data.ram_total || 0) + ' MB (' + (data.ram_percent || 0) + '%)</span></div>';
      html += '<div class="metric">Disk <span class="value">' + (data.disk_free || 0) + '/' + (data.disk_total || 0) + ' MB free</span></div>';
      if (data.uptime) {
        var h = Math.floor(data.uptime / 3600);
        html += '<div class="metric">Uptime <span class="value">' + h + 'h</span></div>';
      }
      el.innerHTML = html;
    });
  }

  function loadTasks() {
    fetchJSON('/api/tasks', function(tasks) {
      var el = document.getElementById('tasks-list');
      if (!el) return;
      el.innerHTML = '';
      (tasks || []).forEach(function(t) {
        var d = document.createElement('div');
        d.className = 'metric';
        d.innerHTML = '<span>' + t.text + '</span> <button data-id="' + t.id + '" class="del-task">\u00d7</button>';
        el.appendChild(d);
      });
      var buttons = el.querySelectorAll('.del-task');
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].onclick = function() {
          var id = this.getAttribute('data-id');
          var xhr = new XMLHttpRequest();
          xhr.open('DELETE', '/api/tasks/' + id, true);
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) loadTasks();
          };
          xhr.send();
        };
      }
    });
  }

  var taskInput = document.getElementById('task-input');
  if (taskInput) {
    taskInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        var text = taskInput.value.trim();
        if (text) {
          var xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/tasks', true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              taskInput.value = '';
              loadTasks();
            }
          };
          xhr.send(JSON.stringify({text: text}));
        }
      }
    });
  }

  function loadNotes() {
    fetchJSON('/api/notes', function(notes) {
      var el = document.getElementById('notes-list');
      if (!el) return;
      el.innerHTML = '';
      (notes || []).slice(0, 3).forEach(function(n) {
        var d = document.createElement('div');
        d.style.marginBottom = '8px';
        d.innerHTML = '<strong>' + (n.title || 'Note') + '</strong><br><small>' + (n.content || '').substring(0, 60) + '</small>';
        el.appendChild(d);
      });
    });
  }

  var saveNoteBtn = document.getElementById('save-note');
  var noteInput = document.getElementById('note-input');
  if (saveNoteBtn && noteInput) {
    saveNoteBtn.onclick = function() {
      var content = noteInput.value.trim();
      if (content) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/notes', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            noteInput.value = '';
            loadNotes();
          }
        };
        xhr.send(JSON.stringify({title: 'Note', content: content}));
      }
    };
  }

  // Settings
  var settingsBtn = document.getElementById('settings-btn');
  var closeSettings = document.getElementById('close-settings');
  var settingsPanel = document.getElementById('settings');
  var animToggle = document.getElementById('anim-toggle');
  var fsBtn = document.getElementById('fs-btn');

  if (settingsBtn) {
    settingsBtn.onclick = function() {
      if (settingsPanel) settingsPanel.classList.remove('hidden');
    };
  }
  if (closeSettings) {
    closeSettings.onclick = function() {
      if (settingsPanel) settingsPanel.classList.add('hidden');
    };
  }
  if (animToggle) {
    animToggle.onchange = function() {
      animEnabled = animToggle.checked;
    };
  }
  if (fsBtn) {
    fsBtn.onclick = function() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen && document.exitFullscreen();
      }
    };
  }

  // Load config for intensity
  fetchJSON('/api/config', function(cfg) {
    if (cfg && typeof cfg.animation_intensity === 'number') {
      intensity = cfg.animation_intensity;
    }
    if (cfg && cfg.animation_enabled === false) {
      animEnabled = false;
      if (animToggle) animToggle.checked = false;
    }
  });

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
})();
