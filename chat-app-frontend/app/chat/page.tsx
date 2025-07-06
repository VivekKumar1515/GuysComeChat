/* eslint-disable */

"use client";

import type React from "react";
import { ImageIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Users,
  Settings,
  Phone,
  Video,
  MoreVertical,
  Circle,
  Paperclip,
  Download,
  FileText,
  File,
} from "lucide-react";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { useChatContext } from "../context/ChatContext";
import { useRouter } from "next/navigation";
import SockJS from "sockjs-client";
import { baseURL } from "../service/AxiosHelper";
import { type Client, Stomp } from "@stomp/stompjs";
import { RoomService } from "../service/RoomService";

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  preview?: string;
}

interface Message {
  id: string | null;
  userId: string;
  userName: string;
  content: string;
  roomId: string;
  timestamp: Date;
  isCurrentUser: boolean;
  attachments?: Attachment[];
}

interface Participant {
  id: string;
  name: string;
  isOnline: boolean;
  avatar?: string;
}

export default function ChatRoom() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const [participants, setParticipants] = useState<Participant[]>([]);

  const { roomId, name, connected, setConnected } = useChatContext();
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const [stompClient, setStompClient] = useState<Client | null>(null);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const notifyStatus = (isActive: boolean) => {
  if (stompClient && stompClient.connected) {
    const payload = JSON.stringify({
      roomId: roomId,
      name: name
    });

    if (isActive) {
      stompClient.send(`/app/participant/join/${roomId}`, {}, payload);
    } else {
      stompClient.send(`/app/participant/left/${roomId}`, {}, payload);
    }
  }
};

  useEffect(() => {
    if (!roomId || roomId.trim() === "") {
      router.push("/");
    }
  }, [roomId, name]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const connectWebSocket = () => {
      const sock = new SockJS(`${baseURL}/chat`);
      const client = Stomp.over(sock);

      client.connect({}, () => {
        setStompClient(client);
        console.log("connected");

        // Subscribe to messages
        client.subscribe(`/topic/room/${roomId}`, (message) => {
          console.log("Message received:", message);
          const newMessage: Message = JSON.parse(message.body);
          newMessage.isCurrentUser = newMessage.userName === name;
          setMessages((prev) => [...prev, newMessage]);
        });

        // Subscribe to typing indicators
        client.subscribe(`/topic/typing/${roomId}`, (message) => {
          console.log("Typing status received:", message);
          const typingStatus = JSON.parse(message.body);

          // Don't show typing indicator for current user
          if (typingStatus.userName === name) return;

          if (typingStatus.isTyping === true) {
            setTypingUsers((prev) => {
              // Avoid duplicates
              if (!prev.includes(typingStatus.userName)) {
                return [...prev, typingStatus.userName];
              }
              return prev;
            });
          } else {
            setTypingUsers((prev) =>
              prev.filter((userName) => userName !== typingStatus.userName)
            );
          }
        });

        client.subscribe(`/topic/participants/${roomId}`, (message) => {
          console.log("Participant's status received:", message);
          const participant: Participant = JSON.parse(message.body);

          setParticipants((prev) => {
            const existingIndex = prev.findIndex(
              (p) => p.name === participant.name
            );

            if (existingIndex !== -1) {
              // Update the isOnline status immutably
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                isOnline: participant.isOnline,
              };
              return updated;
            } else {
              // Add new participant
              return [...prev, participant];
            }
          });
        });
      });
    };

    if (connected) {
      connectWebSocket();
    }

    // Cleanup function
    return () => {
      if (stompClient) {
        stompClient.disconnect();
      }
    };
  }, [roomId, connected, name]);


  useEffect(() => {
    const fetchParticipants = async () => {
      const response = await RoomService.loadParticipants(roomId);
      console.log(response.data);
      setParticipants(response.data);
    }

    if(connected) {
      fetchParticipants();
    }
  }, [])

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await RoomService.loadMessages(roomId, 0, 100);
      const messagesData: Message[] = response.data;
      const updatedResponse = messagesData.map((textBody) => ({
        ...textBody,
        isCurrentUser: textBody.userName === name,
      }));
      setMessages(updatedResponse);
    };

    if (connected) {
      fetchMessages();
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      if(connected) {
      console.log("notifying people")
      notifyStatus(true);
    }
    }, 1000)
  }, [name, roomId, connected, stompClient])

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const formatTime = (input: string) => {
    const date = new Date(input);
    if (isNaN(date.getTime())) return "Invalid time";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    if (type.includes("pdf") || type.includes("document"))
      return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files: File[]): Promise<Attachment[]> => {
    setIsUploading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const attachments: Attachment[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));

    setIsUploading(false);
    return attachments;
  };

  const handleSendMessage = async () => {
    if (!message.trim() && selectedFiles.length === 0) return;

    let attachments: Attachment[] = [];

    if (selectedFiles.length > 0) {
      attachments = await uploadFiles(selectedFiles);
    }

    const newMessage: Message = {
      id: name.replace(" ", "").toLowerCase() + ":" + Date.now().toString(),
      userId: name + ":" + roomId,
      userName: name,
      content: message,
      timestamp: new Date(),
      roomId: roomId,
      isCurrentUser: true,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    await stompClient?.send(
      `/app/sendMessage/${roomId}`,
      {},
      JSON.stringify(newMessage)
    );

    setMessage("");
    setSelectedFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isTypingRef = useRef(false);

  const handleTyping = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key == "Enter") return;
    if (!stompClient) return;

    // Send typing event only once per typing session
    if (!isTypingRef.current) {
      stompClient.send(
        `/app/typing/${roomId}`,
        {},
        JSON.stringify({
          roomId,
          userName: name,
          isTyping: true,
        })
      );
      isTypingRef.current = true;
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Reset timer on every keypress
    typingTimeoutRef.current = setTimeout(() => {
      if (stompClient) {
        stompClient.send(
          `/app/stopTyping/${roomId}`,
          {},
          JSON.stringify({
            roomId,
            userName: name,
            isTyping: false,
          })
        );
        isTypingRef.current = false;
      }
    }, 2000);
  };

  // Profile dropdown handlers
  const handleUpdateProfile = () => {
    console.log("Update profile clicked");
    // Add your update profile logic here
  };

  const handleExitChat = () => {
    console.log("Exit chat clicked");

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // notifyStatus(false);

    // Disconnect WebSocket
    if (stompClient) {
      stompClient.disconnect();
    }

    // Navigate back to lobby
    router.push("/");
  };

  const handleLogout = () => {
    console.log("Logout clicked");

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // notifyStatus(false);

    // Clear user data and navigate to login/home
    if (stompClient) {
      stompClient.disconnect();
    }
    // Clear any stored user data
    router.push("/");
  };

  useEffect(() => {
  const handleVisibilityChange = () => {
    console.log("inside handlevisibilitychange")

    if (document.visibilityState === "hidden") {
      console.log("User switched tab or minimized");
      notifyStatus(false); // offline/inactive
    } else {
      console.log("User is back on the tab");
      notifyStatus(true); // online/active
    }
  };

  const handleBeforeUnload = () => {
    console.log("User is closing or refreshing the tab");
    notifyStatus(false); // mark offline before leaving
  };

  
  const notifyStatus = (isActive: boolean) => {
  if (stompClient && stompClient.connected) {
    const payload = JSON.stringify({
      roomId: roomId,
      name: name
    });

    if (isActive) {
      stompClient.send(`/app/participant/join/${roomId}`, {}, payload);
    } else {
      stompClient.send(`/app/participant/left/${roomId}`, {}, payload);
    }
  }
};


  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [roomId, stompClient, connected, name]);


  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar - Participants */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-300">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-300">
              Room {roomId}
            </h2>
            <Badge
              variant="secondary"
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-300"
            >
              {participants.filter((p) => p.isOnline).length} online
            </Badge>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2 transition-colors duration-300">
              <Users className="w-4 h-4" />
              Participants ({participants.length})
            </h3>
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 transition-colors duration-300">
                      {getInitials(participant.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Circle
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 transition-colors duration-300 ${
                      participant.isOnline
                        ? "fill-green-500 text-green-500"
                        : "fill-gray-400 text-gray-400"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate transition-colors duration-300">
                    {participant.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    {participant.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-300">
                General Chat
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                Room ID: {roomId}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
              >
                <Phone className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
              >
                <Video className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
              <ProfileDropdown
                userName={name}
                onUpdateProfile={handleUpdateProfile}
                onExitChat={handleExitChat}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar-thin smooth-scroll scroll-area-hover bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.isCurrentUser ? "justify-end" : "justify-start"
                }`}
              >
                {!msg.isCurrentUser && (
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors duration-300">
                      {getInitials(msg.userName)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-xs lg:max-w-md ${
                    msg.isCurrentUser ? "order-1" : ""
                  }`}
                >
                  {!msg.isCurrentUser && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1 transition-colors duration-300">
                      {msg.userName}
                    </p>
                  )}

                  <div
                    className={`rounded-lg px-3 py-2 transition-colors duration-300 ${
                      msg.isCurrentUser
                        ? "bg-blue-500 dark:bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                    }`}
                  >
                    {msg.content && <p className="text-sm">{msg.content}</p>}

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className={`space-y-2 ${msg.content ? "mt-2" : ""}`}>
                        {msg.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className={`rounded border transition-colors duration-300 p-2 ${
                              msg.isCurrentUser
                                ? "border-blue-300 dark:border-blue-400 bg-blue-400 dark:bg-blue-500"
                                : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                            }`}
                          >
                            {attachment.preview ? (
                              <div className="space-y-2">
                                <img
                                  src={attachment.preview || "/placeholder.svg"}
                                  alt={attachment.name}
                                  className="max-w-full h-auto rounded max-h-48 object-cover"
                                />
                                <div className="flex items-center justify-between">
                                  <span className="text-xs truncate">
                                    {attachment.name}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-6 w-6 p-0 transition-colors duration-300 ${
                                      msg.isCurrentUser
                                        ? "text-blue-100 hover:text-white"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                    }`}
                                    onClick={() =>
                                      window.open(attachment.url, "_blank")
                                    }
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div
                                  className={`p-1 rounded transition-colors duration-300 ${
                                    msg.isCurrentUser
                                      ? "bg-blue-300 dark:bg-blue-400"
                                      : "bg-gray-200 dark:bg-gray-600"
                                  }`}
                                >
                                  {getFileIcon(attachment.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {attachment.name}
                                  </p>
                                  <p
                                    className={`text-xs transition-colors duration-300 ${
                                      msg.isCurrentUser
                                        ? "text-blue-100"
                                        : "text-gray-500 dark:text-gray-400"
                                    }`}
                                  >
                                    {formatFileSize(attachment.size)}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-6 w-6 p-0 transition-colors duration-300 ${
                                    msg.isCurrentUser
                                      ? "text-blue-100 hover:text-white"
                                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                  }`}
                                  onClick={() =>
                                    window.open(attachment.url, "_blank")
                                  }
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <p
                      className={`text-xs mt-1 transition-colors duration-300 ${
                        msg.isCurrentUser
                          ? "text-blue-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>

                {msg.isCurrentUser && (
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 transition-colors duration-300">
                      {getInitials(msg.userName)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors duration-300">
                    {getInitials(typingUsers[0])}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 transition-colors duration-300">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {typingUsers.length === 1
                        ? `${typingUsers[0]} is typing...`
                        : typingUsers.length === 2
                        ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                        : `${typingUsers[0]} and ${
                            typingUsers.length - 1
                          } others are typing...`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          {/* File Preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  {selectedFiles.length} file
                  {selectedFiles.length > 1 ? "s" : ""} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFiles([])}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-300"
                >
                  Clear all
                </Button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar-thin">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500 transition-colors duration-300"
                  >
                    <div className="p-1 bg-gray-100 dark:bg-gray-500 rounded transition-colors duration-300">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200 transition-colors duration-300">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSelectedFile(index)}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 h-6 w-6 p-0 transition-colors duration-300"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAttachmentClick}
              disabled={isUploading}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              onKeyDown={handleTyping}
              placeholder="Type your message..."
              className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
              disabled={isUploading}
            />

            <Button
              onClick={handleSendMessage}
              disabled={
                (!message.trim() && selectedFiles.length === 0) || isUploading
              }
              className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white transition-colors duration-300"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors duration-300">
            Press Enter to send, Shift + Enter for new line • Attach files up to
            10MB
          </p>
        </div>
      </div>
    </div>
  );
}