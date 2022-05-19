// peer to peer
// 다른 노드와 통신을 위한 서버

import WebSocket from "ws";
// import random from "random";
import { WebSocketServer } from "ws";
import { getBlocks, getLatestBlock, addBlock ,createBlock , replaceBlockchain } from "./block.js"
import { getTransactionPool } from './transaction.js';

const MessageType = {
    // RESPONSE_MESSAGE : 0,
    // SENT_MESSAGE : 1

    // 최신 블록 요청
    QUERY_LATEST : 0,

    // 모든 블록 요청
    QUERY_ALL : 1,

    // 블록 전달
    RESPONSE_BLOCKCHAIN: 2,

    // 트랜잭션 관련
    QUERY_TRANSACTION_POOL : 3,

    RESPONSE_TRANSACTION_POOL : 4
}

const sockets = []; //배열 시작점의 주소를 sockets에 저장


// 응답을 받는 서버의 역할
const initP2PServer = (p2pPort) => {
    const server = new WebSocketServer({port:p2pPort});
    server.on("connection", (ws) => {
        console.log("someone ws connected to me")
        initConnection(ws); // 추가 안하면 message handle 못함
    })
    
    
    console.log("listening P2PServer Port : ", p2pPort)
}

const initConnection = (ws) => {
    sockets.push(ws);
    initMessageHandler(ws);

    write(ws, queryAllMessage()); // 연결될 때 
}

const connectionToPeer = (newPeer) => {
    const ws = new WebSocket(newPeer);
    ws.on("open", () => {
        initConnection(ws);
        console.log("Connect peer : ", newPeer);
    })
    ws.on("error", () => {console.log("Fail to Connection peer : ", newPeer);})
}

const initMessageHandler = (ws) => {
    ws.on("message", (data) => {
        const message = JSON.parse(data);
        switch(message.type)
        {
            case MessageType.QUERY_LATEST:
                console.log("reply latest")
                break;
            case MessageType.QUERY_ALL:
                write(ws, responseAllMessage())
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                console.log(ws._socket.remoteAddress, " : ", JSON.parse(message.data) )
                handleBlockchainResponse(message.data);
                break;
            case MessageType.QUERY_TRANSACTION_POOL:
                write(ws, responseTransactionPoolMessage())
                break;
            case MessageType.RESPONSE_TRANSACTION_POOL:
                handleTransactionPoolResponse(message.data);
                break;

        }
    })
}

const handleBlockchainResponse = (receivedBlockchain) => {
    const newBlocks = JSON.parse(receivedBlockchain)
    const latestNewBlock = newBlocks[newBlocks.length - 1];
    const latestMyBlock = getLatestBlock()

    // 받아온 블록의 마지막 인덱스가 내 마지막 블록의 인덱스보다 크다.
    if(latestNewBlock.index > latestMyBlock.index)
    {
        // 받아온 마지막 블록의 previousHash와 내 마지막 블록의 hash를 확인한다.
        if(latestNewBlock.previousHash === latestMyBlock.previousHash)
        {
            if(addBlock(latestNewBlock, latestMyBlock))
            {
                // 제한된 플러딩(flooding)을 사용한다
                broadcasting(responseLatestMessage()); 
            }
        }
        //받아온 블록의 전체 크기가 1인 경우 -> 재요청
        else if (newBlocks.length === 1)
        {
            broadcasting(queryAllMessage());
        }
        else
        {
            //그 외 replaceBlockchain
            // 받은 체인이 더 길면 바꾼다 길이가 같으면 랜덤으로 바꾼다 짧으면 안 바꾼다
            replaceBlockchain(newBlocks)
        }
    }
}

const handleTransactionPoolResponse = (receivedTransactionPool) => {
    console.log("receivedTransactionPool : ", receivedTransactionPool);

    receivedTransactionPool.forEach( (transaction) => {
        // 중복검사

        // 트랜잭션 풀에 추가

        // 다시 전파
    })
}

const queryLatestMessage = () => {
    return ({
            "type":MessageType.QUERY_LATEST,
            "data":null
    })
}
const queryAllMessage = () => {
    return ({
            "type":MessageType.QUERY_ALL,
            "data":null
    })
}
const responseLatestMessage = () => {
    return ({
            "type":MessageType.RESPONSE_BLOCKCHAIN ,
            "data":JSON.stringify([getLatestBlock()]) // 이렇게 보내면 JSON.parse써서 데이터 가공해야함 
            // "data":getLatestBlock() // 요렇게 보내면 바로 쓰기 편하다 하지만 데이터가 커질수록 낭비되는 패킷이 많아진다
    })
}
const responseAllMessage = () => {
    return ({
            "type":MessageType.RESPONSE_BLOCKCHAIN ,
            "data":JSON.stringify(getBlocks())
            // "data":getBlocks()
    })
}
const responseTransactionPoolMessage = () => {
    return ({
        "type":MessageType.RESPONSE_TRANSACTION_POOL,
        "data":JSON.stringify(getTransactionPool())
})
}

const write = (ws, message) => { // 보낼 상대방의 ws
    console.log("write()", message);
    ws.send(JSON.stringify(message));
}

const broadcasting = (message) => {
    sockets.forEach((socket)=>{
        write(socket, message)
    });
}

// 내가 새로운 블록을 채굴했을 때 다른 사람들에게 전파
const mineBlock = (blockData) => {
    const newBlock = createBlock(blockData);
    if(addBlock(newBlock,getLatestBlock()))
    {
        broadcasting(responseLatestMessage())
    }
}

export { initP2PServer ,connectionToPeer, broadcasting, responseLatestMessage, mineBlock};