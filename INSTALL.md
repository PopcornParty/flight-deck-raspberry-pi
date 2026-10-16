# Installation Guide - FLIGHT DECK on Raspberry Pi

Target: Raspbian GNU/Linux 9.11 (Stretch), ARMv7, ~7.8 GB root, limited free space.

## Prerequisites

- Raspberry Pi with Raspbian Stretch (or compatible Debian 9)
- Python 3.5+ (pre-installed on Stretch)
- Keyboard, monitor, internet for initial setup and API calls
- No additional packages strictly required (stdlib only)

## Steps

1. **Obtain the code**
   ```bash
   cd ~
   git clone https://github.com/PopcornParty/flight-deck-raspberry-pi.git
   cd flight-deck-raspberry-pi
   ```
   Or download ZIP from GitHub and extract.

2. **Configure**
   ```bash
   cp config.example.json config.json
   nano config.json
   ```
   - Set `youtube_api_key` (see README)
   - Set `youtube_channel` to your handle (e.g. `@yourchannel`) or channel ID
   - Set `weather_location` (e.g. "London" or your city)
   - Adjust other settings as desired

3. **Launch**
   ```bash
   python3 flight_deck.py
   ```
   Open browser to `http://localhost:8080` (or the Pi's IP if remote).

4. **Run on boot (optional)**
   Create `/etc/systemd/system/flightdeck.service`:
   ```ini
   [Unit]
   Description=FLIGHT DECK Dashboard
   After=network.target

   [Service]
   Type=simple
   User=pi
   WorkingDirectory=/home/pi/flight-deck-raspberry-pi
   ExecStart=/usr/bin/python3 /home/pi/flight-deck-raspberry-pi/flight_deck.py
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```
   Then:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable flightdeck
   sudo systemctl start flightdeck
   ```

5. **Stop / Restart**
   - Manual: Ctrl+C
   - Systemd: `sudo systemctl stop flightdeck` / `start` / `restart`

6. **Logs**
   - Console output, or `journalctl -u flightdeck -f` if using systemd.

7. **Uninstall**
   ```bash
   sudo systemctl stop flightdeck
   sudo systemctl disable flightdeck
   sudo rm /etc/systemd/system/flightdeck.service
   rm -rf ~/flight-deck-raspberry-pi
   ```
   Database (`flightdeck.db`) and `config.json` will be removed with the directory.

## Troubleshooting

- **apt 404 errors**: Stretch repositories are archived. Use `sudo sed -i 's/raspbian/archive.raspbian/' /etc/apt/sources.list` or migrate to a newer OS if possible. This project avoids apt dependencies.
- **Python version**: `python3 --version` should show 3.5+.
- **No internet**: Local features (clock, tasks, notes, system) work; APIs show unavailable.
- **Browser**: Use Chromium or Epiphany included with Stretch desktop.
- **Permissions**: Run as the `pi` user. Temperature reading requires `vcgencmd` (usually available).
- **Port in use**: Change `port` in config.json.

## Compatibility Notes

This was developed targeting Python 3.5 constraints. Not executed on physical ARMv7 Stretch hardware in the build environment. Test thoroughly on your device.
