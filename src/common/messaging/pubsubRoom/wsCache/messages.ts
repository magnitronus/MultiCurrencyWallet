
export enum wsMessagesClient {
    PeerConnected = 'PeerConnected',
    PeerDisconnected = 'PeerDisconnected',
    PeerOrdersInit = 'PeerOrdersInit',
    OrderAdded = 'OrderAdded',
    OrderRemoved = 'OrderRemoved',
    Pong = 'Pong',
}

export enum wsMessagesServer {
    Peers = 'Peers',
    Orders = 'Orders',
    Ping = 'Ping',
    PeerDisconnected = 'PeerDisconnected'
}