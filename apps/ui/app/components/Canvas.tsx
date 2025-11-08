"use client";

import { useRef, useState, useEffect } from "react";
import { Circle, Pencil, RectangleHorizontalIcon } from "lucide-react";
import { Game } from "@/draw/Game";
import { IconButton } from "./IconButton";
export type Tool = "circle" | "rect" | "line";
import { cleanCanvas } from "@/draw/http";
export function Canvas({
  roomId,
  socket
}: {
  socket: WebSocket;
  roomId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game>();
  const [selectedTool, setSelectedTool] = useState<Tool>("circle");

  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const g = new Game(canvas, roomId, socket);
      setGame(g);

     
      return () => g.destroy();
    }
  }, []);

  return (
    <div>
      <canvas
        id="canvas"
        ref={canvasRef}
        style={{ width: "100vw", height: "100vh", display: "block" }}
      ></canvas>
      <Topbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} socket={socket} roomId={roomId} game={game} />
    </div>
  );
}

function Topbar({ selectedTool, setSelectedTool, socket, roomId, game }: {
  selectedTool: Tool,
  setSelectedTool: (s: Tool) => void,
  socket: WebSocket,
  roomId: string,
  game?: Game
}) {
  const handleClear = async () => {
    try {
      await cleanCanvas(roomId);
      socket.send(JSON.stringify({ type: "clear", roomId }));
      // Clear local shapes immediately using Game public API
      if (game) {
        game.clearCanvas();
      }
    } catch (error) {
      console.error("Failed to clear canvas:", error);
    }
  };

  return <div style={{
    position: "fixed",
    top: 10,
    left: 10
  }}>
    <div className="flex gap-2">
      <IconButton
        onClick={() => {
          setSelectedTool("line");
        }}
        activated={selectedTool === "line"}
        icon={<Pencil />}
      />
      <IconButton onClick={() => {
        setSelectedTool("rect");
      }} activated={selectedTool === "rect"} icon={<RectangleHorizontalIcon />} />
      <IconButton onClick={() => {
        setSelectedTool("circle");
      }} activated={selectedTool === "circle"} icon={<Circle />} />

      <button onClick={handleClear}>Clear</button>
    </div>
  </div>
}