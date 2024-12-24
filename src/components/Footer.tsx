import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    SendOutlined,
    XOutlined,
    MailOutlined,
    GithubOutlined,
    CopyrightOutlined
} from '@ant-design/icons';

export const Footer: FC = () => {
    return (
        <div className="flex">
            <footer className="border-t-2 border-[#141414] bg-black hover:text-white w-screen" >
                <div className="ml-2 py-2 mr-2">
                    <div className='flex justify-center items-center space-x-5'>
                        <div className='flex items-center text-slate-300' >
                            {/* <Image
                                    src="/tg.png"
                                    alt="Telegram icon"
                                    width={36}
                                    height={36}
                                /> */}
                            <CopyrightOutlined style={{ fontSize: '18px' }}/>
                            2024 PEPETool Corp.
                        </div>

                        <Link href="https://t.me/php520a" target="_blank" rel="noopener noreferrer" passHref className="text-secondary hover:text-white">
                            <div className='flex items-center text-slate-300' >
                                {/* <Image
                                    src="/tg.png"
                                    alt="Telegram icon"
                                    width={36}
                                    height={36}
                                /> */}
                                <SendOutlined />
                                Telegram
                            </div>
                        </Link>



                        <Link href="https://twitter.com/pepetoolcc" target="_blank" rel="noopener noreferrer" passHref className="text-secondary hover:text-white">
                            <div className='flex items-center text-slate-300' >
                                {/* <Image
                                    src="/x.png"
                                    alt="X icon"
                                    width={36}
                                    height={36}
                                /> */}
                                <XOutlined />
                                Twitter
                            </div>
                        </Link>

                        <Link href="https://github.com/pepetool/pepetool-tool" target="_blank" rel="noopener noreferrer" passHref className="text-secondary hover:text-white">
                            <div className='flex items-center text-slate-300' >
                                {/* <Image
                                    src="/x.png"
                                    alt="X icon"
                                    width={36}
                                    height={36}
                                /> */}
                                <GithubOutlined />
                                Github
                            </div>
                        </Link>

                        <Link href="mailto:dennymeng444@protonmail.com" target="_blank" rel="noopener noreferrer" passHref className="text-secondary hover:text-white">
                            <div className='flex items-center text-slate-300' >
                                {/* <Image
                                    src="/email.png"
                                    alt="email icon"
                                    width={36}
                                    height={36}
                                /> */}
                                <MailOutlined />
                                Email
                            </div>
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};
