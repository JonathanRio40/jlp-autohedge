// script/v5/engine.js
const fs = require('fs');
const https = require('https');

function fetchJson(urlOrPath) {
  return new Promise((resolve, reject) => {
    if (/^https?:\/\//i.test(urlOrPath)) {
      https.get(urlOrPath, (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        });
      }).on('error', reject);
    } else {
      try {
        const txt = fs.readFileSync(urlOrPath, 'utf8');
        resolve(JSON.parse(txt));
      } catch (e) { reject(e); }
    }
  });
}

function fmt(n) { return Number(n).toFixed(4); }

async function main(mode = 'dry-run') {
  const {
    DRIFT_USER_ID,
    DRIFT_SUBACCOUNT_ID = '0',
    TARGET_LEVERAGE = '2',
    JLP_WEIGHTS_SOURCE = '',
  } = process.env;

  if (!DRIFT_USER_ID) throw new Error('DRIFT_USER_ID manquant');
  const lev = Number(TARGET_LEVERAGE);

  // 1) Poids JLP (JSON: { weights: {BTC,ETH,SOL,USDC...} })
  if (!JLP_WEIGHTS_SOURCE) throw new Error('JLP_WEIGHTS_SOURCE manquant');
  const weights = (await fetchJson(JLP_WEIGHTS_SOURCE)).weights || {};
  const wBTC = Number(weights.BTC || 0);
  const wETH = Number(weights.ETH || 0);
  const wSOL = Number(weights.SOL || 0);
  const wStable = 1 - (wBTC + wETH + wSOL);

  // 2) Hypothèse: valeur JLP détenue = V (lecture on-chain à brancher; placeholder)
  //    Pour le sizing, la formule delta-neutre (sans funding/fee) :
  //    Notional short_i = V * lev * w_i_non_stable
  //    où w_i_non_stable = poids crypto i (BTC/ETH/SOL) dans la pool
  const V = Number(process.env.POSITION_JLP_USD || '1000'); // placeholder
  const targetBTC = V * lev * wBTC;
  const targetETH = V * lev * wETH;
  const targetSOL = V * lev * wSOL;

  console.log('=== V5 sizing (delta-neutre) ===');
  console.log(`Mode=${mode}  User=${DRIFT_USER_ID}  Sub=${DRIFT_SUBACCOUNT_ID}`);
  console.log(`Leverage=${lev}  JLP=$${fmt(V)}  Weights: BTC=${fmt(wBTC)} ETH=${fmt(wETH)} SOL=${fmt(wSOL)} STBL=${fmt(wStable)}`);
  console.log('Targets notional (USD):');
  console.log(`  BTC short: $${fmt(targetBTC)}`);
  console.log(`  ETH short: $${fmt(targetETH)}`);
  console.log(`  SOL short: $${fmt(targetSOL)}`);

  if (mode === 'dry-run') {
    console.log('[DRY-RUN] Ordres non envoyés.');
    return;
  }

  // 3) LIVE — à brancher (Drift SDK):
  // - Lire positions actuelles (BTC/ETH/SOL perp)
  // - Calculer delta = target - current
  // - Placer ordres marché/PO via DriftClient (avec slippage bps)
  // Placeholder:
  console.log('[LIVE] (placeholder) connecter Drift SDK ici pour envoyer les ordres.');
}

if (require.main === module) {
  const mode = process.argv.includes('--dry-run') ? 'dry-run' : 'live';
  main(mode).catch((e) => { console.error('V5 error:', e.message); process.exit(1); });
}

module.exports = { main };
