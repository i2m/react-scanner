import { useCallback, useEffect, useRef, useState } from "react";
import { WSS_API_URL } from "./config";
import type {
  IncomingWebSocketMessage,
  PairStatsMsgData,
  PairStatsSubscriptionMessage,
  PairStatsUnsubscriptionMessage,
  PairSubscriptionMessage,
  PairUnsubscriptionMessage,
  ScannerPairsEventPayload,
  ScannerSubscriptionMessage,
  ScannerUnsubscriptionMessage,
  TickEventPayload,
} from "../task-types";

export function useTokensUpdates() {
  const wsConn = useRef<WebSocket>(null);

  const handleTickUpdate = useRef<(data: TickEventPayload) => void>(() => {});
  const setHandleTickUpdate = useCallback(
    (fn: (data: TickEventPayload) => void) => {
      handleTickUpdate.current = fn;
    },
    [],
  );

  const handlePairStatsUpdate = useRef<(data: PairStatsMsgData) => void>(
    () => {},
  );
  const setHandlePairStatsUpdate = useCallback(
    (fn: (data: PairStatsMsgData) => void) => {
      handlePairStatsUpdate.current = fn;
    },
    [],
  );

  const handleScannerPairsUpdate = useRef<
    (data: ScannerPairsEventPayload) => void
  >(() => {});
  const setHandleScannerPairsUpdate = useCallback(
    (fn: (data: ScannerPairsEventPayload) => void) => {
      handleScannerPairsUpdate.current = fn;
    },
    [],
  );

  const subscribeToUpdates = useCallback(
    (
      message:
        | ScannerSubscriptionMessage
        | PairSubscriptionMessage
        | PairStatsSubscriptionMessage,
    ) => {
      if (wsConn.current?.readyState === WebSocket.OPEN) {
        wsConn.current?.send(JSON.stringify(message));
      }
    },
    [],
  );

  const unsubscribeFromUpdates = useCallback(
    (
      message:
        | ScannerUnsubscriptionMessage
        | PairUnsubscriptionMessage
        | PairStatsUnsubscriptionMessage,
    ) => {
      if (wsConn.current?.readyState === WebSocket.OPEN) {
        wsConn.current?.send(JSON.stringify(message));
      }
    },
    [],
  );

  const handleIncomingMessage = useCallback(
    (message: IncomingWebSocketMessage) => {
      if (message == null) {
        return;
      }
      switch (message.event) {
        case "tick": {
          handleTickUpdate.current(message.data);
          break;
        }
        case "pair-stats": {
          handlePairStatsUpdate.current(message.data);
          break;
        }
        case "scanner-pairs": {
          handleScannerPairsUpdate.current(message.data);
          break;
        }
        default:
          console.warn("Unsupported message: ", message);
      }
    },
    [handlePairStatsUpdate, handleScannerPairsUpdate, handleTickUpdate],
  );

  useEffect(() => {
    wsConn.current = new WebSocket(WSS_API_URL);
    wsConn.current.onmessage = (event) => {
      handleIncomingMessage(JSON.parse(event.data));
    };
    return () => {
      wsConn.current?.close();
    };
  }, [handleIncomingMessage]);

  return {
    subscribeToUpdates,
    unsubscribeFromUpdates,
    setHandleTickUpdate,
    setHandlePairStatsUpdate,
    setHandleScannerPairsUpdate,
  };
}
