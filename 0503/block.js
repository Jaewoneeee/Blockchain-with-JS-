// 블록체인 관련 함수
// 블록 구조 설계
/* 
    index : 블록체인의 높이
    data : 블록에 포함된 모든 데이터 (트랜잭션 포함
    timestamp : 블록이 생성된 시간 
    hash : 블록 내부 데이터로 생성한 sha256 값 (블록의 유일성)
    previousHash : 이전 블록의 해쉬 (이전 블록을 참조)

    추후에 인제 difficulty랑 nonce추가해준거지 ㅇㅇ
*/

import CryptoJS from 'crypto-js'
import random from 'random';

// 이 주기마다 블록이 생성되게 하는게 목표
const BLOCK_GENERATION_INTERVAL = 10; // SECOND
// 난이도를 바꿀지말지 체크하는 주기 
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;  // generate block count

// class로 블록 만들기
class Block {
    constructor(index, data, timestamp, hash, previousHash, difficulty, nonce){
        this.index = index; // height
        this.data = data;
        this.timestamp = timestamp;
        this.hash = hash;
        this.previousHash = previousHash;
        this.difficulty = difficulty;
        this.nonce = nonce;
    }
}


// 위에 block안의 외부에서 주어지는 index값들을 합해서 sha256 으로 계산? 변환? / 이걸 쓰려면 CryptoJS 모듈을 쓰면된다
// 이 block이 유일무이 하다는것을 증명해주는거지 16진수 64자리 
const calculateHash = (index, data, timestamp, previousHash, difficulty, nonce) => {
    return CryptoJS.SHA256((index + data + timestamp + previousHash + difficulty + nonce).toString()).toString();
    //return CryptoJS.SHA256((1).toString()).toString();
    //return CryptoJS.SHA256((2).toString()).toString();
}

// 0 하나로 시작하는 hash값을 만드는 매개변수(nonce)를 찾는다 -> 이게 바로 문제. 0이 점점 늘어나면 난이도 UP
// 16진수 64자리. 
// 16진수 1자리 -> 2진수 4자리. 256개의 0과 1로 표현 (따라서 2진수로 바꿨을때 앞에 뭐 50자리가 0인 hash값을 찾아라 라고 하면 매우 어렵겠지)

// let testHash = calculateHash(11, 20, 50, 1560);
// console.log(testHash)

// genesis block 만들기
const createGenesisBlock = () => {
    //const genesisBlock = new Block (0, 'test', 0, 0, 0, 1 ,0);
    const genesisBlock = new Block (0, 'genesis block!!', new Date().getTime() / 1000, 0, 0, 1 ,0);

    genesisBlock.hash = calculateHash(
        genesisBlock.index,
        genesisBlock.data, 
        genesisBlock.timestamp, 
        genesisBlock.previousHash,
        genesisBlock.difficulty,
        genesisBlock.nonce
        )

    return genesisBlock
}

// 문제 해결을 검사하는 함수
// hash : 검사할 hash값
// difficulty : 0 이 몇개 일건지
const hashMatchDifficulty = (hash, difficulty) => {
    // 1. 16진수를 2진수로 먼저 바꿔주기
    const binaryHash = hexToBinary(hash); 
    // 2. 필요한 0의 갯수를 정의하기 (0이 difficulty개 만큼 반복되는 문제열을 만든다)
    const requiredPrefix = '0'.repeat(difficulty)
    // 3. 1의 hash값이 2로 시작을 하느냐
    return binaryHash.startsWith(requiredPrefix);
}

// 16진수를 2진수로 바꾸는 함수 
const hexToBinary = (hex) => {
    // 16진수를 2진수로 바꾸는거. 16개를 그냥 테이블에 넣어버리자.
    const lookupTable = {
        '0' : '0000', '1' : '0001', '2' : '0010', '3' : '0011',
        '4' : '0100', '5' : '0101', '6' : '0110', '7' : '0111',
        '8' : '1000', '9' : '1001', 'a' : '1010', 'b' : '1011',
        'c' : '1100', 'd' : '1101', 'e' : '1110', 'f' : '1111'
    }

    let binary = '';
    for (let i = 0; i < hex.length; i++){
        if (lookupTable[hex[i]]) {
            binary += lookupTable[hex[i]];
            // hex값이 위에 테이블 값에 있으면 binary에 2진수로 변환된 해당 문자를 붙여준다 
            // ex 03cf 이게 들어왔다면 
            // 0000001111001111 이런식으로
        }
        else {
            console.log('invalid hex : ', hex)
            return null;
        }
    }

    return binary;
}

// 아래 함수를 실행하는 시점은 이제 creat block이 될때
const findNonce = (index, data, timestamp, previousHash, difficulty) => {
    // nonce는 우리가 새로 만들어 줘야하기 때문에. 찾을때까지 반복  
    let nonce = 0

    // 어떤 hash값이 있고 difficulty를 만족하는 nonce를 찾는거고,
    while(true)
    {
        let hash = calculateHash(index, data, timestamp, previousHash, difficulty, nonce) // 다른값은 고정된 상태에서 noce만 1씩올라가면서 찾는다. 아래 nonce++

        if (hashMatchDifficulty(hash, difficulty)) {  
            return nonce; //만약 208이 나왔으면 hash값을 계속 돌려서 208번쨰에 우리가 원하는 hash값이 됐다는 뜻
        }
        nonce++; 
    }
}

// 저장해줄 자료구조를 만들기
// genesisblock을 선언할때 한번만 배열에 값으로 들어가도록. 첫번째 인덱스
// 노드 연결시 바뀌는경우가 생기기 때문에 let으로 변경
let blocks = [createGenesisBlock()];

// 외부에 노출할 수 있게 보여주기 
function getBlocks() {
    return blocks;
}

// 맨마지막 블럭 함수처리하기
const getLatestBlock = () => {
    return blocks[blocks.length - 1];
}

// blockdata를 외부에서 받아온다 (매개변수로)
const createBlock = (blockData) => {
    const previousBlock = blocks[blocks.length - 1]; // 맨마지막 block불러오기
    const nextIndex = previousBlock.index + 1; // 맨마지막블럭 index값의 +1 
    //const nextTimestamp = new Date().getTime() / 1000 // 현재시간을 가져와서 초단위로 나눠주기
    const nextTimestamp = new Date().getTime() / 1000 // 현재시간을 가져와서 초단위로 나눠주기

    // PoW를 위한 추가코드 
    const nextDifficulty = getDifficulty(); 
     // findNonce 가 통과가 되면 블록이 생성된다. // 순서 주의하기!!!
    const nextNonce = findNonce(nextIndex, blockData, nextTimestamp, previousBlock.hash, nextDifficulty); 

    const nextHash = calculateHash(nextIndex, blockData, nextTimestamp, previousBlock.hash, nextDifficulty, nextNonce) // 앞에서 가져온 값들 이용하기
    const newBlock = new Block(nextIndex, blockData, nextTimestamp, nextHash, previousBlock.hash, nextDifficulty , nextNonce); // 여기도 수정해주고 


    // 이걸 아래 함수로 빼버리자. 아래 함수를 함수형태로 불러옴 
    // if (isValidNewBlock(newBlock, previousBlock)) {
    //     blocks.push(newBlock);
    //     return newBlock
    // }

    // 이것도 그냥 빼고 
    // if(addBlock(newBlock, previousBlock))
    //     return newBlock;
    
    // console.log('fail to create new block')
    // return null;

    // 이 함수는 그냥 블록을 만들기만 하는. 딱 하나의 기능만을 가진 함수로 만들자.
    return newBlock;     
}

const addBlock = (newBlock, previousBlock) => {
    if (isValidNewBlock(newBlock, previousBlock)) {
        blocks.push(newBlock);
        return true;
    }
    return false;
}

// 사실상 정리하는 함수 
// const mineBlock = (blockData) => {
//     const newBlock = createBlock(blockData);
//     if (addBlock(newBlock, getLatestBlock()))
//     {
//         // 전파 
//         //responseLatestMessage();
//         return true;
//     }
//     return false;
// }


// 블록의 무결성 검증
/* 
    - 블록의 인덱스가 이전 블록인덱스보다 1 크다.
    - 블록의 previousHash가 이전 블록의 hash이다.
    - 블록의 구조가 일치해야 한다.
*/

// 길어서 함수로 빼기
const isValidBlockStructure = (newBlock) => {
    if (typeof(newBlock.index) === 'number'
          && typeof(newBlock.data) === 'string'
          && typeof(newBlock.timestamp) === 'number'
          && typeof(newBlock.hash) === 'string'          
          && typeof(newBlock.previousHash) === 'string' 
          && typeof(newBlock.difficulty) === 'number'  // 여기도 수정   난이도는 왜 같아져야 하는거지? 
          && typeof(newBlock.nonce) === 'number'  // 여기도 수정 //언제 넘버가 됐누!
    ) {
        return true;
    }  
    return false;
}

const isValidNewBlock = (newBlock, previousBlock) => {
    if (newBlock.index !== previousBlock.index + 1 ) {
        console.log('invalid index')
        return false;
    }
    else if (newBlock.previousHash !== previousBlock.hash) {
        console.log('invalid previous hash')
        return false;
    }
    else if (isValidBlockStructure(newBlock) == false) {
        console.log('invalid block structure')
        return false;
    }
    return true;
}

// 블록체인 전체가 바뀌어야할때. 
const replaceBlockchain = (receiveBlochain) => {
    // 0504 마지막오류 해결하기 위해 코드 추가
    // JSON stringfy parse등 데이터의 형태를 바꿔주는 흐름 잘 보자 
    //const newBlocks = JSON.parse(receiveBlochain);
    console.log(receiveBlochain)

    if (isValidBlockchain(receiveBlochain))
    {
        //let blocks = getBlocks();
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

// 올바른 데이터를 가진 블록인지 검증하기
const isValidBlockchain = (receiveBlochain) => {
    // 같은 제네시스 블록인가
    if (JSON.stringify(receiveBlochain[0]) !== JSON.stringify(getBlocks()[0])){
        console.log(receiveBlochain[0] , "남거")
        console.log(getBlocks()[0] , "내거")
        return false
    }
    
    // 체인 내의 모든 블록을 확인
    for (let i = 1; i < receiveBlochain.length; i++)
    {
        if (isValidNewBlock(receiveBlochain[i], receiveBlochain[i - 1]) == false)
        {
            return false
        }
    }

    return true
}

// 난이도 조절 코드 =================================

const getAdjustmentDifficulty = () => {
    // 현재 만들어진 블록의 생성 시간, 마지막으로 난이도 조정된 시간 
    const prevAdjustedBlock = blocks[blocks.length - DIFFICULTY_ADJUSTMENT_INTERVAL - 1];
    const latestBlock = getLatestBlock(); 
    const elapsedTime = latestBlock.timestamp - prevAdjustedBlock.timestamp
                        //마지막블록(ex.30)      //마지막 난이도가 조절된 시간(ex.20)
    const expectedTime = DIFFICULTY_ADJUSTMENT_INTERVAL * BLOCK_GENERATION_INTERVAL; // 사토시한테 따지셈 ㅇㅇ 그냥 이런거임

    if (elapsedTime > expectedTime * 2) // 기대시간x2 보다 경과시간이 크다 => 난이도를 낮춘다
    {
        return prevAdjustedBlock.difficulty - 1;
    }
    else if (elapsedTime < expectedTime * 2) // 기대시간x0.5보다 경과시간이 낮다 => 난이도를 높힌다
    {
        return prevAdjustedBlock.difficulty + 1;
    }
    else
    {
        return prevAdjustedBlock.difficulty;
    }
}

// 얘는 블록을 생성할때 불러와야겠지? nextdifficulty 에 얘가 들어가도록
const getDifficulty = () => {
    
    // 마지막블록의 난이도를 가져오면 되지만, 난이도를 고려해서해야한다.
    // 우선은 마지막블록부터 가져와 보자
    const latestBlock = getLatestBlock();

    // 난이도 조정 주기 확인 
    // 마지막 인덱스를 주기로 나눠주고, 0은 안되고
    if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 &&
        latestBlock.index !== 0) {
            return getAdjustmentDifficulty();
        }

    return latestBlock.difficulty;
}

export { getBlocks, createBlock, getLatestBlock , addBlock , isValidNewBlock, replaceBlockchain, isValidBlockchain }