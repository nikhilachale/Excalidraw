"use client";

import { useRef, useState, useEffect } from "react";
import { Circle, Pencil, RectangleHorizontalIcon } from "lucide-react";
import { Game } from "@/draw/Game";
import { IconButton } from "./IconButton";
export type Tool = "circle" | "rect" | "line";

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
      <Topbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
    </div>
  );
}

function Topbar({ selectedTool, setSelectedTool }: {
  selectedTool: Tool,
  setSelectedTool: (s: Tool) => void
}) {
  return <div style={{
    position: "fixed",
    top: 10,
    left: 10
  }}>
    <div className="flex gap-t">
      <IconButton
        onClick={() => {
          setSelectedTool("line");
        }}
        activated={selectedTool === "line"}
        icon={<Pencil />}
      />
      <IconButton onClick={() => {
        setSelectedTool("rect");
      }} activated={selectedTool === "rect"} icon={<RectangleHorizontalIcon />} ></IconButton>
      <IconButton onClick={() => {
        setSelectedTool("circle");
      }} activated={selectedTool === "circle"} icon={<Circle />}></IconButton>
    </div>
  </div>
}