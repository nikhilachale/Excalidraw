"use client";

import { useEffect, useState } from "react";
import { websocket_url } from "@/config";
import { Canvas } from "./Canvas";


export default function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${websocket_url}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNTFkZjZjZS02YTBjLTRiYzMtYTFjMy0wY2Q4YTlhZWM4MzIiLCJpYXQiOjE3NDc3NDQ1NjB9.6rWrXcW1kFb7OJFI3Kd-W15wPU4wZKVeklW2Db7FHgQ`);

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

    
  }, [roomId]);



  if (!socket) return <div>Connecting to the server...</div>;

  return (
    <Canvas roomId={roomId} socket={socket}

    />
  );
}