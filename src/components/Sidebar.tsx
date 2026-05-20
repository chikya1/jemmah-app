import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, currentView, setCurrentView }) => {
  const menuItems = [
    { id: 'chat', label: 'Assistant', icon: '💬' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'vault', label: 'Collections', icon: '🗂️' },
  ];

  const sidebarContent = (
    <div className="w-64 h-full bg-[#0d0d0d] border-r border-[#2a2a2a] flex flex-col text-[#F5F0EB]">
      <div className="h-16 flex items-center px-6 border-b border-[#2a2a2a] gap-3">
        <span className="text-xl font-bold tracking-wide text-[#7B1F4B]">Jemmah</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setCurrentView(item.id); setIsOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
              currentView === item.id ? 'bg-[#7B1F4B] text-[#F5F0EB]' : 'text-[#9A8F8A] hover:bg-[#1a1a1a]'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Permanent on Desktop */}
      <div className="hidden md:flex h-full w-64 flex-shrink-0">{sidebarContent}</div>
      {/* Overlay Drawer on Mobile */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="relative z-10 h-full max-w-xs bg-[#0d0d0d]">
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
