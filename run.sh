#!/usr/bin/env bash
set -euo pipefail

echo "==== AutoHedge starter ===="
echo "Mode: ${1:-live}"
echo "Wallet: ${WALLET_KEYPATH:-N/A}"
echo "Drift user: ${DRIFT_USER_ID:-N/A}"
echo "Subaccount: ${DRIFT_SUBACCOUNT_ID:-N/A}"
echo "RPC: ${RPC_URL:-N/A}"
echo "Weights: ${JLP_WEIGHTS_SOURCE:-N/A}"

if [[ "${1:-}" == "--dry-run" ]]; then
  echo "[DRY RUN] Tout est branché. Calculs simulés."
  exit 0
fi

echo "[LIVE] (placeholder) ici s’exécuterait la logique de hedge…"
exit 0
