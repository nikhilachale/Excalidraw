export const websocket_url = process.env.NODE_ENV === 'production' 
  ? "wss://canvas-ws.onrender.com" 
  : "ws://localhost:8080";
export const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";