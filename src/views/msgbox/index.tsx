import { FC, useState } from 'react';
import { Button, Modal, Flex, Typography, Tooltip } from 'antd';
import {
    CopyOutlined,
    CheckCircleOutlined,
    InfoCircleFilled
} from '@ant-design/icons';
import { useTranslation } from 'next-i18next'
import Link from 'next/link';


export const useMessageBoxPam = (initialPam: MessageBoxPam): [MessageBoxPam, (pam: MessageBoxPam) => void] => {
    const [messageBoxPam, setMessageBoxPam] = useState<MessageBoxPam>(initialPam);

    const updateMessageBoxPam = (pam: MessageBoxPam) => {
        setMessageBoxPam(pam);
    };

    return [messageBoxPam, updateMessageBoxPam];
};

const { Title, Text } = Typography;

export type MessageBoxPam = {
    addrTag: string | ""
    addrName: string | ""
    addr1: string | ""
    hxName: string | ""
    hxAddr: string | ""
}

interface MsgBoxProps {
    isModalOpen: boolean,
    msgParam: MessageBoxPam,
    handleCancel: () => void;
}


const MsgBoxView: FC<MsgBoxProps> = ({ isModalOpen, msgParam, handleCancel }) => {
    const { t } = useTranslation('common');
    const [isCopy, setisCopy] = useState(false);
    const [isCopy2, setisCopy2] = useState(false);

    const onclick = () => {
        navigator.clipboard.writeText(msgParam.addr1)
        setisCopy(true);
        setTimeout(() => {
            setisCopy(false);
        }, 1000);
    }


    const onclick2 = () => {
        navigator.clipboard.writeText(msgParam.hxAddr)
        setisCopy2(true);
        setTimeout(() => {
            setisCopy2(false);
        }, 1000);
    }

    const truncateString = (str, maxLength) => {
        if (str.length <= maxLength) {
            return str;
        } else {
            return str.substring(0, maxLength / 2) + '...' + str.substring(str.length - maxLength / 2);
        }
    };

    return (
        <Flex gap="middle" align="start" vertical>
            <Modal title="" open={isModalOpen}
                width={600}
                onCancel={handleCancel}
                footer={[
                    // <Button key="back" onClick={handleCancel}>
                    //   Return
                    // </Button>,
                ]}>
                <Flex align="center" justify='center'>
                    <Title level={2}>{t('msgbox.h1')}</Title>
                </Flex>

                <Flex align={"center"} justify='center'>
                    <Title level={5} type='warning' > {t('msgbox.t1')} </Title>
                </Flex>

                <Flex align={"center"} justify='center'>
                    <Text > {t('msgbox.t2')} </Text>
                </Flex>

                {msgParam.addr1 !== "" &&
                    <Flex align={"center"} justify='flex-start'>
                        <Title level={5}>{msgParam.addrName} <Text type="success">{msgParam.addr1}</Text>
                            {isCopy ? <CheckCircleOutlined /> : <Tooltip title="copy"> <CopyOutlined onClick={onclick} /> </Tooltip >}
                            <Tooltip title="Open in browser">
                                <Link href={`https://solscan.io/${msgParam.addrTag}/${msgParam.addr1}`} target="_blank" rel="noopener noreferrer" passHref> <InfoCircleFilled /></Link>
                            </Tooltip>
                        </Title>
                    </Flex>
                }

                <Flex align={"center"} justify='flex-start'>
                    <Title level={5}>{msgParam.hxName} <Text type="success">{msgParam.hxAddr}</Text>
                        {isCopy2 ? <CheckCircleOutlined /> : <Tooltip title="copy"> <CopyOutlined onClick={onclick2} /> </Tooltip >}
                        <Tooltip title="Open in browser">
                            <Link href={`https://solscan.io/tx/${msgParam.hxAddr}`} target="_blank" rel="noopener noreferrer" passHref> <InfoCircleFilled /> </Link>
                        </Tooltip>
                    </Title>
                </Flex>


                <Flex align={"center"} justify='center'>
                    <Button key="back" onClick={handleCancel}>
                        {t('msgbox.btn')}
                    </Button>
                </Flex>

            </Modal>
        </Flex>
    );
};

export default MsgBoxView;
