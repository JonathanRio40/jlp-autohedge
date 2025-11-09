#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"
if [[ "$MODE" == "--dry-run" ]]; then MODE="dry-run"; else MODE="live"; fi

echo "==== AutoHedge V5 ===="
echo "Mode: $MODE"
echo "Wallet: ${WALLET_KEYPATH:-N/A}"
echo "Drift user: ${DRIFT_USER_ID:-N/A}"
echo "Subaccount: ${DRIFT_SUBACCOUNT_ID:-N/A}"
echo "RPC: ${RPC_URL:-N/A}"
echo "Weights: ${JLP_WEIGHTS_SOURCE:-N/A}"

# Node 18
node -v || true
if ! command -v node >/dev/null 2>&1; then
  echo "Node introuvable sur le runner"; exit 1
fi

# Ex: POSITION_JLP_USD peut être passé via env GitHub (vars/secrets)
node ./script/v5/engine.js "$MODE"
