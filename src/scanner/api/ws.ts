import { useCallback, useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";
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

  const { lastJsonMessage, sendJsonMessage } =
    useWebSocket<IncomingWebSocketMessage>(WSS_API_URL, {
      heartbeat: true,
    });

  const subscribeToUpdates = useCallback(
    (
      message:
        | ScannerSubscriptionMessage
        | PairSubscriptionMessage
        | PairStatsSubscriptionMessage,
    ) => {
      sendJsonMessage(message);
    },
    [sendJsonMessage],
  );

  const unsubscribeFromUpdates = useCallback(
    (
      message:
        | ScannerUnsubscriptionMessage
        | PairUnsubscriptionMessage
        | PairStatsUnsubscriptionMessage,
    ) => {
      sendJsonMessage(message);
    },
    [sendJsonMessage],
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
    handleIncomingMessage(lastJsonMessage);
  }, [handleIncomingMessage, lastJsonMessage]);

  return {
    subscribeToUpdates,
    unsubscribeFromUpdates,
    setHandleTickUpdate,
    setHandlePairStatsUpdate,
    setHandleScannerPairsUpdate,
  };
}
