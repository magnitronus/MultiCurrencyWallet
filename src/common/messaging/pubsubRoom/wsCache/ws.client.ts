import EventEmitter from 'events';
import {wsMessagesClient, wsMessagesServer} from "common/messaging/pubsubRoom/wsCache/messages";

class PeersInfo {
  _wsc: WebSocket;
  _peers: string[] = [];
  _orders: any[] = [];
  _currentPeer: string;
  emitter = new EventEmitter()

  handlers = {
    [wsMessagesServer.Peers]: (peers) => this._peers = peers,
    [wsMessagesServer.Orders]: (orders) => this._orders = orders,
    [wsMessagesClient.PeerConnected]: ({peerId}) => this._peers = [...this._peers, peerId],
    [wsMessagesClient.PeerOrdersInit]: ({orders}) => this._orders = [...this._orders, ...orders]
  };

  private _getHandler(dataType) {
    const handler = this.handlers[dataType];
      if (handler === undefined) {
        throw(`Unknown message type: ${dataType}`);
      }
      return handler.bind(this)
  }

  private _sendData(data: Record<string, any>) {
    this._wsc.send(JSON.stringify(data));
  }

  init() {
    this._wsc = new WebSocket('ws://localhost:8080/');
    this._wsc.onmessage = (message) => {
      const data = JSON.parse(message.data);
      const handler = this._getHandler(data.type);
      handler(data.data);
      this.emitter.emit(data.type, data.data);
    }
  }

  getPeers() {
    return this._peers;
  }

  setCurrentPeerId(peerId: string) {
    this._currentPeer = peerId;
    debugger;
    this._sendData({type: wsMessagesClient.PeerConnected, data: {peerId}})
  }

  sendMyOrders(orders) {
    this._sendData({type: wsMessagesClient.PeerOrdersInit, data: {peerId: this._currentPeer, orders}})
  }

}

const peersInfo = new PeersInfo();
peersInfo.init()

export default peersInfo;