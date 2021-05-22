import * as WebSocket from 'ws';
import { wsMessagesClient, wsMessagesServer } from './messages';

const CLIENT_TIMEOUT = 60 * 3;

const wss = new WebSocket.Server({ port: 8080 });

const clientsInfo: Record<string, { peerId?: string, orders: any[]}> = {}

const broadcast = (message) => {
    wss.clients.forEach((client) => {
        client.send(JSON.stringify(message));
    })
}

class MessageHandler {

    handlers = {
        [wsMessagesClient.PeerConnected]: this._handleNewPeer,
        [wsMessagesClient.PeerOrdersInit]: this._handlePeerOrders,
    }

    handleMessage = (client, message) => {
        const data = JSON.parse(message);
        const handler = this.handlers[data.type].bind(this)
        handler(client, data.data)
    }

    _handleNewPeer(client, {peerId}) {
        clientsInfo[client.id].peerId = peerId
        broadcast({type: wsMessagesClient.PeerConnected, data: {peerId}});
    }

    _handlePeerOrders(client, {peerId, orders: peerOrders}) {
        clientsInfo[client.id].orders = peerOrders;
        broadcast({
            type: wsMessagesClient.PeerOrdersInit,
            data: {peerId, orders: peerOrders}
        });
    }
}

const messageHandler = new MessageHandler();

wss.on('connection', function connection(ws) {
  ws.isAlive = true;
  clientsInfo[ws.id] = {orders: []};
  ws.on('message', function incoming(message) {
    messageHandler.handleMessage(ws, message)
  });
  const peers = Object.entries(clientsInfo).reduce((acc, [_, info]) => [...acc, info.peerId], []);
  const orders = Object.entries(clientsInfo).reduce((acc, [_, info]) => [...acc, ...info.orders], []);

  ws.send(JSON.stringify({type: wsMessagesServer.Peers, data: [...peers]}));
  ws.send(JSON.stringify({type: wsMessagesServer.Orders, data: [...orders]}));
});

setInterval(
    () => {
        wss.clients.forEach((client) => {
            if (client.isAlive === false) {
                broadcast({
                    type: wsMessagesServer.PeerDisconnected,
                    data: {peerId: clientsInfo[client.id].peerId}
                });
                delete clientsInfo[client.id];
                return client.terminate();
            }
            client.isAlive = false;
            client.ping();
        })
    },
  CLIENT_TIMEOUT / 2
)