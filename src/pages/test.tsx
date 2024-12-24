import type { NextPage } from "next";
import Head from "next/head";
import { TestView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>PEPE工具 | PEPEtool | 便捷的Solana工具箱</title>
        <meta
          name="description"
          content="Solana Scaffold"
        />
      </Head>
      <TestView />
    </div>
  );
};

export default Home;
