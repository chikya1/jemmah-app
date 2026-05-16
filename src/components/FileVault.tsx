import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type VaultItem } from '../lib/LocalDB';
import { Search, Grid, List as ListIcon, FileText, Image as ImageIcon, File, Download, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function FileVault() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const items = useLiveQuery(() => {
    if (!query) return db.vault.orderBy('timestamp').reverse().toArray();
    return db.vault
      .filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
      .toArray();
  }, [query]);

  const deleteItem = async (id: number) => {
    if (confirm('Delete this file from vault?')) {
      await db.vault.delete(id);
    }
  };

  const downloadFile = (item: VaultItem) => {
    const link = document.createElement('a');
    link.href = item.dataUrlOrBlob as string;
    link.download = item.name;
    link.click();
  };

  return (
    <div className="p-8 h-full bg-[#f5f5f0] overflow-y-auto flex flex-col">
      <div className="max-w-6xl mx-auto w-full space-y-8 flex-1 flex flex-col">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Digital Storage</span>
            <h1 className="font-serif italic text-4xl mt-1">File Vault</h1>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
               <input 
                type="text" 
                placeholder="Search files..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white rounded-xl border border-[#141414]/5 text-sm w-64 focus:ring-2 ring-[#141414]/5 transition-all"
               />
             </div>
             <div className="flex bg-white rounded-xl p-1 shadow-sm border border-[#141414]/5">
              <button 
                onClick={() => setView('grid')}
                className={cn("p-1.5 rounded-lg transition-colors", view === 'grid' ? "bg-[#141414] text-white" : "hover:bg-[#141414]/5")}
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setView('list')}
                className={cn("p-1.5 rounded-lg transition-colors", view === 'list' ? "bg-[#141414] text-white" : "hover:bg-[#141414]/5")}
              >
                <ListIcon size={18} />
              </button>
             </div>
          </div>
        </header>

        {view === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6">
            {items?.map((item) => (
              <div 
                key={item.id} 
                className="group bg-white rounded-3xl p-3 shadow-lg hover:shadow-xl transition-all border border-[#141414]/5 relative flex flex-col aspect-square"
              >
                <div className="flex-1 rounded-2xl bg-[#E4E3E0]/30 overflow-hidden mb-3 relative flex items-center justify-center">
                  {item.type === 'image' ? (
                    <img src={item.dataUrlOrBlob as string} alt={item.name} className="w-full h-full object-cover" />
                  ) : item.type === 'pdf' ? (
                    <FileText size={40} className="text-[#141414]/20" />
                  ) : (
                    <File size={40} className="text-[#141414]/20" />
                  )}
                  
                  <div className="absolute inset-0 bg-[#141414]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => downloadFile(item)} className="p-2 bg-white rounded-full hover:scale-110 transition-transform"><Download size={18} /></button>
                    <button onClick={() => deleteItem(item.id!)} className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"><Trash2 size={18} /></button>
                  </div>
                </div>
                <div className="px-1">
                   <p className="text-[11px] font-bold truncate">{item.name}</p>
                   <p className="text-[10px] opacity-40 uppercase tracking-tighter mt-0.5">{format(item.timestamp, 'MMM d, yyyy')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#141414]/5">
            <table className="w-full text-left">
              <thead className="bg-[#141414] text-[#E4E3E0] text-[10px] uppercase font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Added</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/5">
                {items?.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f5f5f0] transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#E4E3E0]/30 flex items-center justify-center overflow-hidden">
                        {item.type === 'image' ? <ImageIcon size={14} /> : <File size={14} />}
                      </div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase bg-[#141414]/5 px-2 py-1 rounded-md">{item.type}</span>
                    </td>
                    <td className="px-6 py-4 text-xs opacity-40">{format(item.timestamp, 'PP')}</td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                        <button onClick={() => downloadFile(item)} className="p-2 hover:bg-[#141414]/5 rounded-lg transition-colors"><Download size={16} /></button>
                        <button onClick={() => deleteItem(item.id!)} className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><Trash2 size={16} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(!items || items.length === 0) && (
          <div className="flex-1 flex items-center justify-center py-20">
             <div className="text-center opacity-30 italic font-serif max-w-xs">
                Your vault is empty. Upload files in the chat view to store them here permanently and securely.
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
