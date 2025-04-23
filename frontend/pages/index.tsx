import Head from 'next/head';
import Layout from '../components/Layout';
import ChatInterface from '../components/ChatInterface';

export default function Home() {
  return (
    <>
      <Head>
        <title>Meal Prep Planner</title>
        <meta name="description" content="AI-powered meal prep planning assistant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Layout>
        <div className="h-full">
          <ChatInterface />
        </div>
      </Layout>
    </>
  );
} 