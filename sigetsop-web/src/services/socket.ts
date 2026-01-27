import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
let socket: Socket | null = null;

export function connectSocket(
  sessionToken: string,
  onMessage: (evt: any) => void,
) {
  socket = io(SOCKET_URL, { query: { session: sessionToken } });
  socket.on("connect", () => console.log("socket connected", socket?.id));
  socket.on("ocr_event", onMessage);
  socket.on("disconnect", () => console.log("socket disconnected"));
  return socket;
}

export function emit(event: string, data: any) {
  socket?.emit(event, data);
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
