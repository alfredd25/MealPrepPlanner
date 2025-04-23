import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useChatStore } from '../store/chatStore';
import { useThemeStore } from '../store/themeStore';
import { useUserStore } from '../store/userStore';

// Icons (from heroicons)
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  ShoppingCartIcon,
  BookOpenIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { mode, setMode } = useThemeStore();
  const { chats, createNewChat, setActiveChat, deleteChat } = useChatStore();
  const { isAuthenticated, profile } = useUserStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const toggleTheme = () => {
    const modes: Array<'light' | 'dark'> = ['light', 'dark'];
    const currentIndex = modes.indexOf(mode as 'light' | 'dark');
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
  };
  
  const handleNewChat = () => {
    createNewChat();
    router.push('/');
  };
  
  const ThemeIcon = () => {
    if (mode === 'dark') return <SunIcon className="w-5 h-5" />;
    return <MoonIcon className="w-5 h-5" />;
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  const sidebarContent = (
    <>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-primary">Meal Prep Planner</h1>
      </div>
      
      <div className="space-y-6 flex-1 overflow-y-auto">
        <div className="px-4">
          <button
            onClick={handleNewChat}
            className="btn btn-primary w-full flex items-center justify-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New Chat</span>
          </button>
        </div>
        
        <nav className="px-4 space-y-1">
          <Link href="/" className={`sidebar-item ${router.pathname === '/' ? 'sidebar-item-active' : ''}`}>
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            <span>Chat</span>
          </Link>
          
          <Link href="/recipes" className={`sidebar-item ${router.pathname === '/recipes' ? 'sidebar-item-active' : ''}`}>
            <BookOpenIcon className="w-5 h-5" />
            <span>Recipes</span>
          </Link>
          
          <Link href="/shopping-list" className={`sidebar-item ${router.pathname === '/shopping-list' ? 'sidebar-item-active' : ''}`}>
            <ShoppingCartIcon className="w-5 h-5" />
            <span>Shopping List</span>
          </Link>
        </nav>
        
        <div className="px-4 mt-2">
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Recent Chats
            </h3>
            <ul className="mt-2 space-y-1">
              {chats.slice(0, 5).map(chat => (
                <li key={chat.id}>
                  <div className="flex items-center w-full">
                    <button
                      onClick={() => {
                        setActiveChat(chat.id);
                        router.push('/');
                      }}
                      className="sidebar-item w-full text-left truncate flex-grow"
                    >
                      <ChatBubbleLeftRightIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{chat.title}</span>
                    </button>
                    <button 
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="p-1.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                      title="Delete chat"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <button 
            onClick={toggleTheme}
            className="sidebar-item"
            title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
          >
            <ThemeIcon />
            <span>{mode === 'light' ? 'Dark' : 'Light'} Mode</span>
          </button>
        </div>
        
        <div className="mt-4">
          <Link 
            href={isAuthenticated ? "/profile" : "/login"} 
            className="sidebar-item"
          >
            <UserCircleIcon className="w-5 h-5" />
            <span>{isAuthenticated ? profile?.name || 'Profile' : 'Sign In'}</span>
          </Link>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 rounded-md bg-gray-100 dark:bg-gray-800"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setMobileSidebarOpen(false)}>
            <div 
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 shadow-xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => setMobileSidebarOpen(false)}>
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              {sidebarContent}
            </div>
          </div>
        )}
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {sidebarContent}
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
} 