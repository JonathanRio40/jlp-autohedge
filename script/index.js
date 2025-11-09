// --- DRY-RUN JLP Delta-Neutre (L=1) — v5 avec P&L latent & couverture % ---
import fs from 'fs';

// Lit la configuration (tes chiffres) depuis config.json
const cfg = JSON.parse(fs.readFileSync('config.json','utf8'));

// Petites fonctions utilitaires
function renormVol(w){ const v=1-w.USDC; return {volPart:v,SOL:w.SOL/v,ETH:w.ETH/v,BTC:w.BTC/v}; }
function computeTargetsUSD(N,L,w){ const r=renormVol(w); const Stot=L*N*r.volPart; return {total:Stot,SOL:Stot*r.SOL,ETH:Stot*r.ETH,BTC:Stot*r.BTC}; }
function shouldRebalance(target,current,rel,absBps){ const leg=Math.max(Math.abs(target),Math.abs(current)); const th=Math.max(Math.abs(current)*rel,(absBps/1e4)*leg); const gap=target-current; return {do:Math.abs(gap)>th,gap,threshold:th}; }
const r0 = (x)=>Math.round(x); // arrondi lisible

(function main(){
  const w = cfg.weights;                                  // poids JLP (manuels pour l’instant)
  const tgt = computeTargetsUSD(cfg.valeurJLP_USD, cfg.levier || 1, w);
  const cur = cfg.shortsActuels;

  // Lignes par actif + cumuls
  const rows=[];
  let totGap=0, totCur=0, totTgt=0;
  for(const m of ["SOL","BTC","ETH"]){
    const d=shouldRebalance(tgt[m],cur[m],cfg.seuilRel,cfg.seuilAbsBps);
    const gap=tgt[m]-cur[m]; totGap+=gap; totCur+=cur[m]; totTgt+=tgt[m];
    rows.push({
      actif:m,
      poids:(w[m]*100).toFixed(2)+"%",
      cible_usd:r0(tgt[m]),
      actuel_usd:r0(cur[m]),
      ecart_usd:r0(gap),
      "action (dry-run)": gap>0 ? "VENDRE (augmenter short)" : "ACHETER (réduire short)",
      "trade_necessaire?": d.do ? "OUI" : "NON"
    });
  }

  // Couverture théorique totale (hors stables)
  const volPart = 1 - w.USDC;                                        // part non stable de JLP
  const hedgeTargetTot = (cfg.valeurJLP_USD) * volPart * (cfg.levier || 1);
  const coverRatio = totCur / hedgeTargetTot;                        // 1.00 = parfaitement delta-neutre

  console.log("=== DRY-RUN JLP Delta-Neutre (L=1) — v5 config.json ===");
  console.table(rows);
  console.log(`Couverture actuelle : ${(coverRatio*100).toFixed(2)}%  | Short actuel $${r0(totCur)}  | Short cible $${r0(hedgeTargetTot)}`);
  console.log(`Écart total à trader (signe = direction) : $${r0(totGap)}  -> ${totGap>0 ? "VENDRE (augmenter short)" : "ACHETER (réduire short)"}`);

  // P&L latent vs capital initial (si fourni dans config.json)
  if (typeof cfg.initialCapitalUSD === "number" && typeof cfg.portfolioValueUSD === "number") {
    const pnl = cfg.portfolioValueUSD - cfg.initialCapitalUSD;
    const pnlPct = (pnl / cfg.initialCapitalUSD) * 100;
    console.log(`P&L latent : $${pnl.toFixed(2)}  (${pnlPct.toFixed(2)}%)  | Portefeuille $${cfg.portfolioValueUSD.toFixed(2)}  | Capital initial $${cfg.initialCapitalUSD.toFixed(2)}`);
  } else {
    console.log("Astuce : ajoute 'initialCapitalUSD' et 'portfolioValueUSD' dans config.json pour afficher le P&L latent.");
  }

  console.log("NB : aucun ordre envoyé. Ici on calcule seulement les tailles.");
})();
