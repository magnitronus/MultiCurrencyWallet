import WebSocket from 'ws';
import {wsMessagesClient, wsMessagesServer} from "./messages";
const CLIENT_TIMEOUT = 60 * 3;

const wss = new WebSocket.Server({ port: 8080 });

const peers = new Set();
let orders = [];

const clients = new Set();

const clientsInfo = {}

const broadcast = (message) => {
    clients.forEach((client) => {
        client.send(JSON.stringify(message));
    })
}

class MessageHandler {

    handlers = {
        [wsMessagesClient.PeerConnected]: this._handleNewPeer,
        [wsMessagesClient.PeerOrdersInit]: this._handlePeerOrders,
        [wsMessagesClient.Pong]: this._handleClientPong,
    }

    handleMessage = (client, message) => {
        const data = JSON.parse(message);
        const handler = this.handlers[data.type].bind(this)
        handler(client, data.data)
    }

    _handleClientPong(client, {peerId}) {
        const clientInfo = clientsInfo[peerId] || {client};
        clientInfo.lastSeen = new Date();
    }

    _handleNewPeer(client, {peerId}) {
        peers.add(peerId);
        clientsInfo[peerId] = {client, peerId}
        this.broadcast({type: wsMessagesClient.PeerConnected, data: {peerId}});
    }

    _handlePeerOrders(client, {peerId, orders: peerOrders}) {
        const ids = new Set();
        // unique orders by id
        orders = [...orders, ...peerOrders].filter((order) => {
            if (!ids.has(order.id)) {
                ids.add(order.id);
                return true
            }
            return false;
        })
        broadcast({type: wsMessagesClient.PeerOrdersInit, data: {peerId, orders: peerOrders}});
    }
}

const messageHandler = new MessageHandler();

wss.on('connection', function connection(ws) {
  clients.add(ws);

  ws.on('message', function incoming(message) {
    messageHandler.handleMessage(ws, message)
  });
  ws.send(JSON.stringify({type: wsMessagesServer.Peers, data: [...peers]}));
  ws.send(JSON.stringify({type: wsMessagesServer.Orders, data: [...orders]}));
});

setInterval(
    () => {
        clients.forEach((client) => {
            client.send(
                JSON.stringify({type: wsMessagesServer.Ping})
            )
        })
    },
  30000
)

setInterval(
    () => {
        peers.forEach((peerId) => {
            const clientInfo = clientsInfo[peerId];
            if (clientInfo) {
                const timeDiff = new Date() - clientInfo.lastSeen;
                if (timeDiff/1000 > CLIENT_TIMEOUT) {
                    broadcast({type: wsMessagesServer.PeerDisconnected})
                    clientInfo.client.disconnect();
                }
            }

        })
    },
  30000
)