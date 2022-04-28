// web에 명령어를 입력해서 내 노드를 제어하는 서버 

// import의 경우 딱 필요한 애만 불러옴
import express from 'express';
import bodyParser from 'body-parser';
import { getBlocks, createBlock } from './block.js';

// common js에서 통쨰로 다 불러옴 그래서 위 import가 더 빠름
//const express = require('express')

// 초기화 함수
const initHttpServer = (myHttpPort) => {
    const app = express();
    app.use(bodyParser.json()); 

    app.get('/', (req, res) => {
        res.send('Hello BlockChain!')
    })

    app.get('/blocks', (req, res) => {
        // 블록의 배열을 넘겨주는 함수를 여기서 갖다 쓰자 (block.js)
        res.send(getBlocks());
    })

    app.post('/createblocks', (req, res) => {
        // 여기서 뭐 어찌저찌 postman에서 쏴주는거 해야겠지?
        res.send(createBlock(req.body.data)); // 요게 이제 우리가 만들 block data
        console.log(req.body.data)
    })

    //매개변수 2개 / 함수포트 , 화살표함수
    app.listen(myHttpPort, () => {
        console.log('listening httpServer Port : ', myHttpPort);
    })
}

// main에서 import를 하려면 export를 먼저하자
export { initHttpServer };