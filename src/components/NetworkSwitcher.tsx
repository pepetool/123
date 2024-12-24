import { FC } from 'react';
import dynamic from 'next/dynamic';
import { useNetworkConfiguration } from '../contexts/NetworkConfigurationProvider';

const NetworkSwitcher: FC = () => {
  const { networkConfiguration, setNetworkConfiguration } = useNetworkConfiguration();

  //console.log('111111111'+networkConfiguration);

  return (
    <label className="cursor-pointer label">
      <a>Network</a>
      <select             
        value={networkConfiguration}
        onChange={(e) => setNetworkConfiguration(e.target.value)} 
        className="select max-w-xs"
      >
        {/* 当前可选网络类型 */}
        <option value="mainnet-beta">main</option>
        {process.env.NEXT_PUBLIC_DEBUG==="true" && <option value="devnet">dev</option> }
        {process.env.NEXT_PUBLIC_DEBUG==="true" && <option value="testnet">test</option>}
        
      </select>
    </label>
  );
};

export default dynamic(() => Promise.resolve(NetworkSwitcher), {
  ssr: false
})