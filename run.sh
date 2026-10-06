#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 was not found. Install it first."
  exit 1
fi

if [ ! -d ".venv" ]; then
  python3 -m venv .venv || {
    echo "Could not create the virtual environment."
    echo "On Ubuntu, try: sudo apt update && sudo apt install python3-venv"
    exit 1
  }
fi

source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo
  echo "Created .env from .env.example."
  echo "Open .env and add your Groq API key, then run ./run.sh again."
  exit 0
fi

python app.py
