/*
    [ 암호화 ]

    탈중앙화
    분산원장관리

    위 2가지를 만들기위함
    기밀성 : 정보를 저장하고 전송하면서 부적절한 노출을 방지, 정보 보안의 주된 목적
    무결성 : 정보는 일반적으로 수정이 가능한데, 이는 권한 있는 사용자에게만 허가
    가용성 : 활용되어야 할 정보에 접근할 수 없다면, 기밀성과 무결성이 훼손된것 만큼이나 무의미하다.

    지갑
    private key
    public key

    타원 곡선 디지털 서명 알고리즘 (ECDSA, Elliptic Curve Digital Signature Algorithm)

    영지식증명 (Zero Knowledge Proof)
    증명하는 사람 (A), 증명을 원하는 사람(B)
    A와 B는 증명된 내용에 합의 
    그 외의 사람들은 동의하지 않습니다. => 당사자들만 그 내용에 합의를 한다는것 
    증명하는 과정에서 A는 B에게 아무런 정보도 주지 않는다. 

*/

import ecdsa from 'elliptic';
import fs from 'fs';

// 암호화 알고리즘 중 하나 (타원곡선)
const ec = new ecdsa.ec('secp256k1')

const privateKeyLocation = 'wallet/' + (process.env.PRIVATE_KEY || 'default');
const privateKeyFile = privateKeyLocation + '/private_key'

const createPrivateKey = () => {
    const keyPair = ec.genKeyPair();
    const privateKey = keyPair.getPrivate();
    console.log(privateKey)

    console.log(privateKey.toString(16));
    return privateKey.toString(16);
}

//createPrivateKey()

const initWallet = () => {
    // 이미 만들어져 있을 때 
    if(fs.existsSync(privateKeyFile)) {
        console.log('지갑에 비밀키가 이미 있음');
        return;
    }

    // 지갑과 key저장소가 없다면 만들고 저장하도록
    if(!fs.existsSync('wallet/')) { fs.mkdirSync('wallet/') }
    if(!fs.existsSync(privateKeyLocation)) { fs.mkdirSync(privateKeyLocation) }

    const privateKey = createPrivateKey();
    fs.writeFileSync(privateKeyFile, privateKey);
}

//initWallet();

const getPrivateKeyFromWallet = () => {
    const buffer = fs.readFileSync(privateKeyFile, 'utf-8')  // 파일 읽어오기
    console.log(buffer)
    return buffer;
}

//getPrivateKeyFromWallet();

// 어차피 비밀키를 가지고 만들어내는거기 때문에 이렇게 쓰자
const getPublicKeyFromWallet = () => {
    const privateKey = getPrivateKeyFromWallet();
    const publicKey = ec.keyFromPrivate(privateKey, 'hex') // hex : 16진수로 만들어달라. '' 가 인코딩

    console.log(publicKey.getPublic().encode('hex'))
    return publicKey.getPublic().encode('hex')
    // 04a06c86667ec5d5cc213f83c8605fcfddf041eb8616d79e507f75289e165bf662e5fd46d2e9d7f5662d300e1506f445d7aecc9f1a568e35808ac2fac2090b8fdd
}

getPublicKeyFromWallet();

export { initWallet, getPublicKeyFromWallet }