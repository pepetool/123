// src/components/EndpointUpdater.tsx
import React, { FC, useState } from 'react';
import { useEndpoint } from '../contexts/EndpointProvider';
import { Button, Col, Flex, Input, Modal, Row, Space, Table, TableColumnsType, Tag, Typography } from 'antd';

interface EndpointProps {
    isModalOpen: boolean,
    handleCancel: () => void;
}

const { Title } = Typography;
import {
    RedoOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import { FOX_RpcList } from 'utils/config';


interface DataType {
    key: React.Key;
    name: string;
    ping: any;
}

const columns: TableColumnsType<DataType> = [
    {
        title: '节点',
        dataIndex: 'name',
        render: (text: string) => <a>{text}</a>,
    },
    {
        title: 'Ping',
        dataIndex: 'ping',
        render: (any: any) => <div>{any}</div>,
    },
];





const EndpointUpdater: FC<EndpointProps> = ({ isModalOpen, handleCancel }) => {
    function getRandomPing() {
        return Math.floor(Math.random() * (1500 - 500 + 1)) + 500;
    }
    const { endpoint, setEndpoint } = useEndpoint();
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>(['1']);
    const [msList, setMsList] = useState<number[]>([getRandomPing(), getRandomPing(), getRandomPing()]);
    const [refing, setRefIng] = useState(false);
    //const [newEndpoint, setNewEndpoint] = useState(endpoint);

    // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setNewEndpoint(e.target.value);
    // };

    const data: DataType[] = [
        {
            key: '1',
            name: FOX_RpcList[0].name,
            ping:
                <Tag color={"green"} >
                    {msList[0]} ms
                </Tag>
        },
        {
            key: '2',
            name: FOX_RpcList[1].name,
            ping:
                <Tag color={"green"} >
                    {msList[1]} ms
                </Tag>
        },
        {
            key: '3',
            name: FOX_RpcList[2].name,
            ping:
                <Tag color={"green"} >
                    {msList[2]} ms
                </Tag>
        },
        // {
        //     key: '4',
        //     name: 'Disabled User',
        //     ping:
        //         <Tag color={"green"} >
        //             666 ms
        //         </Tag>
        // },
    ];

    const handleUpdate = () => {
        const ranDoc = document.getElementById('defrpc') as HTMLInputElement | null;
        const value = ranDoc?.value;
        setEndpoint(value);
        handleCancel();
    };

    async function ping(url) {
        const startTime = Date.now();
        try {
            const response = await fetch(url);
            const endTime = Date.now();
            const latency = endTime - startTime;
            return latency;
        } catch (error) {
            console.error("Ping failed:", error);
            return -1; // Return -1 if ping fails
        }
    }

    const handleRefRpc = async () => {
        //
        setRefIng(true);
        //FOX_RpcList.map(item => item.addr)
        try {
            for (let i = 0; i < FOX_RpcList.length; i++) {
                const url = FOX_RpcList[i].addr;
                msList[i] = await ping(url);
            }
        } finally {
            setRefIng(false)
        }

        // setTimeout(() => {
        //     setRefIng(false)    
        // }, 5000);
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedRowKeys: React.Key[], selectedRows: DataType[]) => {
            //console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
            setSelectedRowKeys(selectedRowKeys.map(key => String(key))); // 更新selectedRowKeys
            const key = Number(selectedRowKeys);
            if (key !== -1 && key <= FOX_RpcList.length) {
                setEndpoint(FOX_RpcList[key - 1].addr);
            }

        },
        getCheckboxProps: (record: DataType) => ({
            disabled: record.name === 'Disabled User', // Column configuration not to be checked
            name: record.name,
        }),
    };

    return (
        <div>
            {/* <input type="text" value={newEndpoint} onChange={handleChange} />
            <button onClick={handleUpdate}>Update Endpoint</button>
            <p>Current Endpoint: {endpoint}</p> */}
            <Flex gap="middle" align="start" vertical>
                <Modal title="" open={isModalOpen}
                    width={400}
                    onCancel={handleCancel}
                    footer={[
                        // <Button key="back" onClick={handleCancel}>
                        //   Return
                        // </Button>,
                    ]}>
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Title level={4}>RPC节点</Title>
                        </Col>
                        <Col style={{ marginRight: 30, cursor: 'pointer' }}>
                            {!refing ? <RedoOutlined onClick={handleRefRpc} /> : <LoadingOutlined />}
                        </Col>
                    </Row>
                    {/* 111111 */}

                    <Table
                        rowSelection={{
                            type: 'radio',
                            ...rowSelection,
                        }}
                        columns={columns}
                        dataSource={data}
                        pagination={false}
                    />



                    <Flex align={"center"} justify='center'>
                        {/* <Button key="back" onClick={handleCancel}>
                            111
                        </Button> */}

                        <Space.Compact style={{ width: '100%' }}>
                            <Input placeholder="自定义节点" id='defrpc' />
                            <Button type="primary" onClick={handleUpdate}>自定义</Button>
                        </Space.Compact>
                    </Flex>

                </Modal>
            </Flex>
        </div>
    );
};

export default EndpointUpdater;
