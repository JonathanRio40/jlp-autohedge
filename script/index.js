// --- JLP Delta-Neutre (dry-run) v3 (ultra simple, sans internet) ---
const CONFIG = {
  // 👉 Mets tes chiffres à jour (USD) :
  valeurJLP_USD: 56700,
  shortsActuels: { SOL: 23392.5, BTC: 6274.8, ETH: 4005.5 },

  levier: 1,
  seuilRel: 0.01,   // 1% de la jambe
  seuilAbsBps: 50,  // 50 bps

  // 👉 Poids MANUELS vus sur https://jup.ag/perps/jlp-earn
  weights: {
    SOL: 0.4631,   // 46.31%
    ETH: 0.0795,   // 7.95%
    BTC: 0.1325,   // 13.25%
    USDC: 0.3248   // 32.48%
  }
};

function renormVol(w) {
  const vol = 1 - w.USDC;
  return { volPart: vol, SOL: w.SOL / vol, ETH: w.ETH / vol, BTC: w.BTC / vol };
}

function computeTargetsUSD(N, L, w) {
  const r = renormVol(w);
  const Stot = L * N * r.volPart;
  return { total: Stot, SOL: Stot * r.SOL, ETH: Stot * r.ETH, BTC: Stot * r.BTC };
}

function shouldRebalance(target, current, rel, absBps) {
  const leg = Math.max(Math.abs(target), Math.abs(current));
  const th = Math.max(Math.abs(current) * rel, (absBps / 1e4) * leg);
  const gap = target - current;
  return { do: Math.abs(gap) > th, gap, threshold: th };
}

(function main() {
  const w = CONFIG.weights;                         // ← pas d’appel web
  const tgt = computeTargetsUSD(CONFIG.valeurJLP_USD, CONFIG.levier, w);
  const cur = CONFIG.shortsActuels;

  const lignes = [];
  for (const m of ["SOL", "BTC", "ETH"]) {
    const d = shouldRebalance(tgt[m], cur[m], CONFIG.seuilRel, CONFIG.seuilAbsBps);
    lignes.push({
      actif: m,
      poids: (w[m] * 100).toFixed(2) + "%",
      cible_usd: Math.round(tgt[m]),
      actuel_usd: Math.round(cur[m]),
      ecart_usd: Math.round(tgt[m] - cur[m]),
      "action (dry-run)": (tgt[m] - cur[m]) > 0 ? "VENDRE (augmenter short)" : "ACHETER (réduire short)",
      "trade_necessaire?": d.do ? "OUI" : "NON"
    });
  }

  console.log("=== DRY-RUN JLP Delta-Neutre (L=1) — v3 manuel ===");
  console.table(lignes);
  console.log("NB: aucun ordre envoyé. Ici on ne fait que calculer les tailles.");
})();
