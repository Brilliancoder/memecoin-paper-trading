import { SOL_MINT, getJson } from "./core.js";

const JUP = process.env.JUP_API_URL || "https://lite-api.jup.ag";

/** A real Jupiter swap quote. Amounts are in raw units (lamports, or token base units). */
export async function quote(inputMint, outputMint, amountRaw, slippageBps = 100) {
  const url = `${JUP}/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${BigInt(Math.floor(amountRaw))}&slippageBps=${slippageBps}`;
  let q;
  try {
    q = await getJson(url, { retries: 3 });
  } catch (err) {
    if (err.status === 400 || err.status === 404) throw new Error("Jupiter has no route for this token right now (no liquidity, or not tradable).");
    throw err;
  }
  if (!q?.outAmount) throw new Error(q?.error || "Jupiter returned no quote.");
  return {
    inAmount: Number(q.inAmount),
    outAmount: Number(q.outAmount),
    minOut: Number(q.otherAmountThreshold),
    priceImpactPct: Number(q.priceImpactPct) * 100,
    route: (q.routePlan || []).map((r) => r.swapInfo?.label).filter(Boolean).join(" → ") || "direct",
  };
}

/** Decimals and USD price for tokens, from Jupiter's price API. */
export async function tokenPrices(mints) {
  const out = new Map();
  const list = [...new Set([SOL_MINT, ...mints])];
  for (let i = 0; i < list.length; i += 50) {
    const res = await getJson(`${JUP}/price/v3?ids=${list.slice(i, i + 50).join(",")}`, { retries: 3 });
    for (const [mint, p] of Object.entries(res || {})) out.set(mint, { usd: Number(p.usdPrice) || null, decimals: p.decimals ?? null });
  }
  return out;
}
