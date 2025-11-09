// --- JLP Delta-Neutre (dry-run) ---
// Simple: va chercher les poids JLP en live, calcule la cible de hedge L=1,
// puis compare à TES tailles actuelles (à saisir juste en-dessous).

// 👉 RENSEIGNE ICI TES TAILLES ACTUELLES (en USD) :
const CONFIG = {
  valeurJLP_USD: 56700,      // valeur totale de ton JLP (USD)
  shortsActuels: {           // notionnels actuels de tes shorts
    SOL: 23392.5,
    BTC: 6274.8,
    ETH: 4005.5
  },
  levier: 1,                 // L=1 (pas de levier)
  seuilRel: 0.01,            // 1% de la jambe
  seuilAbsBps: 50            // 50 bps du notional de la jambe
};

async function getWeights() {
  // On lit la page jup.ag (source pratique et gratuite).
  // Si l’URL change un jour, on la mettra à jour.
  const res = await fetch("https://jup.ag/perps/jlp-earn");
  const html = await res.text();
  // On récupère les pourcentages visibles dans la page (regex simple).
  // C’est du dry-run : si ça casse, on passera à la lecture on-chain.
  const pick = (label) => {
    const r = new RegExp(`${label}[^%]+([0-9]{1,2}\\.[0-9]{1,2})%`, "i").exec(html);
    return r ? parseFloat(r[1])/100 : null;
  };
  // On essaie d'abord avec l’ordre de la page
  let sol = pick("SOL");
  let eth = pick("ETH");
  let btc = pick("WBTC");
  let usdc = pick("USDC");
  if ([sol,eth,btc,usdc].some(v=>v===null)) {
    throw new Error("Impossible de lire les poids sur la page jup.ag (dry-run).");
  }
  return { SOL: sol, ETH: eth, BTC: btc, USDC: usdc };
}

function renormVol(w) {
  const vol = 1 - w.USDC;
  return {
    volPart: vol,
    SOL: w.SOL / vol,
    ETH: w.ETH / vol,
    BTC: w.BTC / vol
  };
}

function computeTargetsUSD(N, L, w) {
  const r = renormVol(w);
  const Stot = L * N * r.volPart;
  return {
    total: Stot,
    SOL: Stot * r.SOL,
    ETH: Stot * r.ETH,
    BTC: Stot * r.BTC
  };
}

function shouldRebalance(target, current, rel, absBps) {
  const leg = Math.max(Math.abs(target), Math.abs(current));
  const th = Math.max(Math.abs(current) * rel, (absBps/1e4) * leg);
  const gap = target - current;
  return { do: Math.abs(gap) > th, gap, threshold: th };
}

(async () => {
  try {
    const w = await getWeights();
    const tgt = computeTargetsUSD(CONFIG.valeurJLP_USD, CONFIG.levier, w);
    const cur = CONFIG.shortsActuels;

    const lignes = [];
    for (const m of ["SOL","BTC","ETH"]) {
      const d = shouldRebalance(tgt[m], cur[m], CONFIG.seuilRel, CONFIG.seuilAbsBps);
      lignes.push({
        actif: m,
        poids_live: (w[m]*100).toFixed(2)+"%",
        cible_usd: Math.round(tgt[m]),
        actuel_usd: Math.round(cur[m]),
        ecart_usd: Math.round(tgt[m]-cur[m]),
        "action (dry-run)": (tgt[m]-cur[m])>0 ? "VENDRE (augmenter short)" : "ACHETER (réduire short)",
        "trade_necessaire?": d.do ? "OUI" : "NON"
      });
    }

    console.log("=== DRY-RUN JLP Delta-Neutre (L=1) ===");
    console.log(`Valeur JLP : $${CONFIG.valeurJLP_USD.toLocaleString("en-US")}`);
    console.log(`Poids live lus :`, w);
    console.table(lignes);
    console.log("NB: Ceci NE PASSE AUCUN ORDRE. On vérifie juste les tailles.");
  } catch (e) {
    console.error("Erreur dry-run:", e.message);
    process.exit(1);
  }
})();
