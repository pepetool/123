//@ts-nocheck
import { PublicKey } from '@solana/web3.js';
//import convict from 'convict';
// import * as dotenv from 'dotenv';
// dotenv.config();



const TIP_ACCOUNTS = [
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
].map((pubkey) => new PublicKey(pubkey));

const getRandomTipAccount = () => {
  if (process.env.NEXT_PUBLIC_DEBUG === "true") {
    return new PublicKey("B1mrQSpdeMU9gCvkJ6VsXVVoYjRGkNA7TtjMyqxrhecH")
  }
  else {
    return TIP_ACCOUNTS[Math.floor(Math.random() * TIP_ACCOUNTS.length)];
  }
}

export const getJitoSetFee = (set) => {
  if (set === 1) {
    return 0.0001
  } else if (set === 2) {
    return 0.001
  } else if (set === 3) {
    return 0.01
  }
}



export { getRandomTipAccount };