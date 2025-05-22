import { backend_url } from "@/config";
import axios from "axios";
import { Shape } from ".";


export async function getExistingShapes(roomId: string) {
  const res = await axios.get(`${backend_url}/chats/${roomId}`);
  console.log("API response:", res.data); // Add this line
  const messages = res.data.messages || [];
  const shapes = messages
    .map((x: { message: string }) => {
      try {
        const messageData = JSON.parse(x.message);
        return messageData.shape;
      } catch (err) {
        console.error("Invalid message format:", x.message);
        return null;
      }
    })
    .filter((shape:any ): shape is Shape => shape !== null && shape !== undefined);
  return shapes;
}