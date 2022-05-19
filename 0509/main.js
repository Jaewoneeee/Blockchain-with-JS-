// p2p 서버 초기화, 사용
// http 서버 초기화, 사용
// 블록체인 함수 사용

import { initHttpServer } from "./httpServer.js";
import { initP2PServer } from "./p2pServer.js";
import { initWallet } from "./wallet.js"

            // 설정되어있으면 환경변수 아니면 3001 / 6001을 쓴다
            // int형으로 변환해서 써주자 (env파일에선 다 string형태로 들어간다? 정확하진않지만 암튼 뭘로 들어가든 int로 바꾸자)
const httpPort = parseInt(process.env.HTTP_PORT) || 3001;
const p2pPort = parseInt(process.env.P2P_PORT) || 6001;
// 여기서 포트를하나 더 파서 나 혼자서도 해볼수 있을듯
// const p2pPort2 = parseInt(process.env.P2P_PORT) || 6002;
// const p2pPort3 = parseInt(process.env.P2P_PORT) || 6003;

initWallet()
initHttpServer(httpPort);
initP2PServer(p2pPort);
// initP2PServer(p2pPort2);
// initP2PServer(p2pPort3);