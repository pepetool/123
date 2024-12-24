// src/contexts/EndpointProvider.tsx
import React, { createContext, FC, ReactNode, useContext, useState } from 'react';
import { getPublicRpc } from 'utils/config';

const EndpointContext = createContext({
    endpoint: '',
    setEndpoint: (newEndpoint: string) => {},
});

export const EndpointProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [endpoint, setEndpoint] = useState(process.env.NEXT_PUBLIC_DEBUG === "true" ? process.env.NEXT_PUBLIC_RPC_DEV : getPublicRpc());

    return (
        <EndpointContext.Provider value={{ endpoint, setEndpoint }}>
            {children}
        </EndpointContext.Provider>
    );
};

export const useEndpoint = () => useContext(EndpointContext);
