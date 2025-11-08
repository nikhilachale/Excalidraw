import RoomCanvas from "@/app/components/RoomCanvas";

export default async function CanvasPage(props: { params: Promise<{ roomid: string }> }) {
  const { roomid } = await props.params;
  return <RoomCanvas roomId={roomid} />;
}