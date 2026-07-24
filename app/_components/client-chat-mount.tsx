'use client';

import dynamic from 'next/dynamic';

// динамический импорт уже в КЛИЕНТ-КОМПОНЕНТЕ, тут можно ssr:false
const ChatWidget = dynamic(() => import('./chat-widget'), { ssr: false });

export default function ClientChatMount() {
    return <ChatWidget />;
}
