import ecdsa from "elliptic";
import fs from "fs";

const ec = new ecdsa.ec("secp256k1");
const privateKeyLocation = 'wallet/' + (process.env.PRIVATE_KEY || "default")
const privateKeyFile = privateKeyLocation + "/private_key";

const createPrivateKey = () => {
    const keyPair = ec.genKeyPair();
    const privateKey = keyPair.getPrivate();

    // console.log(privateKey);
    // console.log(privateKey.toString(16));

    return privateKey.toString(16);
}

const initWallet = () => {

    // 이미 만들어져 있을 때
    if(fs.existsSync(privateKeyFile)){
        console.log("지갑에 이미 비밀키가 만들어져 있음");
        return;
    }

    // 폴더가 존재하지 않으면
    if(!fs.existsSync("wallet/")) {fs.mkdirSync("wallet/");}
    if(!fs.existsSync(privateKeyLocation)) {fs.mkdirSync(privateKeyLocation);}

    const privateKey = createPrivateKey();
    fs.writeFileSync(privateKeyFile, privateKey)
}

const getPrivateKeyFromWallet = () => {
    const buffer = fs.readFileSync(privateKeyFile, "utf-8")
    return buffer.toString();
}

const getPublicKeyFromWallet = () => {
    const privateKey  = getPrivateKeyFromWallet();
    const publicKey = ec.keyFromPrivate(privateKey,"hex");

    // console.log(publicKey) //privateKey가 노출된다

    return publicKey.getPublic().encode("hex")
}

export { getPublicKeyFromWallet, initWallet, getPrivateKeyFromWallet };