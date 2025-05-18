import { useEffect, useState } from "react";
import { websocket_url } from "../config";
export function useSocket() {
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket | null>(null); 

    useEffect(() => {
        const ws = new WebSocket(`${websocket_url}?token`);
        ws.onopen = () => {
            setLoading(false);
            setSocket(ws);
        };

        ws.onclose = () => {
            setLoading(true);
            setSocket(null);
        };

        return () => {
            ws.close(); 
        };
    }, []);

    return {
        socket,
        loading,
    };
}