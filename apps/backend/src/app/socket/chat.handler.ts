import { Server, Socket } from "socket.io";
import { ChatMessage, MessageType } from "../modules/chat/chat.model";
import { Types } from "mongoose";

export const chatHandler = (io: Server, socket: Socket) => {
  socket.on("joinGroupRoom", (groupId: string) => {
    socket.join(groupId);
    console.log(`🔌 Socket ${socket.id} joined group ${groupId}`);
  });

  socket.on("leaveGroupRoom", (groupId: string) => {
    socket.leave(groupId);
    console.log(`🔌 Socket ${socket.id} left group ${groupId}`);
  });

  socket.on(
    "sendMessage",
    async (data: {
      groupId: string;
      senderId: string;
      message: string;
      messageType?: MessageType;
    }) => {
      try {
        // Save message to DB
        const newMsg = await ChatMessage.create({
          groupId: new Types.ObjectId(data.groupId),
          senderId: new Types.ObjectId(data.senderId),
          message: data.message,
          messageType: data.messageType || MessageType.TEXT,
        });

        // Broadcast to group room
        io.to(data.groupId).emit("receiveMessage", newMsg);
      } catch (error) {
        console.error("Socket Send Message Error:", error);
      }
    }
  );

  socket.on("typing", (data: { groupId: string; senderId: string }) => {
    socket.to(data.groupId).emit("typing", { senderId: data.senderId });
  });

  socket.on("stopTyping", (data: { groupId: string; senderId: string }) => {
    socket.to(data.groupId).emit("stopTyping", { senderId: data.senderId });
  });
};
