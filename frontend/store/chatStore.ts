import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Recipe } from './mealPlanStore';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createNewChat: () => string;
  setActiveChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;
  sendMessage: (content: string) => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      isLoading: false,
      error: null,
      
      createNewChat: () => {
        const newChat: Chat = {
          id: generateId(),
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        set(state => ({
          chats: [newChat, ...state.chats],
          activeChatId: newChat.id,
        }));
        
        return newChat.id;
      },
      
      setActiveChat: (chatId) => {
        set({ activeChatId: chatId });
      },
      
      deleteChat: (chatId) => {
        set(state => {
          const newChats = state.chats.filter(chat => chat.id !== chatId);
          
          // If we're deleting the active chat, set a new active chat
          let newActiveChatId = state.activeChatId;
          if (state.activeChatId === chatId) {
            newActiveChatId = newChats.length > 0 ? newChats[0].id : null;
          }
          
          return {
            chats: newChats,
            activeChatId: newActiveChatId,
          };
        });
      },
      
      renameChat: (chatId, newTitle) => {
        set(state => ({
          chats: state.chats.map(chat => 
            chat.id === chatId 
              ? { ...chat, title: newTitle, updatedAt: Date.now() } 
              : chat
          )
        }));
      },
      
      sendMessage: async (content) => {
        const { activeChatId, chats } = get();
        
        // If no active chat, create one
        if (!activeChatId) {
          const newChatId = get().createNewChat();
        }
        
        // Add user message
        const userMessage: ChatMessage = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: Date.now(),
        };
        
        set(state => {
          const updatedChats = state.chats.map(chat => 
            chat.id === state.activeChatId
              ? { 
                  ...chat, 
                  messages: [...chat.messages, userMessage],
                  updatedAt: Date.now(),
                  // If this is the first message, update the title
                  title: chat.messages.length === 0 
                    ? content.substring(0, 30) + (content.length > 30 ? '...' : '')
                    : chat.title
                } 
              : chat
          );
          
          return {
            chats: updatedChats,
            isLoading: true,
            error: null,
          };
        });
        
        try {
          // Get the active chat with the updated user message
          const activeChat = get().chats.find(c => c.id === get().activeChatId);
          
          if (!activeChat) {
            throw new Error('No active chat found');
          }
          
          // Make API call to the new gemini endpoint
          const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: content,
              history: activeChat.messages
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to get response');
          }
          
          const data = await response.json();
          
          // Add assistant message
          const assistantMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: data.response,
            timestamp: Date.now(),
          };
          
          set(state => ({
            chats: state.chats.map(chat => 
              chat.id === state.activeChatId
                ? { 
                    ...chat, 
                    messages: [...chat.messages, assistantMessage],
                    updatedAt: Date.now(),
                  } 
                : chat
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to get response' 
          });
          
          // Add error message
          const errorMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: 'Sorry, I encountered an error while processing your request.',
            timestamp: Date.now(),
          };
          
          set(state => ({
            chats: state.chats.map(chat => 
              chat.id === state.activeChatId
                ? { 
                    ...chat, 
                    messages: [...chat.messages, errorMessage],
                    updatedAt: Date.now(),
                  } 
                : chat
            )
          }));
        }
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
      }),
    }
  )
);