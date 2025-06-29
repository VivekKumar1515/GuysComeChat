"use client"

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from "react";

type ChatContextType = {
  roomId: string;
  setRoomId: Dispatch<SetStateAction<string>>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  connected: boolean;
  setConnected: Dispatch<SetStateAction<boolean>>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);


export const ChatProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [roomId, setRoomId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  

  return (
    <ChatContext.Provider value={{ roomId, setRoomId, name, setName, connected, setConnected }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
