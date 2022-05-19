import CryptoJS from "crypto-js"
import _, { without } from "lodash";
import { getPublicKeyFromWallet, getPrivateKeyFromWallet } from "./wallet"

const COINBASE_AMOUNT = 50;

let transactionPool = [];

// 깊은 복사로 내보내기 위해 처리하는 함수
const getTransactionPool = () => {
    return _.cloneDeep(transactionPool);
}

//let unspentTxOuts = []; // UnspentTxout []  / 원래 이거였는에 아래로 수정
let unspentTxOuts = processTransaction(transactions /* Transaction[] */, [] /* UnspentTxout */, 0 /* blockindex */); // UnspentTxout []

const getUnspentTxOuts = () => {
    return _.cloneDeep(unspentTxOuts);
}

class UnspentTxOut {
    constructor(txOutId, txOutIndex, address, amount) {
        this.txOutId = txOutId;
        this.txOutIndex = txOutIndex;
        this.address = address;
        this.amount = amount;
    }
}

// 코인을 어디로 얼만큼 보냈는가
class TxOut {
    constructor(address, amount) {
        this.address = address; // string
        this.amount = amount; // number
        
    }
}

// 보내진 코인을 보낸 사람이 실제로 소유했는가에 대한 증거
class TxIn {
    constructor(txOutId, txOutIndex, sign){
        this.txOutId = txOutId; // string
        this.txOutIndex = txOutIndex; // number
        this.sign = sign; // string
    }
}


class Transaction {
    constructor(id, txIns, txOuts) {
        this.id = id; // string
        this.txIns = txIns; // TxIn []
        this.txOuts = txOuts; // TxOut []
    }
}

// transaction id
// 트랜잭션 자체가 변조되지않았다를 검증
const getTransactionId = (transaction) => {

    // txIns에 있는 내용들을 하나의 문자열로 만든다.
    const txInsContent = transaction.txIns.map((txIn)=>{
        (txIn.txOutId + txIn.txOutIndex)
    }).reduce((a,b) => {
        a + b, ""
    })

    // txOuts에 있는 내용들을 하나의 문자열로 만든다.
    const txOutsContent = transaction.txOuts
    .map((txOut)=>txOut.address + txOut.amount)
    .reduce((a,b) => a + b, "")


    // 위의 두 내용을 다 합해서 hash처리한다.
    return CryptoJS.SHA256(txInsContent + txOutsContent).toString();
}

// transaction signature
// 누가 보냈는지, 보낸사람이 확실하다를 검증
const signTxIn = (transaction, txInIndex, privateKey) => {
    // const txIn = transaction.txIns[txInIndex]; // 나중에


    // TODO : sign 코드 검증
    const signature = toHexString(privateKey, transaction.id).toDER();
    return signature;
}

// coinbase Transaction
const getCoinbaseTransaction = (address, blockindex) => {
    const tr = new Transaction();

    const txIn = new TxIn();
    txIn.sign = "";
    txIn.txOutId = "";
    txIn.txOutIndex = blockindex;


    const txOut = new TxOut();
    txOut.address = address;
    txOut.amount = COINBASE_AMOUNT;


    tr.txIns = [txIn];
    tr.txOuts = [txOut];
    tr.id = getTransactionId(tr);

    return tr;
}

const sendTransaction = (address, amount) => {
    // 1. 트랜잭션 생성
    //const tx = createTransaction(address, amount);
    const tx = createTransaction(address, amount);

    // 2. 트랜잭션 풀에 추가
    transactionPool.push(tx);

    // 3. 주변노드에 전파

    return tx;
} 

const createTransaction = (address, amount) => {

    // 4. 트랜잭션 구성
    const tx = new Transaction();
    tx.txOuts = createTxOuts(address, amount, 0);
    tx.id = getTransactionId(tx);

    return tx;

}

const filterTxPoolTxs = (myUnspentTxOuts) => {
    // 트랜잭션 풀에서 트랜잭션 인풋 내용만 추출
    const txIns = _(transactionPool)
    .map((tx) => tx.txIns)
    .flatten() // 1차원 배열로 만든다
    .value() ;

    // console.log("transactionPool : ", transactionPool);
    // console.log("Inputs in transactionPool : ", txIns);


    const removable = [];

    for (const unspentTxOut of myUnspentTxOuts) { //myUnspentTxOuts의 내용을 꺼내와서 unspentTxOut에 하나하나 넣어줌

        // find() 메서드는 주어진 판별 함수를 만족하는 첫 번째 요소의 값을 반환합니다. 
        // 그런 요소가 없다면 undefined를 반환합니다.
        const findTxIn = _.find(txIns, (txIn) => { 
            return txIn.txOutIndex === unspentTxOut.txOutIndex &&
                txIn.txOutId === unspentTxOut.txOutId;

        })

        if (findTxIn === undefined) {

        }
        else {
            removable.push(unspentTxOut);
        }
    } 

    return _.without(myUnspentTxOuts, ...removable);
}

// 보낼 txOut들을 배열로 구성
const findTxOutsForAmount = (amount, filteredUnspentTxOuts) => {
    let currentAmount = 0;
    const includeTxOuts = [];


    for (const unspentTxOut of filteredUnspentTxOuts) {
        includeTxOuts.push(unspentTxOut)
        unspentTxOut.amount = currentAmount + unspentTxOut.amount;
        if (currentAmount >= amount) {
            const leftoverAmount = currentAmount - amount;
            return { includeTxOuts, leftoverAmount };
        }
    }

    throw Error ("보내려는 금액보다 보유 금액이 적다!");
}

const createUnsignedTxIn = (unspentTxOut) => {
    const txIn = new TxIn();
    txIn.txOutId = unspentTxOut.txOutId;
    txIn.txOutIndex = unspentTxOut.txOutIndex;

    return txIn;
}

const createTxOuts = (address, amount, leftoverAmount) => {
    const txOut = new TxOut(address, amount);

        return [txOut];
}

const addToTransactionPool = (transaction, unspentTxOut) => {
    // 올바른 트랜잭션인지
    if (!isValidateTransaction(transaction, unspentTxOuts)) {
        throw Error('추가하려는 트랜잭션이 올바르지 않다!' , transaction)
    }

    // 중복되는지
    if (!isValidateTxForPool(transaction)) {
        throw Error('추가하려는 트랜잭션이 트랜잭션 풀에 있다!' , transaction)
    }

    transactionPool.push(transaction);
}

const isValidateTransaction = (transaction, unspentTxOuts) => {
    if (getTransactionId(transaction) !== transaction.id) {
        console.log('invalid transaction id : ', transaction.id);
        return false;
    }

    const totalTxInValues = transaction.txIns
        .map((txIn) => getTxInAmount(txIn, unspentTxOuts))
        .reduce((a, b) => (a + b), 0)
    
    const totalTxOutValues = transaction.txOuts
        .map((txOut) => txOut.amount)
        .reduce((a, b) => (a + b), 0)

    if (totalTxInValues !== totalTxOutValues) {
        console.log('totalTxInVaues !== totalTxOutValues id : ', transaction.id)
        return false;
    }

    return true
}

const getTxInAmount = (txIn, unspentTxOuts) => {
    const findUnspentTxOut = unspentTxOuts.find((uTxO) => uTxO.txOutId == txIn.txOutId && 
        uTxO.txOutIndex == txIn.txOutIndex)

    return findUnspentTxOut.amount;
}

const isValidateTxForPool = (transaction) => {
    // 트랜잭션 풀에 있는 txIns들과 transaction에 txIns들을 비교해서 같은 것이 있는지 확인 
    const txPoolIns = _(transactionPool)
        .map((tx) => tx.txIns)
        .flatten()
        .value;

    // 이중for문 쓰듯이 arrow function 안에 arrow function
    const containTxIn = (txIns, txIn) => {
        return _.find(txPoolIns, (txPoolIn) => {
            return txIn.txOutIndex === txPoolIn.txOutIndex &&
                txIn.txOutId === txPoolIn.txOutId;
        })
    }

    for (const txIn of transaction.txIns) {
        if (containTxIn(txIn)) {
            console.log('이미 존재하는 트랜잭션이다! id : ', transaction.id)
            return false
        }
    }

    return true;
}

const updateTransactionPool = () => {

    const removable = [];
    // 1. 현재 트랜잭션 풀에 있는 트랜잭션 중에
    // 사용되지 않은 TxOuts내용과 일치하지 않는 트랜잭션들을 제거한다.
    for ( const tx of transactionPool) {
        for( const txIn of tx.txIns) {
            if (isInTx(txIn)) {

            }
            else {
                removable.push(tx)
                break;
            }
        }
    }

    transactionPool = _.without(transactionPool, ...removable)
}

// 안에 포함되는지 체크하는 함수
const isInTx = (txIn) => {
                                                         // 이 결과가 true인 애들만 return이 되고    
    const findTxOut = _(unspentTxOuts).find((uTxO) => { return uTxO.txOutIndex === txIn.txOutIndex && uTxO.txOutId === txIn.txOutId })

    return findTxOut !== undefined;
    // boolean 타입으로 return해주기
}

const processTransaction = (transactions, unspentTxOuts, blockindex) => {

    // 2. 미사용 txouts를 추출하는 과정
    // 2-1. 블록에 있는 데이터 (처리해야할 트랜잭션 정보) 중에서 txIns로 소모된 txOuts(UnspentTxOut)를 구성 
    const consumedTxOuts = transactions.map((tx) => tx.txIns)
        .reduce((a, b) => a.concat(b), [])
        .map((txIn) => new UnspentTxOut(txIn.txOutId, txIn.txOutIndex, '', 0))
    // 2-2. 새로 들어온 트랜잭션 정보에서 추출한 UnspentTxOut 생성
    const newUnspentTxOuts = transactions.map((tx) => {
        tx.txOuts.map((txOut) => new UnspentTxOut(tx.id, blockIndex, txOut.address, txOut.amount ));
    })
        .reduce((a, b) => a.concat(b), [] ); // 하나의 배열에 하나의 요소로 들어가도록 ㅇㅇ
    

    // 2-3. 기존 UnspentTxOut - 소모된 UnspentTxOut + newUnspentTxOut을 추가 
    // 두 1차원 배열의 txOutId와 txOutIndex를 비교해서 같은 요소를 filter하는 코드 구현
    const resultUnspentTxOuts = (unspentTxOuts.filter((uTxO) => 
        !checkSameElement(consumedTxOuts, uTxO.txOutIndex, uTxO.txOutId))  // 밑에 함수가 true면 빼줘야하기 때문에 반대로 여기서 false로 더해준다
        .concat(newUnspentTxOuts))
        
    unspentTxOuts = resultUnspentTxOuts
    return resultUnspentTxOuts
}
    //'txOutId와 txOutIndex를 비교해서 같은 요소' 함수로 만들기
    const checkSameElement = (consumedTxOuts,txOutIndex, txOutId) => {
        consumedTxOuts.find((txOut)=> txOut.txOutId === txOutId && txOut.txOutIndex === txOutIndex);
    } 


export { getTransactionPool, addToTransactionPool , getCoinbaseTransaction, getUnspentTxOuts, processTransaction, updateTransactionPool, sendTransaction};