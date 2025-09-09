import { createContext, useCallback, useContext, useMemo, useRef } from "react";

import type { TokenData } from "../../task-types";

type PagedTokensCache = {
  getTokensIdsOnPage: (page: number) => Array<TokenData["id"]>;
  updateTokensIdsOnPage: (ids: Array<TokenData["id"]>, page: number) => void;
  clearCache: () => void;
};
const PagedTokensCacheContext = createContext<PagedTokensCache | undefined>(
  undefined,
);

export function PagedTokensCacheProvider(props: React.PropsWithChildren) {
  const ptc = useRef(new Map<number, Array<TokenData["id"]>>());

  const getTokensIdsOnPage = useCallback((page: number) => {
    return ptc.current.get(page) || [];
  }, []);

  const updateTokensIdsOnPage = useCallback(
    (ids: Array<TokenData["id"]>, page: number) => {
      ptc.current.set(page, ids);
    },
    [],
  );

  const clearCache = useCallback(() => {
    ptc.current.clear();
  }, []);

  const value = useMemo(() => {
    return { getTokensIdsOnPage, updateTokensIdsOnPage, clearCache };
  }, [getTokensIdsOnPage, updateTokensIdsOnPage, clearCache]);

  return (
    <PagedTokensCacheContext.Provider value={value}>
      {props.children}
    </PagedTokensCacheContext.Provider>
  );
}

export function usePagedTokensCache() {
  const context = useContext(PagedTokensCacheContext);
  if (context == null) {
    throw new Error(
      `${usePagedTokensCache.name} must be used within a ${PagedTokensCacheContext.displayName} context`,
    );
  }
  return context;
}
