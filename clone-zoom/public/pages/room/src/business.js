class Business {
    constructor({ room, media, view, socketBuilder, peerBuilder }) {
        this.room = room
        this.media = media
        this.view = view
        
        this.peerBuilder = peerBuilder
        this.socketBuilder = socketBuilder

        this.peers = new Map()

        this.currentStream = {}
        this.socket = {}
        this.currentPeer = {}
    }
    static initialize(deps) {
        const instance = new Business(deps)
        return instance._init()
    }
    async _init() {
        this.currentStream = await this.media.getCamera()
        this.socket = this.socketBuilder
            .setOnUserConnected(this.onUserConnected())
            .setOnUserDisconnected(this.onUserDisconnected())
            .build()


        //  this.socketBuilder.emit('join-room', this.room, 'teste01')
        this.currentPeer = await this.peerBuilder
            .setOnError(this.onPeerError())
            .setOnConnectionOpened(this.onPeerConnectionOpened())
            .setOnCallReceived(this.onPeerCallReceived())
            .setOnPeerStreamReceived(this.onPeerStreamReceived())
            .build()


        this.addVideoStream('test01')
    }

    addVideoStream(userId, stream = this.currentStream) {
        const isCurrentId = false
        this.view.renderVideo({
            userId,
            stream,
            muted: false,
            isCurrentId
        })
    }

    onUserConnected = function () {
        return userId => {
            console.log('user connected!', userId)
            this.currentPeer.call(userId, this.currentStream)
        }
    }

    onUserDisconnected = function () {
        return userId => {
            console.log('user disconnected!', userId)
        }
    }

    onPeerError = function () {
        return error => {
            console.log('error on peer!', error)
        }
    }

    onPeerConnectionOpened = function () {
        return (peer) => {
            const id = peer.id
            console.log("peer", peer)
            this.socket.emit('join-room', this.room, id)
        }
    }

    onPeerCallReceived = function () {
        return call => {
            console.log('answering call', call)
            call.answer(this.currentStream)
        }
    }

    onPeerStreamReceived = function () {
        return (call, stream) => {
            const callerId = call.peer
            this.addVideoStream(callerId, stream)
            this.peers.set(callerId, { call })
            this.view.setParticipants(this.peers.size)
        }
    }

}