#!/usr/bin/env bash
# Steps 1–2: install deps, migrate, seed.
# Recommended: activate conda first, e.g. conda activate bomnous-ai-shop
set -euo pipefail
cd "$(dirname "$0")"

if [[ -n "${CONDA_DEFAULT_ENV:-}" ]]; then
  echo "==> Using conda environment: $CONDA_DEFAULT_ENV"
elif [[ -f .venv/bin/activate ]]; then
  # shellcheck source=/dev/null
  source .venv/bin/activate
  echo "==> Using project .venv"
else
  echo "Activate your conda env first, then run this script again. Example:"
  echo "  conda activate bomnous-ai-shop"
  exit 1
fi

echo "==> Installing Python dependencies"
python -m pip install -U pip
pip install -r requirements.txt

echo "==> [1] Alembic migrations"
alembic upgrade head

echo "==> [2] Seed products (skips if products table is not empty)"
python seed_bomnous.py

echo ""
echo "==> [3] API: default http://127.0.0.1:8000"
echo "With conda active, from bomnous-backend:"
echo "  uvicorn main:app --reload --host 127.0.0.1 --port 8000"
echo ""
echo "Frontend (another terminal, port 8080):"
echo '  cd "../bomnous-frontend/Bootstrap fasion E-commerce" && python3 -m http.server 8080'
echo "Open http://localhost:8080/"
