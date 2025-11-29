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
  const [game, setGame] = useState<Game | undefined>();
  const [selectedTool, setSelectedTool] = useState<Tool>("circle");
  const [strokeColor, setStrokeColor] = useState<string>("#3B82F6");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (game) {
      game.setTool(selectedTool);
      game.setStrokeColor(strokeColor);
    }
  }, [selectedTool, game, strokeColor]);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const token = localStorage.getItem('token');

        if (token ) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ratio = window.devicePixelRatio || 1;
      // set CSS size (what the page sees)
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      // set actual drawing buffer size taking DPR into account
      canvas.width = Math.max(1, Math.floor(window.innerWidth * ratio));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * ratio));

      const g = new Game(canvas, roomId, socket);
      g.setStrokeColor(strokeColor);
      g.setTool(selectedTool);
      setGame(g);

      // ensure correct transform for crisp rendering
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      g.clearCanvas();

      return () => g.destroy();
    }
  }, [roomId, socket]); 

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Background grid pattern */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[size:20px_20px] pointer-events-none" 
      />
      
      {/* Canvas */}
      <canvas
        id="canvas"
        ref={canvasRef}
        className="block w-full h-full"
        style={{ width: "100vw", height: "100vh" }}
      />
      
      {/* Toolbar */}
      <Topbar
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        socket={socket}
        roomId={roomId}
        game={game}
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
      />
      
      {/* Room info indicator */}
      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2 text-white text-sm pointer-events-none">
        Room: <span className="font-semibold text-blue-400">{roomId}</span>
      </div>
    </div>
  );
}

function Topbar({ selectedTool, setSelectedTool, socket, roomId, game, strokeColor, setStrokeColor }: {
  selectedTool: Tool,
  setSelectedTool: (s: Tool) => void,
  socket: WebSocket,
  roomId: string,
  game?: Game,
  strokeColor: string,
  setStrokeColor: (c: string) => void
}) {
  const handleClear = async () => {
    try {
      await cleanCanvas(roomId);
      socket.send(JSON.stringify({ type: "clear", roomId }));
      if (game) {
        game.clearCanvas();
      }
    } catch (error) {
      console.error("Failed to clear canvas:", error);
    }
  };

  // predefined palette
  const palette = [
    "#000000",
    "#ffffff",
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#A3A3A3",
    "#F97316"
  ];

  return (
    <div className="fixed top-4 left-4 bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-lg z-10">
      <div className="flex items-center gap-3">
        {/* Drawing tools */}
        <div className="flex items-center gap-2">
          <IconButton
            onClick={() => setSelectedTool("line")}
            activated={selectedTool === "line"}
            icon={<Pencil className="w-4 h-4" />}
          />
          <IconButton 
            onClick={() => setSelectedTool("rect")}
            activated={selectedTool === "rect"} 
            icon={<RectangleHorizontalIcon className="w-4 h-4" />}
          />
          <IconButton 
            onClick={() => setSelectedTool("circle")}
            activated={selectedTool === "circle"} 
            icon={<Circle className="w-4 h-4" />}
          />
        </div>
        
        {/* Separator */}
        <div className="w-px h-6 bg-white/20" />

        {/* Undo button */}
        <button
          onClick={() => game?.undo()}
          className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-200 text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105"
        >
          Undo
        </button>

        {/* Color palette */}
        <div className="flex items-center gap-2">
          {palette.map((c) => (
            <button
              key={c}
              onClick={() => { setStrokeColor(c); game?.setStrokeColor(c); }}
              title={c}
              style={{ background: c }}
              className={"w-6 h-6 rounded-full border-2 " + (c.toLowerCase() === strokeColor.toLowerCase() ? "border-white" : "border-white/20")}
            />
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-white/20" />
        
        {/* Clear button */}
        <button 
          onClick={handleClear}
          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200 text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105"
        >
          Clear
        </button>
      </div>
    </div>
  );
}