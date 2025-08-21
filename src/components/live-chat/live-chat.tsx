import React from 'react';
import { MessageCircle, X, Send, Circle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Chat is disabled when VITE_CHAT_ENABLED is false
const isChatEnabled = import.meta.env.VITE_CHAT_ENABLED === 'true';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

interface Agent {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
}

const MOCK_AGENT: Agent = {
  id: '1',
  name: 'Support Agent',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=support',
  status: 'online',
};

interface LanguageOption {
  code: string;
  name: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
];

export function LiveChat() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>(() => {
    const saved = localStorage.getItem('chat_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [selectedLanguage, setSelectedLanguage] = React.useState('en');
  const { user } = useAuthStore();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout>();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value);
  };

  const translateMessage = async (text: string, targetLang: string) => {
    // Dummy translation function (replace with actual API call)
    return text;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const translatedMessage = await translateMessage(inputValue, selectedLanguage);
    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: translatedMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');
    simulateTyping();
  };

  const simulateTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleOpenChat = () => {
    if (!user) {
      toast.error('Please sign in to use the chat');
      return;
    }
    setIsOpen(true);
  };

  const getMessageStatus = (status?: string) => {
    switch (status) {
      case 'sent':
        return '•';
      case 'delivered':
        return '••';
      case 'read':
        return '•••';
      default:
        return '';
    }
  };

  if (!user || !isChatEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {isOpen ? (
        <div className="w-80 rounded-lg bg-white shadow-lg">
          <div className="border-b p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 overflow-hidden rounded-full">
                  <img 
                    src={MOCK_AGENT.avatar} 
                    alt={MOCK_AGENT.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{MOCK_AGENT.name}</h3>
                  <div className="flex items-center gap-1">
                    <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                    <span className="text-sm text-gray-500">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select value={selectedLanguage} onChange={handleLanguageChange}>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="h-96 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      <span className="text-xs opacity-75">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                      {message.sender === 'user' && (
                        <span className="text-xs opacity-75">
                          {getMessageStatus(message.status)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg bg-gray-100 p-3">
                    <div className="flex gap-1">
                      <span className="animate-bounce">•</span>
                      <span className="animate-bounce delay-100">•</span>
                      <span className="animate-bounce delay-200">•</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 rounded-full"
                disabled={!inputValue.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={handleOpenChat}
          className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-lg hover:bg-blue-700"
          title="Chat with us"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm">Live Chat</span>
        </button>
      )}
    </div>
  );
}