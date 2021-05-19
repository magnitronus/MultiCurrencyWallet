import EventEmitter from 'events';
import {wsMessagesClient, wsMessagesServer} from "common/messaging/pubsubRoom/wsCache/messages";

class PeersInfo {
  _wsc: WebSocket;
  _peers = [];
  _orders = [];
  _currentPeer: string;
  emitter = new EventEmitter()

  init() {
    this._wsc = new WebSocket('ws://localhost:8080/');
    this._wsc.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === wsMessagesServer.Peers) {
        this._peers = data.data
      } else if (data.type === wsMessagesServer.Orders) {
        this._orders = data.data
      }
      this.emitter.emit(data.type, data.data);
    }
  }

  _sendData(data: Record<string, any>) {
    this._wsc.send(JSON.stringify(data));
  }

  getPeers() {
    return this._peers;
  }

  setCurrentPeerId(peerId: string) {
    this._currentPeer = peerId;
    this._sendData({type: wsMessagesClient.PeerConnected, data: {peerId}})
  }

  sendMyOrders(orders) {
    this._sendData({type: wsMessagesClient.PeerOrdersInit, data: {peerId: this._currentPeer, orders}})
  }

}

const peersInfo = new PeersInfo();
peersInfo.init()

export default peersInfo;