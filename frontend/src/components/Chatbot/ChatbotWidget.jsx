
import React, { useState, useRef, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { sendMessage } from '../../services/chatbotService';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const ChatbotWidget = () => {
    const { pathname } = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! I'm your FlyUp Course Counselor. Looking for a course? Ask me anything!", sender: 'bot' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage = inputValue.trim();
        setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
        setInputValue('');
        setIsLoading(true);

        try {
            const data = await sendMessage(userMessage);
            setMessages(prev => [...prev, { text: data.response, sender: 'bot' }]);
        } catch (error) {
            console.error(error);
            toast.error("Sorry, I'm having trouble connecting right now.");
            setMessages(prev => [...prev, { text: "Sorry, I encountered an error. Please try again later.", sender: 'bot' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    // Hide chatbot on login page
    if (pathname === '/login' || pathname === '/register') {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <Motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="mb-4 w-80 md:w-96 bg-[#16161e] rounded-2xl shadow-xl border border-[#2a2a3a] overflow-hidden flex flex-col"
                        style={{ height: '500px', maxHeight: '80vh' }}
                    >
                        {/* Header */}
                        <div className="bg-[#16161e] p-4 flex justify-between items-center border-b border-[#2a2a3a]">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border border-primary/20">
                                    <img 
                                        src="/FLYUPLOGO2.png" 
                                        alt="FlyUp Logo" 
                                        className="w-full h-full object-cover p-1"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-white">FLY UP AI Counselor</h3>
                                    <p className="text-xs text-gray-400">AI-Powered Helper</p>
                                </div>
                            </div>
                            <button onClick={toggleChat} className="text-gray-400 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a14] space-y-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                                            msg.sender === 'user'
                                                ? 'bg-primary text-white rounded-br-none'
                                                : 'bg-[#16161e] text-gray-200 border border-[#2a2a3a] rounded-bl-none'
                                        }`}
                                    >
                                        <div>
                                            {msg.sender === 'user' ? (
                                                <span className="whitespace-pre-wrap">{msg.text}</span>
                                            ) : (
                                                <ReactMarkdown 
                                                    components={{
                                                        p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />, // eslint-disable-line no-unused-vars
                                                        ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-1 last:mb-0" {...props} />, // eslint-disable-line no-unused-vars
                                                        ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-1 last:mb-0" {...props} />, // eslint-disable-line no-unused-vars
                                                        li: ({node, ...props}) => <li className="mb-0.5 last:mb-0 [&>p]:mb-0" {...props} />, // eslint-disable-line no-unused-vars
                                                        a: ({node, ...props}) => <a className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer" {...props} />, // eslint-disable-line no-unused-vars
                                                        strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />, // eslint-disable-line no-unused-vars
                                                    }}
                                                >
                                                    {msg.text}
                                                </ReactMarkdown>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-[#16161e] p-3 rounded-2xl rounded-bl-none border border-[#2a2a3a] flex items-center gap-1">
                                        <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                        <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-[#16161e] border-t border-[#2a2a3a]">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask about courses..."
                                    className="flex-1 bg-[#0a0a14] text-white text-sm rounded-full px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-500 border border-[#2a2a3a]"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={isLoading || !inputValue.trim()}
                                    className="p-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </Motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <Motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleChat}
                className="bg-primary hover:bg-primary/90 text-white p-4 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center transition-all group border border-white/10"
            >
                {isOpen ? (
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                ) : (
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    </div>
                )}
            </Motion.button>
        </div>
    );
};

export default ChatbotWidget;
