import axios from "axios";
import { backend_url } from "../../config";
import { ChatRoom } from "../../../components/ChatRoom";

async function getRoomId(slug: string) {
    try {
        const response = await axios.get(`${backend_url}/room/${slug}`);
        return response.data.room.id;
    } catch (error) {
        console.error("Room not found:", error);
        throw new Error("Room not found");
    }
}

export default async function ChatRoom1(
    {
        params
    }: {
        params: {
            slug: string
        }
    }
) {
    try {
        const slug =   params.slug;
        const roomId = await getRoomId(slug);
        return <ChatRoom id={roomId} />;
    } catch (error) {
        return <div>Room not found</div>;
    }
}



