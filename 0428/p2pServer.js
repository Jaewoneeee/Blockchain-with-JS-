// 다른 노드와 통신을 위한 서버 
// peer to peer / node 대 node / 개인과 개인
// 서로 필요한 정보들을 서로서로 공유하는 탈중앙화 시스템

import WebSocket from 'ws';
import { WebSocketServer } from 'ws' 

// 아래 매개변수 ws가 계속 늘어나기 때문에 저장해줄 자료구조를 만들어보자
// 지금 sockets가 가르키는건 빈 배열이 담긴 주소값. 따라서 안에 data에 push로 추가되고 바뀌는건 크게 상관이 없다 
const sockets = [];

const initP2PServer = (p2pPort) => {
    const server = new WebSocketServer({port:p2pPort});

    // websocke 내에서 일어나는 event는 정의되어 있다. 그 이벤트가 발생했을때 우리는 어떤 함수를 실행(호출)할 것인지 정해주면 된다. 
    server.on('connection', (ws) => {
        initConnection(ws) // 만들어야할 함수
    })
    console.log('listening P2PServer Port : ', p2pPort);
}

const initConnection = (ws) => {
    sockets.push(ws)
}

export { initP2PServer }