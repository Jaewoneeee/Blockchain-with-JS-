// blockchain 관련 function
// block 구조 설계
/*
    index : 블록체인의 높이
    data : 블록에 포함된 모든 데이터 (트랜잭션 포함)
    timestamp : 블록이 생성된 시간
    hash : 블록 내부 데이터로 생성한 sha256 값 (블록의 유일성)
    previousHash : 이전 블록의 해쉬 (이전 블록 참조)
*/
import random from "random";
import CryptoJS from "crypto-js"
import { getCoinbaseTransaction , getTransactionPool, getUnspentTxOuts, processTransaction, updateTransactionPool} from './transaction.js'
import { getPublicKeyFromWallet } from './wallet.js'

const BLOCK_GENERATION_INTERVAL = 10; // 이 주기마다 블록이 생성되게 하는것이 우리의 목표 // SECOND
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10; // 난이도를 바꿀지 안바꿀지 check // BLOCK 생성갯수

class Block {
    constructor(index, data, timestamp, hash, previousHash, difficulty, nonce) {
        this.index = index;
        this.data = data;
        this.timestamp = timestamp;
        this.hash = hash;
        this.previousHash = previousHash;
        this.difficulty = difficulty;
        this.nonce = nonce;
    }
}


const getBlocks = () => { // 외부에 노출할 수 있게
    return blocks;
}

const getLatestBlock = () => {
    return blocks[blocks.length - 1];
}

const calculateHash = (index, data, timestamp, previousHash, difficulty, nonce) => {
    return CryptoJS.SHA256(`${index + data + timestamp + previousHash + difficulty + nonce}`).toString(); // toString() 한 것이 우리가 원하는 형태
}

// 0 하나로 시작하는 hash값을 만드는 매개변수(nonce)를 찾는다
// 0 두개로 시작하는 hash값을 만드는 매개변수(nonce)를 찾는다 -> 하나만 값이 바뀌어도 hash는 완전히 바뀌기 때문에 난이도는 훨씬 상승
// 16진수 64자리
// 16진수 1자리 -> 2진수 4자리 256개의 0과 1로 표현

// new Date().getTime() / 1000
const createGenesisBlock = () => {
    const genesisBlock = new Block(0, 'The Times 03/Jan/2009 Chancellor on brink of second bailout for banks',0, 0, 0, 1, 0);
    
    genesisBlock.hash = calculateHash(genesisBlock.index, genesisBlock.data, genesisBlock.timestamp,
    genesisBlock.previousHash, genesisBlock.difficulty, genesisBlock.nonce);
    return genesisBlock;
}

const createBlock = (blockData) => {
    const previousBlock = blocks[blocks.length - 1];
    const nextIndex = previousBlock.index + 1;
    const nextTimestamp = new Date().getTime() / 1000;
    const nextDifficulty = getDifficulty();
    const nextNonce = findNonce(nextIndex, blockData ,nextTimestamp, previousBlock.hash, nextDifficulty);

    const nextHash = calculateHash(nextIndex, blockData ,nextTimestamp, previousBlock.hash, nextDifficulty, nextNonce);

    const newBlock = new Block(nextIndex, blockData, nextTimestamp, nextHash, previousBlock.hash, nextDifficulty, nextNonce);

        return newBlock;
}

const addBlock = (newBlock,previousBlock) => {
    if(isValidNewBlock(newBlock,previousBlock)){
        blocks.push(newBlock)

        // 0510
        // 사용되지 않은 txOuts 셋팅
        processTransaction(newBlock.data, getUnspentTxOuts(), newBlock.index)

        // 블록체인이 바뀔때 트랜잭션 풀 업데이트
        updateTransactionPool(unspentTxOuts)

        return true;
    }
    return false
}

// 0510 추가 
// 기존 crateBlock에 임의의 데이터 1 등 을 넣었는데
// 이제 여기선 진짜로 데이터를 담아서 블록을 만들게 매개변수를 던져준다 
const createNextBlock = () => {
    // 1. 코인베이스 트랜잭션 생성
    // 내가 채굴중이니까 주소값을 나의 퍼블릭키로 매개변수를 가져옴
    // 인덱스는 맨마지막 블록인덱스의 다음거
    const coinbaseTx = getCoinbaseTransaction(getPublicKeyFromWallet(), getLatestBlock().index + 1)

    // 2. 생성된 코인베이스 트랜잭션 뒤에 현재 보유 중인 트랜잭션 풀의 내용을 포함 (마이닝된 블록의 데이터)
    // .concat()  배열안에 있는거 다 더해주기
    const blockData = [coinbaseTx].concat(getTransactionPool())
    return createBlock(blockData)
}


//블록의 무결성 검증
/*
    블록의 인덱스가 이전 블록 인덱스보다 1크다
    블록의 previousHash가 이전 블록의 hash이다
    블록의 구조가 일치해야 한다.
*/

const isValidBlockStructure = (newBlock) => {
    return(
        typeof (newBlock.index) === "number"
        && typeof (newBlock.data) === "string"
        && typeof (newBlock.timestamp) === "number"
        && typeof (newBlock.hash) === "string"
        && typeof (newBlock.previousHash) === "string"
        && typeof (newBlock.difficulty) === "number"
        && typeof (newBlock.nonce) === "number"
    )
    
}

const isValidNewBlock = (newBlock, previousBlock) => {
    if (newBlock.index !== previousBlock.index + 1) {
        console.log("invalid index");
        return false;
    }
    else if (newBlock.previousHash !== previousBlock.hash) {
        console.log("invalid previous hash");
        return false;
    }
    else if (!isValidBlockStructure(newBlock)) {
        console.log("invalid block structure");
        return false;
    }
    return true;
}

// 문제 해결을 검사하는 함수
const hashMatchDifficulty = (hash, difficulty) => {
    const binaryHash = hexToBinary(hash);
    const requiredPrefix = '0'.repeat(difficulty);
    // binaryHash가 requiredPrefix로 시작을 하는지 비교할 것이다

    return binaryHash.startsWith(requiredPrefix);
}

const hexToBinary = (hex) => {
    const lookupTable = {
        '0' : "0000", '1' : "0001", '2' : "0010", '3' : "0011", 
        '4' : "0100", '5' : "0101", '6' : "0110", '7' : "0111", 
        '8' : "1000", '9' : "1001", 'a' : "1010", 'b' : "1011", 
        'c' : "1100", 'd' : "1101", 'e' : "1110", 'f' : "1111"
    }

    let binary = '';
    for(let i = 0; i < hex.length; i++)
    {
        if(lookupTable[hex[i]]) {
            binary += lookupTable[hex[i]];
        }
        else {
            console.log("invalid hex : ", hex);
            return null;
        }
    }
    return binary;
}

const findNonce = (index, data, timestamp, previousHash, difficulty) => {
    let nonce = 0;

    while(true)
    {
        let hash = calculateHash(index, data, timestamp, previousHash, difficulty, nonce);

        if(hashMatchDifficulty(hash, difficulty)) {
            return nonce;
        }
        nonce++;
    }

}


const isValidBlockchain = (receiveBlockchain) => {
    // 같은 제네시스 블록인가
    if (JSON.stringify(receiveBlockchain[0]) !== JSON.stringify(getBlocks()[0])) {
        console.log("제네시스 블록이 다름")
        return false;
    }
    // 체인 내의 모든 블록을 확인
    for (let i = 1; i < receiveBlockchain.length; i++) 
    {
        if (isValidNewBlock(receiveBlockchain[i],receiveBlockchain[i-1]) == false){
            console.log("블록체인에 문제")
            return false;
        }
            
    }
    console.log("valid blockchain")
    return true;
}

// 통째로 교체할 때 쓰는 function
const replaceBlockchain = (receiveBlockchain) => {
    if(isValidBlockchain(receiveBlockchain))
    {
        if((receiveBlockchain.length > blocks.length) || (receiveBlockchain.length == blocks.length && random.boolean()) )
        {
            console.log("받은 블록체인 길이가 길거나 같다")
            blocks = receiveBlockchain;
            
            // 0510
            // 사용되지 않은 txOuts 셋팅
            processTransaction(getLatestBlock().data, getUnspentTxOuts(), getLatestBlock().index)

            // 블록체인이 바뀔때 트랜잭션 풀 업데이트
            updateTransactionPool(unspentTxOuts)
        }
        //else{ console.log("받은 블록체인이 더 짧음")}
    }
    else{
        console.log("받은 블록체인에 문제")
    }
}

const getAdjustmentDifficulty = () => {
    // 현재 만들 블록의 시간, 마지막으로 난이도 조정된 시간의 차를 BLOCK_GENERATION_INTERVAL 와 비교해서 비슷하게 맞추기 위해 난이도를 조정한다
    const prevAdjustedBlock = blocks[blocks.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
    const latestBlock = getLatestBlock();
    const elapsedTime = latestBlock.timestamp - prevAdjustedBlock.timestamp; //timestamp가 sec
    const expectedTime = DIFFICULTY_ADJUSTMENT_INTERVAL * BLOCK_GENERATION_INTERVAL;

    if(elapsedTime > expectedTime * 2)
    {
        // 난이도 낮춤.
        return prevAdjustedBlock.difficulty - 1;
    }
    else if(elapsedTime < expectedTime / 2)
    {
        // 난이도 높임
        return prevAdjustedBlock.difficulty + 1;
    }
    else
    {
        return prevAdjustedBlock.difficulty;
    }
}

const getDifficulty = () => {
    const latestBlock = getLatestBlock();

    // 난이도 조정 주기 확인
    if(latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 &&
        latestBlock.index !== 0) // 10, 20, 30 일때
        {
            return getAdjustmentDifficulty();
        }
    

    return latestBlock.difficulty;
}

const genesisBlock = createGenesisBlock();
genesisBlock.data = getCoinbaseTransaction(getPublicKeyFromWallet(), getLatestBlock().index + 1)

let blocks = [genesisBlock];



export { getBlocks , getLatestBlock , createBlock ,addBlock ,replaceBlockchain };