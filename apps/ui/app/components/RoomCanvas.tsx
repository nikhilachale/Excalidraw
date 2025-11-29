"use client";

import { useEffect, useState } from "react";
import { websocket_url } from "@/config";
import { Canvas } from "./Canvas";


export default function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/signin";
      return;
    }

    const ws = new WebSocket(`${websocket_url}?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setSocket(ws);
      ws.send(JSON.stringify({
        type: "join_room",
        roomId
      }));
    };

    ws.onclose = () => {
      console.warn("WebSocket closed.");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomId]);



  if (!socket) return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        {/* Animated loader */}
        <div className="relative mb-8">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-500 rounded-full animate-ping mx-auto"></div>
        </div>
        
        {/* Loading text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Connecting to Canvas</h2>
          <p className="text-slate-400 animate-pulse">Establishing connection to drawing room...</p>
        </div>
        
        {/* Dots animation */}
        <div className="flex justify-center space-x-1 mt-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>;

  return (
    <Canvas roomId={roomId} socket={socket}

    />
  );
}