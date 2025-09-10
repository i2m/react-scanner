import { useCallback, useEffect, useState } from "react";
import type {
  GetScannerResultParams,
  PairStatsMsgData,
  ScannerPairsEventPayload,
  TickEventPayload,
  TokenData,
} from "./task-types";
import { fetchTokens, scannerResultToTokenData } from "./api/rest";
import { useTokensCache } from "./api/cache/tokens";
import { usePagedTokensCache } from "./api/cache/paged-tokens";
import { useTokensUpdates } from "./api/ws";

export function useTableModel(initFilter: GetScannerResultParams) {
  const [page, setPage] = useState(initFilter.page || 1);
  const [filter, setFilter] = useState(initFilter);
  const [totalTokensCount, setTotalTokensCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rev, setRev] = useState(Date.now());
  const [tokens, setTokens] = useState<{ rev: number; tokens: TokenData[] }>({
    rev: rev,
    tokens: [],
  });

  const { updateToken, bulkUpdateTokens, getTokenById, removeTokenById } =
    useTokensCache();
  const {
    updateTokensIdsOnPage,
    getTokensIdsOnPage,
    clearCache: clearPagedTokensCache,
  } = usePagedTokensCache();

  const {
    subscribeToUpdates,
    unsubscribeFromUpdates,
    setHandlePairStatsUpdate,
    setHandleScannerPairsUpdate,
    setHandleTickUpdate,
  } = useTokensUpdates();

  const fetchTokensOnPage = useCallback(
    (page: number, params: GetScannerResultParams) => {
      setLoading(true);
      fetchTokens({ ...params, page })
        .then((data) => {
          bulkUpdateTokens(data.tokens);
          updateTokensIdsOnPage(
            data.tokens.map((t) => t.id),
            page,
          );
          setTotalTokensCount(data.totalRows);

          setLoading(false);
          setRev(Date.now());

          data.tokens.forEach((token) => {
            const d = {
              pair: token.pairAddress,
              token: token.tokenAddress,
              chain: token.chain,
            };
            subscribeToUpdates({
              event: "subscribe-pair",
              data: d,
            });
            subscribeToUpdates({
              event: "subscribe-pair-stats",
              data: d,
            });
          });
        })
        .catch((err: Error) => {
          setError(err.message);
          setLoading(false);
        });
    },
    [bulkUpdateTokens, subscribeToUpdates, updateTokensIdsOnPage],
  );

  const handleTickUpdate = useCallback(
    (data: TickEventPayload): void => {
      const { pair, swaps } = data;

      const sw = swaps.filter((swap) => !swap.isOutlier);
      const latestSwap = sw.pop();
      const token = getTokenById(pair.pair);

      if (latestSwap && token) {
        const newPrice = parseFloat(latestSwap.priceToken1Usd);
        const totalSupply = token.token1TotalSupplyFormatted;
        const newMarketCap = totalSupply * newPrice;

        let isBuy = false;
        let isSell = false;
        const prevLatestSwap = sw.pop();
        if (prevLatestSwap) {
          isBuy = latestSwap.amountToken1 > prevLatestSwap.amountToken1;
          isSell = !isBuy;
        }
        updateToken({
          ...token,
          volumeUsd:
            token.volumeUsd +
            parseFloat(latestSwap.amountToken1 || "0") * newPrice,
          priceUsd: newPrice,
          mcap: newMarketCap,
          transactions: {
            ...token.transactions,
            buys: isBuy ? token.transactions.buys + 1 : token.transactions.buys,
            sells: isSell
              ? token.transactions.sells + 1
              : token.transactions.sells,
          },
        });
        setRev(Date.now());
      }
    },
    [getTokenById, updateToken],
  );

  const handlePairStatsUpdate = useCallback(
    (data: PairStatsMsgData): void => {
      const { pair } = data;
      const token = getTokenById(pair.pairAddress);
      if (token) {
        updateToken({
          ...token,
          audit: {
            mintable: pair.mintAuthorityRenounced,
            freezable: pair.freezeAuthorityRenounced,
            honeypot: !pair.token1IsHoneypot,
            contractVerified: token.audit.contractVerified || pair.isVerified,
          },
        });
        setRev(Date.now());
      }
    },
    [getTokenById, updateToken],
  );

  const handleScannerPairsUpdate = useCallback(
    (data: ScannerPairsEventPayload): void => {
      const {
        filter,
        results: { pairs },
      } = data;

      const page = filter.page;
      if (page) {
        const storedIds = new Set(getTokensIdsOnPage(page));

        const receivedIds = new Set(pairs.map((p) => p.pairAddress));
        const removedIds = storedIds.difference(receivedIds);
        removedIds.forEach((id) => {
          const token = getTokenById(id);
          if (token) {
            const d = {
              pair: token.pairAddress,
              token: token.tokenAddress,
              chain: token.chain,
            };
            unsubscribeFromUpdates({
              event: "unsubscribe-pair",
              data: d,
            });
            unsubscribeFromUpdates({
              event: "unsubscribe-pair-stats",
              data: d,
            });
            removeTokenById(token.id);
          }
        });
        const newIds = receivedIds.difference(storedIds);
        newIds.forEach((id) => {
          const pair = pairs.find((p) => p.pairAddress === id)!;
          const token = scannerResultToTokenData(pair);
          updateToken(token);
          const d = {
            pair: token.pairAddress,
            token: token.tokenAddress,
            chain: token.chain,
          };
          subscribeToUpdates({
            event: "subscribe-pair",
            data: d,
          });
          subscribeToUpdates({
            event: "subscribe-pair-stats",
            data: d,
          });
        });
        updateTokensIdsOnPage([...receivedIds.values()], page);
        setRev(Date.now());
      }
    },
    [
      getTokenById,
      getTokensIdsOnPage,
      removeTokenById,
      subscribeToUpdates,
      unsubscribeFromUpdates,
      updateToken,
      updateTokensIdsOnPage,
    ],
  );

  useEffect(() => {
    setHandlePairStatsUpdate(handlePairStatsUpdate);
    setHandleScannerPairsUpdate(handleScannerPairsUpdate);
    setHandleTickUpdate(handleTickUpdate);
  }, [
    handlePairStatsUpdate,
    handleScannerPairsUpdate,
    handleTickUpdate,
    setHandlePairStatsUpdate,
    setHandleScannerPairsUpdate,
    setHandleTickUpdate,
  ]);

  const fetchNextPage = useCallback(() => {
    setPage((page) => page + 1);
  }, []);

  const changeRequestsFilter = useCallback(
    (nextFilter: GetScannerResultParams) => {
      unsubscribeFromUpdates({
        event: "unsubscribe-scanner-filter",
        data: filter,
      });

      setFilter(nextFilter);
      setPage(1);
      clearPagedTokensCache();

      subscribeToUpdates({
        event: "scanner-filter",
        data: nextFilter,
      });
    },
    [clearPagedTokensCache, filter, subscribeToUpdates, unsubscribeFromUpdates],
  );

  useEffect(() => {
    fetchTokensOnPage(page, filter);
  }, [fetchTokensOnPage, page, filter]);

  useEffect(() => {
    const uniqIds = new Set(
      [...Array(page).keys()].flatMap((i) => {
        return getTokensIdsOnPage(i + 1);
      }),
    );
    const tokens = [...uniqIds].map(getTokenById).filter((t) => t != null);
    setTokens({ tokens, rev });
  }, [getTokenById, getTokensIdsOnPage, page, rev]);

  return {
    tokens: tokens.tokens,
    totalTokensCount,
    fetchNextPage,
    changeRequestsFilter,
    loading,
    error,
  };
}
