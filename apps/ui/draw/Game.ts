import { Tool } from "@/app/components/Canvas";
import { getExistingShapes } from "./http";

type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
    color?: string;
} | {
    type: "line";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color?: string;
}

export class Game {

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[]
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "circle";
    private strokeColor: string = "#3B82F6";
    private undoHistory: Shape[][] = [];

    socket: WebSocket;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }
    
    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler)

        this.canvas.removeEventListener("mouseup", this.mouseUpHandler)

        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler)
    }

    setTool(tool: "circle" | "line" | "rect") {
        this.selectedTool = tool;
    }

    setStrokeColor(color: string) {
        this.strokeColor = color;
    }

    undo() {
        if (this.undoHistory.length > 0) {
            this.existingShapes = this.undoHistory.pop() || [];
            this.clearCanvas();
            // Send undo state to other users
            this.socket.send(JSON.stringify({
                type: "undo",
                shapes: this.existingShapes,
                roomId: this.roomId
            }));
        }
    }

    saveToHistory() {
        // Keep only last 20 states to prevent memory issues
        if (this.undoHistory.length >= 20) {
            this.undoHistory.shift();
        }
        this.undoHistory.push([...this.existingShapes]);
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId);
        console.log( " printinf :",this.existingShapes);
        this.clearCanvas();
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type == "chat") {
                const parsedShape = JSON.parse(message.message)
                this.existingShapes.push(parsedShape.shape)
                this.clearCanvas();
            } else if (message.type === "clear") {
                // Handle clear message from websocket
                this.existingShapes = [];
                this.clearCanvas();
            } else if (message.type === "undo") {
                // Handle undo message from other users
                this.existingShapes = message.shapes || [];
                this.clearCanvas();
            }
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "black"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineWidth = 2;

        this.existingShapes.map((shape) => {
            if (shape.type === "rect") {
                 console.log(shape);
                this.ctx.strokeStyle = shape.color || this.strokeColor;
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === "circle") {
                 console.log(shape);

                this.ctx.strokeStyle = shape.color || this.strokeColor;
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();                
            }
            else if (shape.type === "line") {
                 console.log(shape);
            this.ctx.beginPath();
            this.ctx.strokeStyle = shape.color || this.strokeColor;
            this.ctx.moveTo(shape.startX, shape.startY);
            this.ctx.lineTo(shape.endX, shape.endY);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        })
    }

    mouseDownHandler = (e:any) => {
        this.clicked = true
        const rect = this.canvas.getBoundingClientRect();
        this.startX = e.clientX - rect.left
        this.startY = e.clientY - rect.top
    }
    mouseUpHandler = (e:any) => {
        this.clicked = false
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        const width = currentX - this.startX;
        const height = currentY - this.startY;

        // Save current state to history before adding new shape
        this.saveToHistory();

        const selectedTool = this.selectedTool;
        let shape: Shape | null = null;
        if (selectedTool === "rect") {

            shape = {
                type: "rect",
                x: this.startX,
                y: this.startY,
                height,
                width,
                color: this.strokeColor
            }
        } else if (selectedTool === "circle") {
            const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
            shape = {
                type: "circle",
                radius: radius,
                centerX: this.startX + width / 2,
                centerY: this.startY + height / 2,
                color: this.strokeColor
            }
        }
        else if (selectedTool === "line") {
      shape = {
        type: "line",
        startX: this.startX,
        startY: this.startY,
        endX: currentX,
        endY: currentY,
        color: this.strokeColor
      }
    }

        if (!shape) {
            return;
        }

        this.existingShapes.push(shape);

        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({
                shape
            }),
            roomId: this.roomId
        }))
    }
    mouseMoveHandler = (e:any) => {
        if (this.clicked) {
            const rect = this.canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            const width = currentX - this.startX;
            const height = currentY - this.startY;
            this.clearCanvas();
            this.ctx.strokeStyle = this.strokeColor;
            this.ctx.lineWidth = 2;
            const selectedTool = this.selectedTool;
            console.log(selectedTool)
            if (selectedTool === "rect") {
                this.ctx.strokeRect(this.startX, this.startY, width, height);   
            } else if (selectedTool === "circle") {
                this.ctx.strokeStyle = this.strokeColor;
                const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                const centerX = this.startX + width / 2;
                const centerY = this.startY + height / 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();                
            }
             else if (selectedTool === "line") {
               this.ctx.strokeStyle = this.strokeColor;
               this.ctx.beginPath();
               this.ctx.moveTo(this.startX, this.startY);
               this.ctx.lineTo(currentX, currentY); 
               this.ctx.stroke();
               this.ctx.closePath();
              }
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler)

        this.canvas.addEventListener("mouseup", this.mouseUpHandler)

        this.canvas.addEventListener("mousemove", this.mouseMoveHandler)    

    }
}