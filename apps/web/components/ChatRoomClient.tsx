"use client";

import { useState, useEffect } from "react";
import { useSocket } from "../app/hooks/useSocket";

export function ChatRoomClient({
    messages,
    id,
}: {
    messages: { message: string }[];
    id: string;
}) {
    const [chats, setChats] = useState(messages); // Chats state to hold the history
    const [currentMessage, setCurrentMessage] = useState(""); // State for current message input
    const { socket, loading } = useSocket(); // Use the correct destructuring

    useEffect(() => {
        if (socket && !loading) {
            // Join the room on socket connection
            socket.send(
                JSON.stringify({
                    type: "join_room",
                    roomId: id,
                })
            );

            // Listen for incoming messages
            socket.onmessage = (event) => {
                const parsedData = JSON.parse(event.data);
                if (parsedData.type === "chat") {
                    // Add incoming message to chat history
                    setChats((prevChats) => [
                        ...prevChats,
                        { message: parsedData.message },
                    ]);
                }
            };
        }

        // Cleanup function to avoid memory leaks
        return () => {
            if (socket) {
                socket.onmessage = null; // Remove the event listener when component unmounts
            }
        };
    }, [socket, loading, id]);

    const handleSendMessage = () => {
        if (currentMessage.trim()) {
            socket?.send(
                JSON.stringify({
                    type: "chat",
                    message: currentMessage,
                })
            );
            setChats((prevChats) => [
                ...prevChats,
                { message: currentMessage },
            ]);
            setCurrentMessage(""); // Clear input after sending
        }
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                fontFamily: "Arial, sans-serif",
                backgroundColor: "#f9f9f9",
                borderRadius: "10px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                maxWidth: "500px",
                margin: "20px auto",
            }}
        >
            <h1
                style={{
                    fontSize: "24px",
                    color: "#333",
                    marginBottom: "20px",
                }}
            >
                Chat Room {id}
            </h1>
            <div
                style={{
                    width: "100%",
                    height: "300px",
                    overflowY: "auto",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    padding: "10px",
                    marginBottom: "20px",
                }}
            >
                {chats.map((chat, index) => (
                    <div
                        key={index}
                        style={{
                            padding: "8px",
                            marginBottom: "5px",
                            backgroundColor: "rgb(55,129,120)",
                            borderRadius: "5px",
                        }}
                    >
                        {chat.message}
                    </div>
                ))}
            </div>
            <div
                style={{
                    display: "flex",
                    width: "100%",
                    gap: "10px",
                }}
            >
                <input
                    style={{
                        flex: 1,
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "5px",
                        fontSize: "16px",
                    }}
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    type="text"
                    placeholder="Type your message"
                />
                <button
                    onClick={handleSendMessage}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "16px",
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
}
