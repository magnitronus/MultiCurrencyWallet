import EventEmitter from 'events';


class MessageHandler {

  handle = (message) => {
    console.log('WS MSG!!!!!!!!!!!!', message);
  }

}

class PeersInfo {
  _wsc: WebSocket;
  _messageHandler: MessageHandler;
  _peers = [];
  _orders = [];
  _currentPeer: string;
  emitter = new EventEmitter()

  init() {
    this._wsc = new WebSocket('ws://localhost:8080/');
    this._messageHandler = new MessageHandler();
    this._wsc.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === 'Peers') {
        this._peers = data.data
      } else if (data.type === 'Orders') {
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
    this._sendData({type: 'NewPeer', data: {peerId}})
  }

  sendMyOrders(orders) {
    this._sendData({type: 'PeerOrders', data: {peerId: this._currentPeer, orders}})
  }

}

const peersInfo = new PeersInfo();
peersInfo.init()

export default peersInfo;