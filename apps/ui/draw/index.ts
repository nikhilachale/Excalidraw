// import { backend_url } from "@/config";
// import axios from "axios";

import { backend_url } from "@/config";
import axios from "axios";




// export async function Draw(canvas: HTMLCanvasElement,roomId:string,socket:WebSocket) {
//   if(!socket)
//   {
//     console.error("WebSocket is not initialized.");
//   }
//   if(socket)
//   {
//     console.log("WebSocket is initialized.");
//   }
//   const ctx = canvas.getContext("2d");
//   console.log("i am in draw")
//   if (!ctx) return;




//   socket.onmessage = (event) => { 
//     console.log("message received");
//     const message = JSON.parse(event.data);
//     if(message.type==="chat")
//     {
//       const parsedMessage = JSON.parse(message.message);
//       existingShapes.push(parsedMessage.shape);
//       clearCanvas(existingShapes, ctx, canvas);
//     }
//   }

//   let existingShapes: Shape[] = await getExistingShapes(roomId)
//   socket.onmessage = (event) => {
//         const message = JSON.parse(event.data);

//         if (message.type == "chat") {
//             const parsedShape = JSON.parse(message.message)
//             existingShapes.push(parsedShape.shape)
//            clearCanvas(existingShapes, ctx, canvas);
//         }
//     }
//   clearCanvas(existingShapes, ctx, canvas);
//     let clicked = false;
//     let startX = 0;
//     let startY = 0;


//   const handleMouseDown = (e: MouseEvent) => {
//     clicked = true;
//     startX = e.offsetX;
//     startY = e.offsetY;
//   };

//   const handleMouseUp = (e: MouseEvent) => {
//      if(socket)
//   {
//     console.log("WebSocket is initialized.");
//   }
//     if (!clicked) return;
//     clicked = false;

//     const width = e.offsetX - startX;
//     const height = e.offsetY - startY;

//     // Save as rectangle by default (you can expand to support current mode)
//     existingShapes.push({
//       type: "rect",
//       x: startX,
//       y: startY,
//       width,
//       height,
//     });

//     clearCanvas(existingShapes, ctx, canvas);

//     socket.send(JSON.stringify({
//       type:"chat",
//       message: JSON.stringify({
//         type: "rect",
//         x: startX,
//         y: startY,
//         width,
//         height,
//       }),
//       roomId: roomId
//     }))
//   };

//   const handleMouseMove = (e: MouseEvent) => {
//     if (!clicked) return;

//     const width = e.offsetX - startX;
//     const height = e.offsetY - startY;

//     // Preview current drawing
//     ctx.fillStyle = "black";
//     ctx.strokeStyle = "white";
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.fillRect(0, 0, canvas.width, canvas.height);

//     // Redraw existing shapes
//     existingShapes.forEach((shape) => {
//       if (shape.type === "rect") {
//         ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
//       } else if (shape.type === "circle") {
//         ctx.beginPath();
//         ctx.arc(shape.centerx, shape.centery, shape.radius, 0, Math.PI * 2);
//         ctx.stroke();
//       }
//     });

//     // Draw new preview shape
//     ctx.strokeRect(startX, startY, width, height);
//   };

//   canvas.addEventListener("mousedown", handleMouseDown);
//   canvas.addEventListener("mouseup", handleMouseUp);
//   canvas.addEventListener("mousemove", handleMouseMove);

//   // Optional cleanup return
//   return () => {
//     canvas.removeEventListener("mousedown", handleMouseDown);
//     canvas.removeEventListener("mouseup", handleMouseUp);
//     canvas.removeEventListener("mousemove", handleMouseMove);
//   };
// }

// // Function to clear and redraw all shapes
// function clearCanvas(

//   existingShapes: Shape[],
//   ctx: CanvasRenderingContext2D,
//   canvas: HTMLCanvasElement
// ) 
// {
//   console.log("clearing canvas");
//   ctx.clearRect(0, 0, canvas.width, canvas.height);
//   ctx.fillStyle = "black";
//   ctx.fillRect(0, 0, canvas.width, canvas.height);
//   ctx.strokeStyle = "white";

//   existingShapes.forEach((shape) => {
//     if (shape.type === "rect") {
//       ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
//     } else if (shape.type === "circle") {
//       ctx.beginPath();
//       ctx.arc(shape.centerx, shape.centery, shape.radius, 0, Math.PI * 2);
//       ctx.stroke();
//     }
//   });
// }

// export  async function getExistingShapes(roomId: string) {
//   const res = await axios.get(`${backend_url}/chats/${roomId}`);
//   const messages = res.data.messages; // Fixed typo: `message` -> `messages`

//   const shapes = messages.map((x: { message: string }) => {
//     const messageData = JSON.parse(x.message); // Fixed typo: `messgaeData` -> `messageData`
//     return messageData.shape;
//   });

//   return shapes; // Return the parsed shapes
// }

type Shape =
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
  };

export async function Draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {


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
    const SHAPE: Shape = {
      type: "rect",
      x: startX,
      y: startY,
      width,
      height,
    };
    existingShapes.push(SHAPE);

   socket.send(JSON.stringify({
  type: "chat",
  message: JSON.stringify({
    shape: SHAPE
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
      ctx.strokeRect(startX, startY, width, height);
    }
  })
}
function clearCanvas(
  existingShapes: Shape[],
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "blue"; // Changed to blue
  ctx.lineWidth = 2;        // Increased stroke width

  existingShapes.forEach((shape) => {
    if (shape.type === "rect") {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === "circle") {
      ctx.beginPath();
      ctx.arc(shape.centerx, shape.centery, shape.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
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
    .filter((shape:any ): shape is Shape => shape !== null && shape !== undefined);
  return shapes;
}