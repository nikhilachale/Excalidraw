import { z } from 'zod';

// Sanitize HTML and potential XSS content
function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove inline event handlers
    .trim()
    .substring(0, 10000); // Limit length
}

// Schema for join_room event
export const JoinRoomSchema = z.object({
  type: z.literal('join_room'),
  roomId: z.union([
    z.string().regex(/^\d+$/, 'Room ID must be a number string'),
    z.number().int().positive()
  ]).transform(val => String(val)),
});

// Schema for leave_room event
export const LeaveRoomSchema = z.object({
  type: z.literal('leave_room'),
  roomId: z.union([
    z.string().regex(/^\d+$/, 'Room ID must be a number string'),
    z.number().int().positive()
  ]).transform(val => String(val)),
});

// Schema for chat event
export const ChatSchema = z.object({
  type: z.literal('chat'),
  roomId: z.union([
    z.string().regex(/^\d+$/, 'Room ID must be a number string'),
    z.number().int().positive()
  ]).transform(val => String(val)),
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message too long')
    .transform(sanitizeString),
});

// Schema for clear event
export const ClearSchema = z.object({
  type: z.literal('clear'),
  roomId: z.union([
    z.string().regex(/^\d+$/, 'Room ID must be a number string'),
    z.number().int().positive()
  ]).transform(val => String(val)),
});

// Union schema for all WebSocket events
export const WebSocketEventSchema = z.discriminatedUnion('type', [
  JoinRoomSchema,
  LeaveRoomSchema,
  ChatSchema,
  ClearSchema,
]);

export type WebSocketEvent = z.infer<typeof WebSocketEventSchema>;
export type JoinRoomEvent = z.infer<typeof JoinRoomSchema>;
export type LeaveRoomEvent = z.infer<typeof LeaveRoomSchema>;
export type ChatEvent = z.infer<typeof ChatSchema>;
export type ClearEvent = z.infer<typeof ClearSchema>;
