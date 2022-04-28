// 블록체인 관련 함수
// 블록 구조 설계
/* 
    index : 블록체인의 높이
    data : 블록에 포함된 모든 데이터 (트랜잭션 포함
    timestamp : 블록이 생성된 시간 
    hash : 블록 내부 데이터로 생성한 sha256 값 (블록의 유일성)
    previousHash : 이전 블록의 해쉬 (이전 블록을 참조)

*/

import CryptoJS from 'crypto-js'

// class로 블록 만들기
class Block {
    constructor(index, data, timestamp, hash, previousHash){
        this.index = index; // height
        this.data = data;
        this.timestamp = timestamp;
        this.hash = hash;
        this.previousHash = previousHash;
    }
}


// 위에 block안의 외부에서 주어지는 index값들을 합해서 sha256 으로 계산? 변환? / 이걸 쓰려면 CryptoJS 모듈을 쓰면된다
const calculateHash = (index, data, timestamp, previousHash) => {
    return CryptoJS.SHA256((index + data + timestamp + previousHash).toString()).toString();
    //return CryptoJS.SHA256((2).toString()).toString();
}

// 이 block이 유일무이 하다는것을 증명해주는거지 16지수 64자리 
let testHash = calculateHash(11, 20, 50, 1560);
console.log(testHash)

// genesis block 만들기
const createGenesisBlock = () => {
    const genesisBlock = new Block (0, 'genesis block!!', new Date().getTime() / 1000, 0, 0);

    genesisBlock.hash = calculateHash(
        genesisBlock.index,
        genesisBlock.data, 
        genesisBlock.timestamp, 
        genesisBlock.previousHash
        )

    return genesisBlock
}

// 저장해줄 자료구조를 만들기
// genesisblock을 선언할때 한번만 배열에 값으로 들어가도록. 첫번째 인덱스
const blocks = [createGenesisBlock()];

// 외부에 노출할 수 있게 보여주기 
function getBlocks() {
    return blocks;
}


// blockdata를 외부에서 받아온다 (매개변수로)
const createBlock = (blockData) => {
    const previousBlock = blocks[blocks.length - 1]; // 맨마지막 block불러오기
    const nextIndex = previousBlock.index + 1; // 맨마지막블럭 index값의 +1 
    const nextTimestamp = new Date().getTime() / 1000 // 현재시간을 가져와서 초단위로 나눠주기
    const nextHash = calculateHash(nextIndex, blockData, nextTimestamp, previousBlock.hash) // 앞에서 가져온 값들 이용하기

    const newBlock = new Block(nextIndex, blockData, nextTimestamp, nextHash, previousBlock.hash);

    if (isValidNewBlock(newBlock, previousBlock)) {
        blocks.push(newBlock);
        return newBlock
    }
    
    console.log('fail to create new block')
    return null;
}

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


export { getBlocks, createBlock }
