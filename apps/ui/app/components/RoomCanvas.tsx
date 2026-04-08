"use client";

import { Canvas } from "./Canvas";
import { useResilientSocket } from "@/app/hooks/useResilientSocket";

export default function RoomCanvas({ roomId }: { roomId: string }) {
  const {
    socket,
    connectionState,
    retryCount,
    retryDelay,
    sendMessage
  } = useResilientSocket(roomId, {
    onMessage: (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "error") {
        console.error("WebSocket server error:", message.error);
      }
    },
    onError: (error) => {
      console.error("WebSocket connection error:", error);
    }
  });

  // Render connection status UI
  if (!socket) {
    return <ConnectionStatusUI state={connectionState} retryCount={retryCount} retryDelay={retryDelay} />;
  }

  return (
    <Canvas roomId={roomId} socket={socket} sendMessage={sendMessage} />
  );
}

function ConnectionStatusUI({ state, retryCount, retryDelay }: { state: string; retryCount: number; retryDelay: number }) {
  const isConnecting = state === "connecting";
  const isReconnecting = state === "reconnecting";

  const getStatusText = () => {
    if (isConnecting) return "Connecting to Canvas";
    if (isReconnecting) return "Reconnecting to Canvas";
    return "Connecting to Canvas";
  };

  const getSubtext = () => {
    if (isConnecting) return "Establishing connection to drawing room...";
    if (isReconnecting) {
      const seconds = Math.ceil(retryDelay / 1000);
      return `Connection lost. Retrying in ${seconds}s... (Attempt ${retryCount})`;
    }
    return "Establishing connection to drawing room...";
  };

  const getIconColor = () => {
    if (isConnecting) return "border-blue-500 border-t-blue-500";
    if (isReconnecting) return "border-yellow-500 border-t-yellow-500";
    return "border-blue-500 border-t-blue-500";
  };

  const getSecondRingColor = () => {
    if (isConnecting) return "border-r-purple-500";
    if (isReconnecting) return "border-r-orange-500";
    return "border-r-purple-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        {/* Animated loader */}
        <div className="relative mb-8">
          <div className={`w-16 h-16 border-4 border-slate-700 ${getIconColor()} rounded-full animate-spin mx-auto`}></div>
          <div className={`absolute inset-0 w-16 h-16 border-4 border-transparent ${getSecondRingColor()} rounded-full animate-ping mx-auto`}></div>
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">{getStatusText()}</h2>
          <p className="text-slate-400 animate-pulse">{getSubtext()}</p>
        </div>

        {/* Connection info */}
        {isReconnecting && (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-200 text-sm">
              <span className="font-medium">Connection interrupted</span>
              <br />
              <span className="text-yellow-300/80">Your drawings will be saved locally and synced when reconnected.</span>
            </p>
          </div>
        )}

        {/* Dots animation */}
        <div className="flex justify-center space-x-1 mt-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}