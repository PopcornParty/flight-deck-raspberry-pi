#!/bin/bash
# Simple setup for FLIGHT DECK
set -e
echo "FLIGHT DECK Setup"
if [ ! -f config.json ]; then
  cp config.example.json config.json
  echo "Created config.json - please edit it with your settings."
fi
echo "Setup complete. Run with: python3 flight_deck.py"
echo "Then open http://localhost:8080 in a browser."
