// --- DRY-RUN v4 : lit les chiffres depuis config.json ---
import fs from 'fs';

const cfg = JSON.parse(fs.readFileSync('config.json','utf8'));

function renormVol(w){ const v=1-w.USDC; return {volPart:v,SOL:w.SOL/v,ETH:w.ETH/v,BTC:w.BTC/v}; }
function computeTargetsUSD(N,L,w){ const r=renormVol(w); const Stot=L*N*r.volPart; return {total:Stot,SOL:Stot*r.SOL,ETH:Stot*r.ETH,BTC:Stot*r.BTC}; }
function shouldRebalance(target,current,rel,absBps){ const leg=Math.max(Math.abs(target),Math.abs(current)); const th=Math.max(Math.abs(current)*rel,(absBps/1e4)*leg); const gap=target-current; return {do:Math.abs(gap)>th,gap,threshold:th}; }

(function main(){
  const w = cfg.weights;
  const tgt = computeTargetsUSD(cfg.valeurJLP_USD, cfg.levier, w);
  const cur = cfg.shortsActuels;
  const rows=[];
  for(const m of ["SOL","BTC","ETH"]){
    const d=shouldRebalance(tgt[m],cur[m],cfg.seuilRel,cfg.seuilAbsBps);
    rows.push({ actif:m, poids:(w[m]*100).toFixed(2)+"%", cible_usd:Math.round(tgt[m]),
      actuel_usd:Math.round(cur[m]), ecart_usd:Math.round(tgt[m]-cur[m]),
      "action (dry-run)": (tgt[m]-cur[m])>0 ? "VENDRE (augmenter short)" : "ACHETER (réduire short)",
      "trade_necessaire?": d.do ? "OUI" : "NON" });
  }
  console.log("=== DRY-RUN JLP Delta-Neutre (L=1) — v4 config.json ===");
  console.table(rows);
})();
