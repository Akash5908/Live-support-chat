import { WebSocket } from "ws";

declare global {
  namespace WebSocket {
    interface Server {
      clients: Set<WebSocket & { userId?: string; role?: string }>;
    }
  }
}

// Module augmentation
declare module "ws" {
  interface WebSocket {
    userId?: string;
    role?: string;
  }
}

export {};
