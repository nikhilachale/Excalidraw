
import RoomCanvas from "@/app/components/RoomCanvas";

export default function CanvasPage(
  {
    params
  }:{
    params: { roomid: string };
  }
) {

  const roomId = params.roomid;
  console.log("roomid: --", roomId);
 return <RoomCanvas roomId={roomId} />;
  
}