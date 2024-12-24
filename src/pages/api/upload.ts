import type { NextApiRequest, NextApiResponse } from 'next'
//import multer from 'multer'
import {
  LAMPORTS_PER_SOL,
  Keypair,
  Connection,
} from '@solana/web3.js';
import {
  keypairIdentity,
  Metaplex,
  irysStorage,
  // toMetaplexFileFromBrowser,
  // toMetaplexFileFromJson,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import bs58 from "bs58"
import axios from 'axios';
import * as fs from "fs";
import formidable from 'formidable-serverless';
import { Uploader } from '@irys/upload';
import Solana from '@irys/upload-solana';

//import axios from 'axios';




const FormData = require('form-data')
const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI4ZmZjMWQ1Ny03Njk3LTQ0ZjgtOGRkYS02NmM4ZGRmYzUzOTEiLCJlbWFpbCI6ImRlbm55bWVuZzQ0NEBwcm90b25tYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIzNzBkNDAxYjRkNDIyMjMwYWE1OCIsInNjb3BlZEtleVNlY3JldCI6IjYyOGIwM2NhZjY2N2Y2ZTE5YzAxZTcwZDE3OWQ5YjQ2NjM3ZjVjNmY3MDkzMTk0MjU2NjcyM2ZkZjQ5YjQ3Y2YiLCJpYXQiOjE3MTYwMzQ5MDR9.7LlitlwAt-aUTMrNk4Gdc-qZucQW8WBxMDZdrRxE7pw"
//https://bronze-tricky-panther-728.mypinata.cloud
const pinFileToIPFS = async () => {
  const formData = new FormData();
  const src = "./tg.png";

  const file = fs.createReadStream(src)
  formData.append('file', file)

  const pinataMetadata = JSON.stringify({
    name: 'File name',
  });
  formData.append('pinataMetadata', pinataMetadata);

  const pinataOptions = JSON.stringify({
    cidVersion: 0,
  })
  formData.append('pinataOptions', pinataOptions);

  try {
    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      //maxBodyLength: "Infinity",
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        'Authorization': `Bearer ${JWT}`
      }
    });
    console.log(res.data);
    return res.data;  //res.data.IpfsHash: QmehNdrh5ch175RJtq2yv1WwNzg9jDvibCk9XARtCGbwtj
  } catch (error) {
    console.log(error);
  }
}
//pinFileToIPFS()



type Data = {
  uri: string
}

//const upload = multer({ dest: '/tmp' }); // 设置文件上传的临时存储目录

export const config = {
  api: {
    bodyParser: false, // 禁用默认的 bodyParser
  },
}

async function getimagejson(jsonUrl) {
  try {
    const response = await fetch(jsonUrl); // 使用fetch()获取JSON数据
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const jsonData = await response.json(); // 将响应转换为文本
    return jsonData; // 返回文本数据
  } catch (error) {
    console.error('Error fetching JSON:', error);
    return jsonUrl; // 返回null或者其他适当的错误处理
  }
}

//publickey = 6aqW5YsdVXgufcp8TYxcgFrW4bZhbMVVP18PCCAR4Fs2
const mysiyao = "f6kiUaZpcK8GExt9Afae2juNrHK66kYfxR2do7NSXC4HFhYMxyRxcxGRbdAW6VBWNoZ8BeriUPsvbfHUHUhhCNC";


const getimageuriproc = async (file, tokenName, symbol, description, website, telegram, twitter, wordArray) => {
  try {
    //return "111"
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC);

    const userWallet = Keypair.fromSecretKey(bs58.decode(mysiyao));

    const newMetaplex = Metaplex.make(connection)
      .use(
        irysStorage(
          {
            address: process.env.NEXT_PUBLIC_NODE,  //上传检查api
            providerUrl: process.env.NEXT_PUBLIC_RPC,//RPC
            timeout: 60000,
          }
        )
      )
      .use(keypairIdentity(userWallet));
    console.log("Getting token accounts...");
    //const imagefile = await toMetaplexFileFromBrowser(file)
    const imageUri = await newMetaplex.storage().upload(file);
    //console.log('imageuri:', imageUri);    
    const tokenMetadata = {
      name: tokenName,
      symbol: symbol,
      image: imageUri,//await toMetaplexFileFromBrowser(file), 
      showName: true,
      // createdOn: "https://pump.fun",
      description: description,
      extensions: {
        website: website,
        telegram: telegram,
        twitter: twitter
      },
      tags: [wordArray],
      // creator:{
      //   name:"Tool",
      //   site:"https://www.pepetool.cc/"
      // }
    };
    console.log("uploadMetadata");
    const uplmetadata = await newMetaplex.nfts().uploadMetadata(tokenMetadata);
    const tokenuri = uplmetadata.uri;
    console.log("tokenuri", tokenuri);
    return tokenuri;

  } catch (err) {
    return err;
  }
}

const getIrysUploader = async () => {
  const irysUploader = await Uploader(Solana).withWallet(mysiyao);
  return irysUploader;
};

const uploadData = async (buff) => {
  const irys = await getIrysUploader();
  //const fileToUpload = "./pump.png";
  const tags = [{ name: "Content-Type", value: "image/png" }];
  try {
    const response = await irys.upload(buff, {
      tags: tags
    });
    console.log(`File uploaded ==> https://gateway.irys.xyz/${response.id}`);
    return `https://gateway.irys.xyz/${response.id}`;
  } catch (e) {
    console.log("Error uploading file ", e);
    return '';
  }
};

const uploadJson = async (buff) => {
  const irys = await getIrysUploader();
  //const fileToUpload = "./pump.png";
  const tags = [{ name: "Content-Type", value: "application/json" }];
  try {
    const response = await irys.upload(buff, {
      tags: tags
    });
    console.log(`File uploaded ==> https://gateway.irys.xyz/${response.id}`);
    return `https://gateway.irys.xyz/${response.id}`;
  } catch (e) {
    console.log("Error uploading file ", e);
  }

};

const getimageuriproc_byIrysUploader = async (file: any, tokenName, symbol, description, website, telegram, twitter, discord: string) => {
  try {
    const imageuri = await uploadData(file.buffer);
    if (imageuri !== '') {
      const upJson = {
        name: tokenName,
        symbol: symbol,
        image: imageuri,
        showName: true,
        description: description,
        extensions: {
          website: website,
          telegram: telegram,
          twitter: twitter,
          discord: discord
        },
      };
      const jsonuri = await uploadJson(JSON.stringify(upJson));
      return jsonuri;
    }

  } catch (err) {
    console.log('err: ', err);
    return 'err';
  }

}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();
    //form.uploadDir = "/temp";
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ uri: '文件上传失败' });
        return;
      }
      // You data goes here
      //const { tokenname, symbol, description, website, telegram, twitter, wordArray, key } = req.body;
      const uploadfile = files.file;
      const buffer = fs.readFileSync(uploadfile.path);
      const file = toMetaplexFile(buffer, uploadfile.name);
      const { tokenname, symbol, description, website, telegram, twitter, wordArray, key } = fields;
      console.log(tokenname + "," + symbol + "," + description + "," + website + "," + telegram + "," + twitter + "," + wordArray + "," + key);
      //console.log('toMetaplexFile:',file);
      //res.status(200).json({ uri: "imageUri" });
      if (key === "PCCAR4Fs2-Fuck U !") {
        // 上传文件并获取图片 URI
        try {
          const imageUri = await getimageuriproc_byIrysUploader(file, tokenname, symbol, description, website, telegram, twitter, wordArray);

          res.status(200).json({ uri: imageUri });
        } catch (error) {
          console.error('上传文件失败:', error);
          res.status(500).json({ uri: '上传文件失败' });
        }
      } else if (key === "AAABBB-Fuck U !") {   //只上传图片
        //=============
        const connection = new Connection(process.env.NEXT_PUBLIC_RPC);

        const userWallet = Keypair.fromSecretKey(bs58.decode(mysiyao));

        const newMetaplex = Metaplex.make(connection)
          .use(
            irysStorage(
              {
                address: process.env.NEXT_PUBLIC_NODE,  //上传检查api
                providerUrl: process.env.NEXT_PUBLIC_RPC,//RPC
                timeout: 60000,
              }
            )
          )
          .use(keypairIdentity(userWallet));
        console.log("Getting token accounts...");
        //const imagefile = await toMetaplexFileFromBrowser(file)
        const imageUri = await newMetaplex.storage().upload(file);
        res.status(200).json({ uri: imageUri });
      }
    });
  } else {
    // 非 POST 请求返回错误信息
    res.status(405).json({ uri: '只允许 POST 请求' });
  }
}

