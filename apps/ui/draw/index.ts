import { backend_url } from "@/config";
import axios from "axios";





export type Shape =
  | {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
  }
  | {
    type: "circle";
    centerx: number;
    centery: number;
    radius: number;
  }
  | {
    type: "line";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }

  ;

export async function Draw(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.error("Canvas context is not available.");
    return;
  }

  let existingShapes: Shape[] = await getExistingShapes(roomId);


  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type == "chat") {
      const parsedShape = JSON.parse(message.message)
      existingShapes.push(parsedShape.shape)
      clearCanvas(existingShapes, ctx, canvas);
    }

  }
  clearCanvas(existingShapes, ctx, canvas);
  let clicked = false;
  let startX = 0;
  let startY = 0;


  canvas.addEventListener("mousedown", (e) => {
    clicked = true;
    startX = e.clientX;
    startY = e.clientY;

  })


  canvas.addEventListener("mouseup", (e) => {
    clicked = false;
    const width = e.clientX - startX;
    const height = e.clientY - startY;
    //@ts-ignore
    const selectedTool = window.selectedTool;
    let shape: Shape | null = null;
    if (selectedTool === "rect") {

      shape = {
        type: "rect",
        x: startX,
        y: startY,
        height,
        width
      }
    } else if (selectedTool === "circle") {
      const radius = Math.max(width, height) / 2;
      shape = {
        type: "circle",
        radius: radius,
        centerx: startX + radius,
        centery: startY + radius,
      }
    }
    else if (selectedTool === "line") {
      shape = {
        type: "line",
        startX: startX,
        startY: startY,
        endX: e.clientX,
        endY: e.clientY
      }
    }
    if (!shape) {
      return;
    }
    existingShapes.push(shape);

    socket.send(JSON.stringify({
      type: "chat",
      message: JSON.stringify({
        shape: shape
      }),
      roomId
    }))

    clearCanvas(existingShapes, ctx, canvas);
  });


  canvas.addEventListener("mousemove", (e) => {
    if (clicked) {
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const width = currentX - startX;
      const height = currentY - startY;

      clearCanvas(existingShapes, ctx, canvas); // clear before drawing preview
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
       // @ts-ignore
      const selectedTool = window.selectedTool;
            if (selectedTool === "rect") {
                ctx.strokeRect(startX, startY, width, height);   
            }
            else if (selectedTool === "circle") {
              {
                ctx.strokeStyle = "blue";
                 const radius = Math.max(width, height) / 2;
                const centerX = startX + radius;
                const centerY = startY + radius;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.closePath();  
              }
            }
              else if (selectedTool === "line") {
                ctx.strokeStyle = "blue";
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(currentX, currentY);
                ctx.stroke();
                ctx.closePath();
              }
    }
  })
}


export function clearCanvas(
  existingShapes: Shape[],
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "blue"; // Changed to blue
  ctx.lineWidth = 2;        // Increased stroke width

   existingShapes.map((shape) => {
        if (shape.type === "rect") {
           ctx.strokeStyle = "blue";
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        } else if (shape.type === "circle") {
            ctx.strokeStyle = "blue";
            ctx.beginPath();
            ctx.arc(shape.centerx, shape.centery, Math.abs(shape.radius), 0, Math.PI * 2);
            ctx.stroke();
            ctx.closePath();                
        }
        else if (shape.type === "line") {
            ctx.beginPath();
            ctx.moveTo(shape.startX, shape.startY);
            ctx.lineTo(shape.endX, shape.endY);
            ctx.stroke();
            ctx.closePath();
        }
    })
}


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
    .filter((shape: any): shape is Shape => shape !== null && shape !== undefined);
  return shapes;
}