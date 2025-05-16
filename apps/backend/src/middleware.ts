import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

 import { JWT_SECRET } from '@repo/common-backend/config';

export function middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers["authorization"] ?? "";

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: string };
        if (!decodedToken) {
            return res.status(403).json({
                message: "Unauthorized"
            });
        }
        (req as any).userId = decodedToken.userId;
        next();
    } catch (err) {
        res.status(403).json({
            message: "Unauthorized"
        });
    }
}