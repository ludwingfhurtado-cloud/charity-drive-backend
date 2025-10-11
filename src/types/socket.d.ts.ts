// src/types/socket.d.ts
declare module "socket.io-client" {
  import { ManagerOptions, SocketOptions } from "socket.io-client";
  import { DefaultEventsMap } from "socket.io/dist/typed-events";

  export interface Socket<
    ListenEvents extends Record<string, (...args: any[]) => void> = DefaultEventsMap,
    EmitEvents extends Record<string, (...args: any[]) => void> = ListenEvents
  > {
    id: string;
    connected: boolean;
    connect(): this;
    disconnect(): this;
    emit<Ev extends keyof EmitEvents>(
      ev: Ev,
      ...args: Parameters<EmitEvents[Ev]>
    ): this;
    on<Ev extends keyof ListenEvents>(
      ev: Ev,
      fn: ListenEvents[Ev]
    ): this;
  }

  export function io(
    uri: string,
    opts?: Partial<ManagerOptions & SocketOptions>
  ): Socket;
}
