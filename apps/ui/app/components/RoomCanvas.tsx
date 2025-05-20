"use client";

import { useEffect, useState } from "react";
import { websocket_url } from "@/config";
import { Canvas } from "./Canvas";


export default function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${websocket_url}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMmM0NDM4NC0wZmI5LTQyZWQtODBkZC1iZmRkM2VjYTg4YjciLCJpYXQiOjE3NDcyODU3MDd9.JrLe6wFNcFThBCS-WYO40PLrphwxyMIrDUIl7VvIRg0`);

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