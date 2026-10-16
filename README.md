# FLIGHT DECK

A lightweight, animated YouTube creator dashboard and personal command centre designed for older Raspberry Pi hardware (ARMv7, Debian 9 / Raspbian Stretch).

## Features

- Fullscreen aviation-inspired dashboard
- Procedural pixel-art fighter aircraft animation (Canvas 2D, pauseable)
- YouTube channel statistics (public data via Data API v3)
- Digital clock with date and optional second timezone / countdown
- Live weather via Open-Meteo (no API key required)
- Raspberry Pi system monitoring (CPU, RAM, disk, temp, network, uptime)
- Persistent to-do list, video ideas, notes, focus timer, milestones
- Configurable widgets, accent colour, refresh intervals
- Works offline for local features

## Compatibility

- Target: Raspbian GNU/Linux 9.11 (Stretch), ARMv7, Python 3.5+
- Pure standard library Python where possible (no external dependencies required for core)
- Lightweight: low CPU/RAM, minimal disk writes
- Tested in development environment; verify on actual Pi

## Quick Start

See [INSTALL.md](INSTALL.md) for full Raspberry Pi installation instructions.

1. Clone or download the repository
2. Configure `config.json` (copy from `config.example.json`)
3. Run `python3 flight_deck.py`
4. Open browser to `http://localhost:8080`

## Configuration

Copy `config.example.json` to `config.json` and edit:

- YouTube API key and channel handle/ID
- Weather location (city name or lat/lon)
- Timezones, milestones, etc.

Never commit real API keys.

## YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project, enable YouTube Data API v3
3. Create an API key (restrict to YouTube Data API)
4. Add to `config.json` as `"youtube_api_key": "YOUR_KEY"`
5. Set `"youtube_channel": "@yourhandle"` or channel ID

Public statistics only. Private YouTube Studio analytics require OAuth (not implemented).

Quota: 10,000 units/day free. Channel stats cost ~1 unit.

## Weather

Uses free Open-Meteo API (no key). Location configurable by name (geocoded) or coordinates.

## Licence

MIT Licence. Pixel-art animation is original procedural artwork.

## Testing Status

See TESTING.md

## Known Limitations

- Designed for Python 3.5; avoids newer syntax
- No Docker
- Historical charts limited to local snapshots
- Subscriber counts are rounded by YouTube
- Not tested on actual Raspberry Pi hardware in this development environment
