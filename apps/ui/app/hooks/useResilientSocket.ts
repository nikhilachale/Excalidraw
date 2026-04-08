"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { websocket_url } from "@/config";

type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected";

interface QueuedMessage {
  message: string;
  timestamp: number;
}

interface UseResilientSocketOptions {
  onMessage?: (event: MessageEvent) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
}

export function useResilientSocket(
  roomId: string,
  options: UseResilientSocketOptions = {}
) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roomIdRef = useRef(roomId);

  // Update roomId ref when it changes
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  // Calculate exponential backoff delay
  const calculateBackoffDelay = (attempt: number): number => {
    const delays = [1000, 2000, 4000, 8000, 16000];
    const maxDelay = 30000;
    if (attempt < delays.length) {
      return delays[attempt];
    }
    return maxDelay;
  };

  // Connect to WebSocket
  const connect = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/signin";
      return;
    }

    const ws = new WebSocket(`${websocket_url}?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
      socketRef.current = ws;
      setConnectionState("connected");
      setRetryCount(0);
      setRetryDelay(0);

      // Rejoin room automatically after reconnection
      ws.send(JSON.stringify({
        type: "join_room",
        roomId: roomIdRef.current
      }));

      // Send queued messages
      const queuedMessages = [...messageQueueRef.current];
      messageQueueRef.current = [];

      queuedMessages.forEach((queued) => {
        try {
          ws.send(queued.message);
          console.log(`Sent queued message (${Date.now() - queued.timestamp}ms old)`);
        } catch (error) {
          console.error("Failed to send queued message:", error);
        }
      });

      options.onConnected?.();
    };

    ws.onclose = (event) => {
      console.warn("WebSocket closed:", event.code, event.reason);
      socketRef.current = null;
      setConnectionState("reconnecting");
      options.onDisconnected?.();

      // Attempt to reconnect with exponential backoff
      const nextRetryCount = retryCount + 1;
      const delay = calculateBackoffDelay(nextRetryCount);
      setRetryCount(nextRetryCount);
      setRetryDelay(delay);

      retryTimeoutRef.current = setTimeout(() => {
        setConnectionState("connecting");
        connect();
      }, delay);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      options.onError?.(error);
    };

    ws.onmessage = (event) => {
      options.onMessage?.(event);
    };

    return ws;
  }, [retryCount, options]);

  // Send message with queuing
  const sendMessage = useCallback((message: string) => {
    const ws = socketRef.current;

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    } else {
      // Queue message for later delivery
      messageQueueRef.current.push({
        message,
        timestamp: Date.now()
      });
      console.log("Message queued (disconnected):", message);
    }
  }, []);

  // Initialize connection
  useEffect(() => {
    const ws = connect();

    return () => {
      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // Close WebSocket
      if (ws && ws.readyState !== WebSocket.CLOSED) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    socket: socketRef.current,
    connectionState,
    retryCount,
    retryDelay,
    sendMessage,
    queuedMessagesCount: messageQueueRef.current.length
  };
}
