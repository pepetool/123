

type TransactionSuccessProps = {
  txSig: string;
  message: string;
};
export type ClusterType = "mainnet-beta" | "testnet" | "devnet" | "custom";

export function getExplorerLink(txSig: string, cluster: ClusterType): string {
  return `https://explorer.solana.com/tx/${txSig}?cluster=${
    cluster === "mainnet-beta" ? null : cluster
  }`;
}

const getcluster=()=>{
  return process.env.NEXT_PUBLIC_DEBUG==="true"? "devnet" : "mainnet-beta"
}

export default function TransactionToast({
  txSig,
  message,
}: TransactionSuccessProps) {
  const  cluster  = getcluster();
  return (
    <div className="flex flex-col space-y-1">
      <p>{message}</p>
      <a
        href={getExplorerLink(txSig, cluster)}
        target="_blank"
        rel="noopener noreferrer"
        className="italic font-light text-sm"
      >
        View transaction
      </a>
    </div>
  );
}
