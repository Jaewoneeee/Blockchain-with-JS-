import CryptoJS from 'crypto-js'

const COINBASE_AMOUNT = 50

// 코인을 어디로 얼만큼 보냈는가
class TxOut {
    // address 누구한테, amount 얼마를 준다 
    constructor(address, amount) { 
        this.address = address; // string
        this.amount = amount;   // number
    }
}

// 보내진 코인을 실제로 소유했다에 대한 증거
class TxIn {
    // out들로 채워놓고 이를 해석해야함
    constructor(txOutId, txOutIndex, sign) {
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

// 내용을 검증하기
// transaction id
const getTransactionId = (transactoin) => {
    // txIns에 있는 내용들을 하나의 문자열로 만든다.
    const txInsContent = transactoin.txIns
    .map((txIn) => txIn.txOutId + txIn.txOutIndex)
    .reduce( (a, b) => a + b, '')
    // map은 안쪽에 있는 요소들을 하나하나 돌아가며 가공을하거나 안하거나. 새로운요소로 만들어서 배열을 구성
    // reduce로 a + b / (a+b) + c 이런식으로 배열값 다 더하기

    // txOuts에 있는 내용들을 하나의 문자열로 만든다. 
    const txOutsContent = transactoin.txOuts
    .map((txOut) => txOut.address + txOut.amount)
    .reduce( (a, b) => a + b, '')

    // 위의 두 내용을 다 합해서 hash처리한다. 
    return CryptoJS.SHA256(txInsContent + txOutsContent).toString();
}

// transaction signature
// 이걸 누가 보냈는지 확실하다
const signTxIn = (transaction, txInIndex, privateKey) => {
    const txIn = transaction.txIns[txInIndex] 

    const signature = toHexString(privateKey, transaction.id).toDER();  //toDER() 인코딩하는 방식 중 하나 
    return signature

    // 
    // 50코인을 가지고 있다가 30은 다른사람에게 보내고, 20은 다시 나한테 보내는 구조임
    // 사용하지 않은 트랜잭션만 처리할 수 있다. 구조상 그럼 
}


// coinbase Transaction
const getCoinbaseTransaction = (address, blockIndex) => {
    const tr = new Transaction();

    const txIn = new TxIn();
    txIn.sign = '';
    txIn.txOutId = '';
    txIn.txOutIndex = blockIndex;
    
    const txOut = new TxOut();
    txOut.address = address;
    txOut.amount = COINBASE_AMOUNT;

    tr.txIns = [txIn];
    tr.txOuts = [txOut];
    tr.id = getTransactionId(tr)

    return tr
}
