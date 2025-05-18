"use client";

import { useRef } from "react";
import { Circle, RectangleHorizontal } from "lucide-react";
import { useEffect } from "react";
import Draw from "@/draw";


export function Canvas({
  roomId,
  socket
}: {
  socket: WebSocket;
  roomId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {

    if (canvasRef.current) {

      Draw(canvasRef.current, roomId, socket);

    }
  }, [canvasRef]);

  return (
    
    <div className="w-full h-screen bg-black relative">
      
      <canvas
        ref={(el) => {
          if (el) {

            canvasRef.current = el;
          }
        }}
        className="w-full h-full"
        style={{ display: "block" }}
      />

      <div className="absolute bottom-4 right-4 z-20 flex flex-col space-y-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"

        >
          <RectangleHorizontal className="h-5 w-5 text-white" />
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"

        >
          <Circle className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
}