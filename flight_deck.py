#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FLIGHT DECK - Lightweight Raspberry Pi Creator Dashboard
Compatible with Python 3.5+ (Raspbian Stretch / Debian 9 ARMv7)
Uses only standard library.
"""

from __future__ import print_function
import os
import sys
import json
import time
import sqlite3
import urllib.request
import urllib.parse
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
import threading
import subprocess
import datetime

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, 'config.json')
DB_PATH = os.path.join(BASE_DIR, 'flightdeck.db')
STATIC_DIR = os.path.join(BASE_DIR, 'static')

def load_config():
    if not os.path.exists(CONFIG_PATH):
        example = os.path.join(BASE_DIR, 'config.example.json')
        if os.path.exists(example):
            with open(example, 'r') as f:
                config = json.load(f)
            with open(CONFIG_PATH, 'w') as f:
                json.dump(config, f, indent=2)
            print("Created config.json from example. Edit it before use.")
        else:
            config = {}
    else:
        with open(CONFIG_PATH, 'r') as f:
            config = json.load(f)
    # Defaults
    defaults = {
        "port": 8080,
        "youtube_api_key": "",
        "youtube_channel": "",
        "weather_location": "London",
        "weather_latitude": None,
        "weather_longitude": None,
        "timezone": "UTC",
        "second_timezone": None,
        "event_countdown": None,
        "subscriber_milestones": [1000, 5000, 10000],
        "accent_color": "#4fc3f7",
        "animation_enabled": True,
        "animation_intensity": 1.0,
        "refresh_interval_youtube": 300,
        "refresh_interval_weather": 600,
        "refresh_interval_system": 5,
        "widgets": {"youtube": True, "clock": True, "weather": True, "system": True, "tasks": True, "notes": True, "timer": True}
    }
    for k, v in defaults.items():
        if k not in config:
            config[k] = v
    return config

def save_config(config):
    try:
        with open(CONFIG_PATH, 'w') as f:
            json.dump(config, f, indent=2)
    except Exception as e:
        print("Failed to save config: {}".format(e))

CONFIG = load_config()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        done INTEGER DEFAULT 0,
        created INTEGER
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        created INTEGER,
        updated INTEGER
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS ideas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        created INTEGER
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        data TEXT,
        timestamp INTEGER
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT,
        timestamp INTEGER,
        level TEXT
    )''')
    conn.commit()
    conn.close()

init_db()

def db_query(query, params=(), fetch=True):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute(query, params)
        if fetch:
            result = c.fetchall()
        else:
            result = c.lastrowid
        conn.commit()
        return result
    except Exception as e:
        print("DB error: {}".format(e))
        return [] if fetch else None
    finally:
        conn.close()

def http_get(url, timeout=10):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'FLIGHT-DECK/1.0'})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print("HTTP error for {}: {}".format(url, e))
        return None

def get_youtube_stats():
    key = CONFIG.get('youtube_api_key', '')
    channel = CONFIG.get('youtube_channel', '')
    if not key or not channel or key == 'YOUR_YOUTUBE_API_KEY_HERE':
        return {"error": "YouTube API key or channel not configured"}
    # Resolve handle or ID
    if channel.startswith('@'):
        params = urllib.parse.urlencode({
            'part': 'snippet,statistics,contentDetails',
            'forHandle': channel.lstrip('@'),
            'key': key
        })
    else:
        params = urllib.parse.urlencode({
            'part': 'snippet,statistics,contentDetails',
            'id': channel,
            'key': key
        })
    url = 'https://www.googleapis.com/youtube/v3/channels?' + params
    data = http_get(url)
    if not data or 'items' not in data or not data['items']:
        return {"error": "Channel not found or API error"}
    item = data['items'][0]
    stats = item.get('statistics', {})
    snippet = item.get('snippet', {})
    result = {
        "title": snippet.get('title', 'Unknown'),
        "avatar": snippet.get('thumbnails', {}).get('default', {}).get('url', ''),
        "subscribers": int(stats.get('subscriberCount', 0)),
        "views": int(stats.get('viewCount', 0)),
        "videos": int(stats.get('videoCount', 0)),
        "hidden": stats.get('hiddenSubscriberCount', False),
        "uploads": item.get('contentDetails', {}).get('relatedPlaylists', {}).get('uploads', '')
    }
    # Store snapshot
    db_query("INSERT INTO snapshots (type, data, timestamp) VALUES (?, ?, ?)",
             ('youtube', json.dumps(result), int(time.time())), fetch=False)
    return result

def get_recent_videos(playlist_id):
    key = CONFIG.get('youtube_api_key', '')
    if not key or not playlist_id:
        return []
    params = urllib.parse.urlencode({
        'part': 'snippet',
        'playlistId': playlist_id,
        'maxResults': 5,
        'key': key
    })
    url = 'https://www.googleapis.com/youtube/v3/playlistItems?' + params
    data = http_get(url)
    if not data or 'items' not in data:
        return []
    videos = []
    for item in data['items']:
        snip = item.get('snippet', {})
        videos.append({
            "title": snip.get('title', ''),
            "id": snip.get('resourceId', {}).get('videoId', ''),
            "thumbnail": snip.get('thumbnails', {}).get('default', {}).get('url', ''),
            "published": snip.get('publishedAt', '')
        })
    return videos

def get_weather():
    lat = CONFIG.get('weather_latitude')
    lon = CONFIG.get('weather_longitude')
    loc = CONFIG.get('weather_location', 'London')
    if lat is None or lon is None:
        # Geocode and persist
        geo_url = 'https://geocoding-api.open-meteo.com/v1/search?name={}&count=1'.format(urllib.parse.quote(loc))
        geo = http_get(geo_url)
        if geo and 'results' in geo and geo['results']:
            lat = geo['results'][0]['latitude']
            lon = geo['results'][0]['longitude']
            CONFIG['weather_latitude'] = lat
            CONFIG['weather_longitude'] = lon
            save_config(CONFIG)
        else:
            return {"error": "Could not geocode location"}
    params = urllib.parse.urlencode({
        'latitude': lat,
        'longitude': lon,
        'current': 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m',
        'daily': 'sunrise,sunset,temperature_2m_max,temperature_2m_min,weather_code',
        'timezone': 'auto',
        'forecast_days': 3
    })
    url = 'https://api.open-meteo.com/v1/forecast?' + params
    data = http_get(url)
    if not data:
        return {"error": "Weather API unavailable"}
    # Cache snapshot
    db_query("INSERT INTO snapshots (type, data, timestamp) VALUES (?, ?, ?)",
             ('weather', json.dumps(data), int(time.time())), fetch=False)
    return data

def get_system_stats():
    stats = {}
    # CPU
    try:
        with open('/proc/stat', 'r') as f:
            line = f.readline()
            parts = line.split()
            if parts[0] == 'cpu':
                idle = int(parts[4])
                total = sum(int(x) for x in parts[1:])
                if not hasattr(get_system_stats, 'prev'):
                    get_system_stats.prev = (idle, total)
                    stats['cpu'] = 0.0
                else:
                    prev_idle, prev_total = get_system_stats.prev
                    d_idle = idle - prev_idle
                    d_total = total - prev_total
                    if d_total > 0:
                        stats['cpu'] = round(100.0 * (1.0 - float(d_idle) / d_total), 1)
                    else:
                        stats['cpu'] = 0.0
                    get_system_stats.prev = (idle, total)
    except Exception:
        stats['cpu'] = None
    # Temp (safe subprocess)
    try:
        out = subprocess.check_output(['vcgencmd', 'measure_temp'], stderr=subprocess.STDOUT, timeout=2)
        temp_str = out.decode().strip()
        if 'temp=' in temp_str:
            stats['temp'] = float(temp_str.split('=')[1].replace("'", '').replace('C', ''))
        else:
            stats['temp'] = None
    except Exception:
        stats['temp'] = None
    # RAM
    try:
        with open('/proc/meminfo', 'r') as f:
            mem = {}
            for line in f:
                if ':' in line:
                    k, v = line.split(':', 1)
                    mem[k.strip()] = int(v.split()[0])
            total = mem.get('MemTotal', 0)
            free = mem.get('MemAvailable', mem.get('MemFree', 0))
            stats['ram_total'] = total // 1024
            stats['ram_used'] = (total - free) // 1024
            stats['ram_percent'] = round(100.0 * (total - free) / total, 1) if total else 0
    except Exception:
        stats['ram_total'] = stats['ram_used'] = stats['ram_percent'] = None
    # Disk
    try:
        st = os.statvfs('/')
        total = st.f_blocks * st.f_frsize
        free = st.f_bavail * st.f_frsize
        stats['disk_total'] = total // (1024*1024)
        stats['disk_free'] = free // (1024*1024)
        stats['disk_percent'] = round(100.0 * (1 - float(free)/total), 1) if total else 0
    except Exception:
        stats['disk_total'] = stats['disk_free'] = stats['disk_percent'] = None
    # Uptime
    try:
        with open('/proc/uptime', 'r') as f:
            stats['uptime'] = float(f.read().split()[0])
    except Exception:
        stats['uptime'] = None
    # Network (simple cumulative)
    stats['net_rx'] = stats['net_tx'] = None
    try:
        with open('/proc/net/dev', 'r') as f:
            for line in f:
                if 'eth0' in line or 'wlan0' in line or 'enp' in line:
                    parts = line.split()
                    if len(parts) > 9:
                        stats['net_rx'] = int(parts[1])
                        stats['net_tx'] = int(parts[9])
                    break
    except Exception:
        pass
    # Warnings
    alerts = []
    if stats.get('disk_percent', 0) > 90:
        alerts.append("Low disk space: {}% used".format(stats['disk_percent']))
    if stats.get('temp') and stats['temp'] > 80:
        alerts.append("High CPU temperature: {}C".format(stats['temp']))
    if alerts:
        for a in alerts:
            db_query("INSERT INTO alerts (message, timestamp, level) VALUES (?, ?, ?)",
                     (a, int(time.time()), 'warning'), fetch=False)
    stats['alerts'] = alerts
    return stats

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Quiet

    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.serve_file('index.html', 'text/html')
        elif self.path.startswith('/static/'):
            fname = self.path[8:]
            self.serve_file(fname, None)
        elif self.path == '/api/config':
            self.send_json(CONFIG)
        elif self.path == '/api/youtube':
            stats = get_youtube_stats()
            if 'uploads' in stats and not stats.get('error'):
                stats['recent'] = get_recent_videos(stats['uploads'])
            self.send_json(stats)
        elif self.path == '/api/weather':
            self.send_json(get_weather())
        elif self.path == '/api/system':
            self.send_json(get_system_stats())
        elif self.path == '/api/tasks':
            rows = db_query("SELECT id, text, done, created FROM tasks ORDER BY id DESC")
            self.send_json([{"id": r[0], "text": r[1], "done": bool(r[2]), "created": r[3]} for r in rows])
        elif self.path == '/api/notes':
            rows = db_query("SELECT id, title, content, created, updated FROM notes ORDER BY updated DESC")
            self.send_json([{"id": r[0], "title": r[1], "content": r[2], "created": r[3], "updated": r[4]} for r in rows])
        elif self.path == '/api/ideas':
            rows = db_query("SELECT id, text, created FROM ideas ORDER BY id DESC")
            self.send_json([{"id": r[0], "text": r[1], "created": r[2]} for r in rows])
        elif self.path == '/api/snapshots':
            rows = db_query("SELECT type, data, timestamp FROM snapshots ORDER BY timestamp DESC LIMIT 50")
            self.send_json([{"type": r[0], "data": json.loads(r[1]), "timestamp": r[2]} for r in rows])
        else:
            self.send_error(404)

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8') if length else '{}'
        try:
            data = json.loads(body)
        except Exception:
            data = {}
        if self.path == '/api/tasks':
            text = data.get('text', '').strip()
            if text:
                rid = db_query("INSERT INTO tasks (text, created) VALUES (?, ?)", (text, int(time.time())), fetch=False)
                self.send_json({"id": rid, "ok": True})
            else:
                self.send_json({"error": "Empty"})
        elif self.path == '/api/notes':
            title = data.get('title', 'Note')
            content = data.get('content', '')
            now = int(time.time())
            rid = db_query("INSERT INTO notes (title, content, created, updated) VALUES (?, ?, ?, ?)",
                           (title, content, now, now), fetch=False)
            self.send_json({"id": rid, "ok": True})
        elif self.path == '/api/ideas':
            text = data.get('text', '').strip()
            if text:
                rid = db_query("INSERT INTO ideas (text, created) VALUES (?, ?)", (text, int(time.time())), fetch=False)
                self.send_json({"id": rid, "ok": True})
            else:
                self.send_json({"error": "Empty"})
        else:
            self.send_error(404)

    def do_DELETE(self):
        if self.path.startswith('/api/tasks/'):
            tid = self.path.split('/')[-1]
            db_query("DELETE FROM tasks WHERE id=?", (tid,), fetch=False)
            self.send_json({"ok": True})
        elif self.path.startswith('/api/notes/'):
            nid = self.path.split('/')[-1]
            db_query("DELETE FROM notes WHERE id=?", (nid,), fetch=False)
            self.send_json({"ok": True})
        else:
            self.send_error(404)

    def serve_file(self, name, mime):
        path = os.path.join(STATIC_DIR, name)
        if not os.path.exists(path):
            self.send_error(404)
            return
        if not mime:
            if name.endswith('.css'):
                mime = 'text/css'
            elif name.endswith('.js'):
                mime = 'application/javascript'
            elif name.endswith('.html'):
                mime = 'text/html'
            else:
                mime = 'application/octet-stream'
        with open(path, 'rb') as f:
            content = f.read()
        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def send_json(self, obj):
        data = json.dumps(obj).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

def main():
    port = CONFIG.get('port', 8080)
    server = ThreadedHTTPServer(('0.0.0.0', port), Handler)
    print("FLIGHT DECK running at http://0.0.0.0:{}".format(port))
    print("Press Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down")
        server.shutdown()

if __name__ == '__main__':
    main()
