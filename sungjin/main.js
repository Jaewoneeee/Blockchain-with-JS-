// p2p 서버 초기화
// http 서버 초기화
// blockchain 함수 사용

import {initHttpServer} from "./httpServer.js"; // import 할 때 .js 까지
import { initP2PServer } from "./p2pServer.js";
import { initWallet } from "./wallet.js";

const httpPort = parseInt(process.env.HTTP_PORT) || 3001; 
const p2pPort = parseInt(process.env.HTTP_PORT) || 6001; 
// 직접 숫자를 집어넣는 것은 programmer만 vscode 켜서 할 수 있다 하지만 .env파일로 해놓으면 외부에서 조종 할 수 있음

initWallet();
initHttpServer(httpPort);
initP2PServer(p2pPort);