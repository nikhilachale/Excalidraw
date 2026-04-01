import { z } from "zod";

export const CreateUserSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string(),
    name: z.string()
})

export const SigninSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string(),
})

export const CreateRoomSchema = z.object({
    name: z.string().min(3).max(20),
})

export const RoomSummarySchema = z.object({
    id: z.number().int(),
    slug: z.string(),
})

export const CreateRoomResponseSchema = z.object({
    roomId: z.number().int(),
    slug: z.string(),
})

export const RoomLookupResponseSchema = z.object({
    message: z.string(),
    data: RoomSummarySchema,
})

export type RoomSummary = z.infer<typeof RoomSummarySchema>
export type CreateRoomResponse = z.infer<typeof CreateRoomResponseSchema>
export type RoomLookupResponse = z.infer<typeof RoomLookupResponseSchema>