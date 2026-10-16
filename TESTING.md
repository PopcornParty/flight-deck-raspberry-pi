# Testing Report - FLIGHT DECK

## Environment

- Development: Modern x86_64 Linux / Python 3.x
- Target: Raspbian Stretch (Debian 9), Python 3.5, ARMv7 (not executed on representative hardware)

## Results

| Feature | Status | Notes |
|---------|--------|-------|
| Syntax / startup | Tested and working | Server starts, serves HTML/CSS/JS |
| Configuration loading | Tested and working | Falls back to example, creates config.json; geocoded weather coords now persist |
| SQLite persistence | Tested and working | Tasks, notes, snapshots survive restart |
| Clock | Tested and working | Updates every second, local time; browser-compatible formatting |
| Pixel-art animation | Improved | Canvas 2D pixel-grid fighter jet with engine flicker, bobbing, multi-layer parallax (stars, clouds, mountains); intensity-aware; pauseable |
| System monitoring | Tested with limitations | /proc files work; safer vcgencmd handling; network basic |
| YouTube API | Requires external credentials | Public stats via Data API v3; graceful error if missing key |
| Weather (Open-Meteo) | Improved | Geocoding results saved to config.json; offline fallback |
| Tasks / Notes | Tested and working | CRUD via API, persistent; XMLHttpRequest for older browsers |
| Settings / fullscreen | Tested and working | Animation toggle respects config; fullscreen API |
| Offline mode | Tested and working | Local widgets continue |
| Browser compatibility | Improved | Replaced async/await and template literals with XMLHttpRequest and string concat for older Chromium |
| Layout responsiveness | Tested and working | CSS grid scales; better contrast |
| Secrets | Verified | No keys committed; config.example.json only |

## Recent fixes

- Weather latitude/longitude now saved to config.json after geocoding
- Safer subprocess calls and error handling in system stats
- Pixel-art jet is now a proper discrete-pixel design with animated afterburner
- Frontend switched to more compatible JavaScript for Stretch-era browsers
- Animation intensity from config is respected

## Not Tested

- Actual execution on Raspberry Pi Stretch ARMv7
- Long-running resource usage under load on target hardware
- Full YouTube historical charting (snapshots stored but UI basic)
- Advanced milestone progress visualizations

## Recommendations

- Monitor CPU/RAM with `htop` after launch on Pi. Animation is lighter than before but still continuous.
- If animation is heavy, disable via settings or lower intensity in config.json.
- Cache APIs aggressively (already done via intervals and DB).
