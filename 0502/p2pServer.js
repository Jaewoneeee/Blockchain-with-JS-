// 다른 노드와 통신을 위한 서버  // 원장공유
// peer to peer / node 대 node / 개인과 개인
// 서로 필요한 정보들을 서로서로 공유하는 탈중앙화 시스템

import WebSocket from 'ws';
import { WebSocketServer } from 'ws' 
import { getBlocks, getLatestBlock, createBlock, addBlock, isValidNewBlock } from './block.js'

// 메세지 타입 
const MessageType = {
    //RESPONCE_MESSAGE : 0,  // 메세지 받을때
    //SENT_MESSAGE : 1       // 메세지 보낼때

    // 최신 블록 요청 
    QUERY_LATEST : 0,
    // 모든 블록 요청
    QUERY_ALL : 1,
    // 블록 전달 
    RESPONSE_BLOCKCHAIN : 2    
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

    write(ws, queryAllMessage());
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
//=====

// 여기는 상대방 코드에서 발생하는거다 
                           // initConnection이 일어날때 등록? 매개변수로 들어갔던 ws주소 
const initMessageHandler = (ws) => {
    ws.on('message', (data) => {  // 밑에서 send를 해서 message가 발생. 어떤 data가 온거지  / 저 message란 이벤트가 발동되면 밑에 함수를 발동해라
        const message = JSON.parse(data) // 그 데이터를 JSON 형태로 바꿔주기

        switch(message.type)
        {
            case MessageType.QUERY_LATEST:  // 블럭을 받는코드 
                console.log(responseLatestMessage())
                break;
            case MessageType.QUERY_ALL: // 니 블럭좀 달라고 요청하는거 (비교를해야하니까?)
                write(ws, responseAllMessage());
                break;
            case MessageType.RESPONSE_BLOCKCHAIN: //  상대방이 주는 블록을 받는거.(비교한다음에 나한테 주겠지) 누가 블럭을 보내줬다. 즉 나는 받은 상태. 
                console.log(ws._socket.remoteAddress, ' : ', message.data);
                //handleBlockChainResponse(message);
                replaceBlockchain(message.data);
                break;
        }
    })
}

// 올바른 데이터를 가진 블록인지 검증하기
const isValidBlockchain = (receiveBlochain) => {
    // 같은 제네시스 블록인가
    if (JSON.stringify(receiveBlochain[0]) !== JSON.stringify(getBlocks()[0])){
        console.log(receiveBlochain[0] , "내거")
        console.log(getBlocks()[0] , "남거")
        return false
    }
    
    // 체인 내의 모든 블록을 확인
    let tempBlock = receiveBlochain[0];
    for (let i = 1; i < receiveBlochain.length; i++)
    {
        if (isValidNewBlock(receiveBlochain[i], receiveBlochain[i - 1]) == false)
        {
            return false
        }
    }

    return true
}

const replaceBlockchain = (receiveBlochain) => {
    if (isValidBlockchain(receiveBlochain))
    {
        let blocks = getBlocks();
        if (receiveBlochain.length > getBlocks().length)
        {
            console.log("길이가 짧다")
            blocks = receiveBlochain;
        }
        else if (receiveBlochain.length == getBlocks().length && random.boolean())
        {
            console.log("길이가 같다")
            blocks = receiveBlochain;
        }
    }
    else {
        console.log('받은 블록체인에 문제가 있음')
    }
} 

// 블록 바꾸기
const handleBlockChainResponse = (receiveBlochain) => {
    // 받은 블록체인이 현재 블록체인보다 짧다면 안바꿈 

    // 받은 블록체인이 현재 블록체인과 같다면 바꾸거나 안바꿈 // 섞는데 의의를 둔다. 

    // 받은 블록체인이 현재 블록체인보다 길면 바꿈
}

// 다른 노드한테 마지막 블록을 요청하는 함수
const queryLatestMessage = () => {  
    return ({ 
          "type" : MessageType.QUERY_LATEST,
          "data" : null })  // 나는 줄게없고 요청만하니까 null
}

// 다른 노드한테 전체 블록을 요청하는 함수
const queryAllMessage = () => {
    return ({ 
          "type" : MessageType.QUERY_ALL,
          "data" : null })
}

// 요청을 받았을때, 마지막블록을 요청한 쪽에 보내는 함수
const responseLatestMessage = () => {
    return ({ 
        "type" : MessageType.RESPONSE_BLOCKCHAIN,
        "data" : JSON.stringify( getLatestBlock() /* 내가 가지고 있는 체인의 마지막 블록*/) })    
}

// 요청을 받았을때, 전체블록을 요청한 쪽에 보내는 함수
const responseAllMessage = () => {
    return ({ 
        "type" : MessageType.RESPONSE_BLOCKCHAIN,
        "data" : JSON.stringify( getBlocks() /* 내가 가지고 있는 전체 블록*/) })    
}


// 여기는 나의 상태, 코드에서 발생하는거고 
const write = (ws, message) => {
    console.log('write()', message)
    ws.send(JSON.stringify(message))    // send함수를 사용하여 보내기 / JSON형태를 문자열로 stringfy
}   // 뒤 메세지를 앞 웹소켓에 보낸다 
   // 상대방 ws  send시 이벤트발생

const broadcasting = (message) => {
    sockets.forEach( (socket) => {   // sockets에서 하나씩 돌아가는게 socket 헷갈리지 말자
        write(socket, message);  // 내가연결하고 있는 모든 소켓에게 write함수 실행 (broadcast)
    });
}

// 내가 새로운 블록을 채굴했을 때 연결된 노드들에게 전파
// 사실상 정리하는 함수. 원래 block.js에 있었는데 구조가 여러군데 겹쳐지기 때문에 p2p서버쪽에서 합쳐서 한다.
const mineBlock = (blockData) => {
    const newBlock = createBlock(blockData);
    if (addBlock(newBlock, getLatestBlock()))
    {
        // 전파 
        broadcasting(responseLatestMessage());
        // responseLatestMessage 는 그냥 값을 return만해주는거기 때문에
        // 여기서 받아온 값을 broadcasting함수에 매개변수로 넣기 

        //return true;
    }
    return false;
}



export { initP2PServer, connectionToPeer, getPeers, broadcasting, mineBlock }