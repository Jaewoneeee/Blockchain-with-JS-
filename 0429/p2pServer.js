// 다른 노드와 통신을 위한 서버  // 원장공유
// peer to peer / node 대 node / 개인과 개인
// 서로 필요한 정보들을 서로서로 공유하는 탈중앙화 시스템

import WebSocket from 'ws';
import { WebSocketServer } from 'ws' 

// 메세지 타입 
const MessageType = {
    RESPONCE_MESSAGE : 0,  // 메세지 받을때
    SENT_MESSAGE : 1       // 메세지 보낼때

    // 최신 블록 요청 
    // 모든 블록 요청
    // 블록 전달 
}


// 아래 매개변수 ws가 계속 늘어나기 때문에 저장해줄 자료구조를 만들어보자
// 지금 sockets가 가르키는건 빈 배열이 담긴 주소값. 따라서 안에 data에 push로 추가되고 바뀌는건 크게 상관이 없다 
const sockets = [];

// 소켓 확인 하는거 추가
const getPeers = () => {
    return sockets
}

// 연결되는걸 확인하는거지 
const initP2PServer = (p2pPort) => {
    const server = new WebSocketServer({port:p2pPort});

    // websocket 내에서 일어나는 event는 정의되어 있다. 그 이벤트가 발생했을때 우리는 어떤 함수를 실행(호출)할 것인지 정해주면 된다. 
    server.on('connection', (ws) => {
        initConnection(ws) // 만들어야할 함수
        console.log('똑똑. 누가 방문함')
    })
    console.log('listening P2PServer Port : ', p2pPort);
}

const initConnection = (ws) => {
    sockets.push(ws)
    initMessageHandler(ws) // 메세지 핸들러는 여기서 호출!
}

// 다른사람의 정보를 가지고 접속할 수 있는 환경
// 새로운 ip와 peer를 받아서 웹소켓에 넣어주고, open이 된다면 웹소켓에 추가해주기
const connectionToPeer = (newPeer) => {
    const ws = new WebSocket(newPeer); 
    ws.on('open', () => { initConnection(ws); console.log('Connect peer : ', newPeer);})  
    ws.on('error', () => { console.log('fail to connection peer : ', newPeer);})
}

// 내가 서버도 되고, 클라이언트도 된 상태네
// 서로 통신을 위해 신호가 간거지. 
// 웹소켓 연결시 콜솔로 확인이 가능했고, 누가 내걸 연결했을때도 마찬가지. 
// sockets 배열안에 차곡차곡 ws가 쌓인거지 
//====
                           // initConnection이 일어날때 등록? 매개변수로 들어갔던 ws주소 
const initMessageHandler = (ws) => {
    ws.on('message', (data) => {  // 메세지가 있으면 data가 있다 / 저 message란 이벤트가 발동되면 밑에 함수를 발동해라
        const message = JSON.parse(data) // 그 데이터를 JSON 형태로 바꿔주기

        switch(message.type)
        {
            // case MessageType.RESPONCE_MESSAGE:  // 메시지 받았을 때 
            //     break;
            case MessageType.SENT_MESSAGE: // 메시지 보낼 때
                console.log(message.message);
                //write(ws, message); // 보내는 함수는 여기서 호출!
                break;

                // 다른사람이 보낼때 SEND_message로 보내고있고
                // 나도 받을때 SEND_MESSAGE로 받고 있다 그래서 사실상 위에 RESPONCE가 없다 
                // 다른사람이 본내거를 보는거라서 send_message로 되어있음. 헷갈릴수 있으니 주의 
        }
    })
}

const write = (ws, message) => {
    console.log('write()', message)
    ws.send(JSON.stringify(message))    // send함수를 사용하여 보내기 / JSON형태를 문자열로 stringfy
}   // 뒤 메세지를 앞 웹소켓에 보낸다 
   // 상대방 ws  send시 이벤트발생

const sendMessage = (message) => {
    sockets.forEach( (socket) => {   // sockets에서 하나씩 돌아가는게 socket 헷갈리지 말자
        write(socket, message);  // 내가연결하고 있는 모든 소켓에게 write함수 실행 (broadcast)
    });
}

// 이 메세지를 보내는 구조가 좀 헷갈림

export { initP2PServer, connectionToPeer, getPeers, sendMessage }