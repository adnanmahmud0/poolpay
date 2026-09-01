import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { envVars } from "../config/env";
import { chatHandler } from "./chat.handler";
import { verifyToken } from "../utils/jwt";
import { JwtPayload } from "jsonwebtoken";

let io: Server;

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: [envVars.FRONTEND_URL, "*"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const accessToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
      
      const decoded = verifyToken(
        accessToken,
        envVars.JWT_ACCESS_SECRET
      ) as JwtPayload;

      if (!decoded || !decoded.userId) {
        return next(new Error("Authentication error: Invalid token"));
      }

      socket.data.userId = decoded.userId;
      next();
    } catch (error) {
      console.error("Socket Auth Error:", error);
      next(new Error("Authentication error: Failed to verify token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`🔌 User ${userId} connected to socket: ${socket.id}`);

    // Join a private room for this user to receive personal notifications
    socket.join(userId);

    // Attach handlers
    chatHandler(io, socket);

    socket.on("disconnect", () => {
      console.log(`🔌 User ${userId} disconnected: ${socket.id}`);
    });
  });

  console.log("✅ Socket.IO initialized successfully!");
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
