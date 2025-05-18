import RoomCanvas from "@/app/components/RoomCanvas";

export default function CanvasPage({
  params,
}: {
  params: { roomid: string };
}) {
  const roomid = params.roomid;
  console.log("roomid: --", roomid);

  return <RoomCanvas roomId={roomid} />;
}