import { Module } from '@nestjs/common';
import { ProjectWebSocketGateway } from './websocket.gateway';

@Module({
  providers: [ProjectWebSocketGateway],
  exports: [ProjectWebSocketGateway],
})
export class WebSocketModule {}