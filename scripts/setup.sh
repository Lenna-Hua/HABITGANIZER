#!/usr/bin/env bash
# HabitPup — one-command developer setup
# Usage: bash scripts/setup.sh

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

step() { echo -e "\n${CYAN}▶ $*${RESET}"; }
ok()   { echo -e "${GREEN}✓ $*${RESET}"; }
warn() { echo -e "${YELLOW}! $*${RESET}"; }

echo -e "${BOLD}HabitPup — developer setup${RESET}"
echo "This script will:"
echo "  1. Create a single root .env (web + API + mobile) if missing"
echo "  2. Symlink artifacts/habit-mobile/.env → ../../.env"
echo "  3. Run pnpm install"
echo "  4. Prompt for DATABASE_URL and push the database schema"
echo ""

# ── Step 1: Root .env (combined for web, API, and mobile) ────────────────────
step "Checking root .env …"
if [ -f ".env" ]; then
    warn ".env already exists — skipping copy"
else
    cp .env.example .env
    ok "Created .env from .env.example (includes EXPO_PUBLIC_* for mobile)"
    echo ""
    echo -e "  ${YELLOW}Open .env and fill in the following values before continuing:${RESET}"
    echo "    DATABASE_URL       — PostgreSQL connection string (e.g. from https://neon.tech)"
    echo "    CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY / VITE_CLERK_PUBLISHABLE_KEY"
    echo "                       — from https://clerk.com → your app → API Keys"
    echo "    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY — same pk_test_… as CLERK_PUBLISHABLE_KEY"
    echo "    SESSION_SECRET     — run: openssl rand -base64 32"
fi

# ── Step 2: Mobile .env → symlink to root ────────────────────────────────────
step "Linking artifacts/habit-mobile/.env → root .env …"
MOBILE_ENV="artifacts/habit-mobile/.env"
if [ -L "$MOBILE_ENV" ] || [ -f "$MOBILE_ENV" ]; then
    if [ -L "$MOBILE_ENV" ] && [ "$(readlink "$MOBILE_ENV")" = "../../.env" ]; then
        ok "Mobile .env already symlinked to root"
    else
        warn "$MOBILE_ENV exists — leave it, or replace with: ln -sfn ../../.env artifacts/habit-mobile/.env"
    fi
else
    ln -sfn ../../.env "$MOBILE_ENV"
    ok "Symlinked artifacts/habit-mobile/.env → ../../.env"
fi

# ── Step 3: pnpm install ─────────────────────────────────────────────────────
step "Installing dependencies …"
if ! command -v pnpm &>/dev/null; then
    echo "pnpm not found. Install it with:"
    echo "  npm install -g pnpm@latest"
    exit 1
fi
pnpm install
ok "Dependencies installed"

# ── Step 4: Database schema push ─────────────────────────────────────────────
step "Pushing database schema …"
echo ""

# Try to read DATABASE_URL from .env
DB_URL=""
if [ -f ".env" ]; then
    DB_URL=$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" || true)
fi

# Check if the value is still a placeholder
if [[ -z "$DB_URL" || "$DB_URL" == *"ep-xxx"* || "$DB_URL" == *"user:password"* ]]; then
    echo -e "${YELLOW}DATABASE_URL is not set in .env yet.${RESET}"
    echo -n "  Enter your PostgreSQL connection string (or press Enter to skip): "
    read -r DB_URL
fi

if [ -z "$DB_URL" ]; then
    warn "Skipping database push — run the following when your DATABASE_URL is ready:"
    echo "  pnpm --filter @workspace/db run push"
else
    DATABASE_URL="$DB_URL" pnpm --filter @workspace/db run push
    ok "Database schema pushed"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}Setup complete!${RESET}"
echo ""
echo "Next steps:"
echo "  • Make sure the root .env has real values (mobile uses the same file)"
echo "  • Start the API server:    pnpm --filter @workspace/api-server run dev:local"
echo "  • Start the web app:       pnpm --filter @workspace/habit-tracker run dev"
echo "  • Start the mobile app:    pnpm --filter @workspace/habit-mobile run dev:local"
