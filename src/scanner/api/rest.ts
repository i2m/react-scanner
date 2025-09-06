import {
  chainIdToName,
  type GetScannerResultParams,
  type ScannerApiResponse,
  type ScannerResult,
  type TokenData,
} from "../task-types";
import { HTTPS_API_URL } from "./config";

export interface ScannerTokensResponse {
  tokens: TokenData[];
  totalRows: number;
}

export const fetchTokens = async (
  params: GetScannerResultParams,
): Promise<ScannerTokensResponse> => {
  const queryParams = buildQueryParams(params);
  const response = await fetch(`${HTTPS_API_URL}/scanner${queryParams}`);

  if (!response.ok) {
    throw new Error(`Failed to get tokens! Status: ${response.status}`);
  }

  const data = (await response.json()) as ScannerApiResponse;
  return {
    tokens: data.pairs.map(scannerResultToTokenData),
    totalRows: data.totalRows,
  };
};

// ===== API HELPER FUNCTIONS =====

export function scannerResultToTokenData(sr: ScannerResult): TokenData {
  function calcMcap() {
    const currentMcap = parseFloat(sr.currentMcap);
    if (currentMcap > 0) {
      return currentMcap;
    }
    const initialMcap = parseFloat(sr.initialMcap);
    if (initialMcap > 0) {
      return initialMcap;
    }
    const pairMcapUsd = parseFloat(sr.pairMcapUsd);
    if (pairMcapUsd > 0) {
      return pairMcapUsd;
    }
    const pairMcapUsdInitial = parseFloat(sr.pairMcapUsdInitial);
    if (pairMcapUsdInitial > 0) {
      return pairMcapUsdInitial;
    }
    return 0;
  }

  return {
    id: sr.token1Address,
    tokenName: sr.token1Name,
    tokenSymbol: sr.token1Symbol,
    tokenAddress: sr.token1Address,
    pairAddress: sr.pairAddress,
    chain: chainIdToName(sr.chainId),
    exchange: sr.routerAddress,
    priceUsd: parseFloat(sr.price),
    volumeUsd: parseFloat(sr.volume || "0"),
    mcap: calcMcap(),
    priceChangePcs: {
      "5m": parseFloat(sr.diff5M || "0"),
      "1h": parseFloat(sr.diff1H || "0"),
      "6h": parseFloat(sr.diff6H || "0"),
      "24h": parseFloat(sr.diff24H || "0"),
    },
    transactions: {
      buys: sr.buys || 0,
      sells: sr.sells || 0,
    },
    audit: {
      mintable: sr.isMintAuthDisabled,
      freezable: sr.isFreezeAuthDisabled,
      honeypot: Boolean(sr.honeyPot),
      contractVerified: sr.contractVerified,
    },
    tokenCreatedTimestamp: new Date(sr.age),
    liquidity: {
      current: parseFloat(sr.liquidity),
      changePc: parseFloat(sr.percentChangeInLiquidity),
    },
    token1TotalSupplyFormatted: parseFloat(sr.token1TotalSupplyFormatted),
  };
}

function buildQueryParams(params: GetScannerResultParams): string {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([name, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(name, v));
    } else {
      search.append(name, value);
    }
  });

  return `${search.size > 0 ? "?" : ""}${search.toString()}`;
}
