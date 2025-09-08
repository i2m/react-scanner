import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import type { TokenData } from "../../task-types";

type TokensCache = {
  getTokenById: (id: TokenData["id"]) => TokenData | undefined;
  updateToken: (token: TokenData) => void;
  bulkUpdateTokens: (tokens: TokenData[]) => void;
  removeTokenById: (tokenId: TokenData["id"]) => void;
};
const TokensCacheContext = createContext<TokensCache | undefined>(undefined);

export function TokensCacheProvider(props: React.PropsWithChildren) {
  const tc = useRef(new Map<TokenData["id"], TokenData>());

  const getTokenById = useCallback(
    (id: TokenData["id"]) => tc.current.get(id),
    [],
  );

  const updateToken = useCallback((token: TokenData) => {
    tc.current.set(token.id, token);
  }, []);

  const bulkUpdateTokens = useCallback((tokens: TokenData[]) => {
    tokens.forEach((token) => {
      tc.current.set(token.id, token);
    });
  }, []);

  const removeTokenById = useCallback((tokenId: TokenData["id"]) => {
    tc.current.delete(tokenId);
  }, []);

  const value = useMemo(() => {
    return {
      getTokenById,
      updateToken,
      bulkUpdateTokens,
      removeTokenById,
    };
  }, [bulkUpdateTokens, getTokenById, updateToken, removeTokenById]);

  return (
    <TokensCacheContext.Provider value={value}>
      {props.children}
    </TokensCacheContext.Provider>
  );
}

export function useTokensCache() {
  const context = useContext(TokensCacheContext);
  if (context == null) {
    throw new Error(
      `${useTokensCache.name} must be used within a ${TokensCacheContext.displayName} context`,
    );
  }
  return context;
}
