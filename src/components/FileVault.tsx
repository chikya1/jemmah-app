import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/LocalDB';
import { Search, Image as ImageIcon, FileText, Link, File, Trash2, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

type Tab = 'images' | 'documents' | 'links';

export default function FileVault() {
  const [tab, setTab] = useState<Tab>('images');
  const [query, setQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const vaultItems = useLiveQuery(() => db.vault.orderBy('timestamp').reverse().toArray(), []);
  const notes = useLiveQuery(() => db.notes.orderBy('timestamp').reverse().toArray(), []);

  const images = vaultItems?.filter(i => i.type === 'image') || [];
  const documents = vaultItems?.filter(i => i.type !== 'image') || [];
  const links = notes?.filter(n => n.type === 'url') || [];

  const filteredImages = query
    ? images.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
    : images;

  const filteredDocs = query
    ? documents.filter(d => d.name.toLowerCase().includes(query.toLowerCase()))
    : documents;

  const filteredLinks = query
    ? links.filter(l => l.content.toLowerCase().includes(query.toLowerCase()) || l.tags.some(t => t.includes(query.toLowerCase())))
    : links;

  const deleteVaultItem = async (id: number) => {
    await db.vault.delete(id);
  };

  const deleteNote = async (id: number) => {
    await db.notes.delete(id);
  };

  const tabs = [
    { id: 'images' as Tab, label: 'Images', icon: ImageIcon, count: images.length },
    { id: 'documents' as Tab, label: 'Docs', icon: FileText, count: documents.length },
    { id: 'links' as Tab, label: 'Links', icon: Link, count: links.length },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {selectedImage && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectedImage(null)}
        >
          <button
            style={{ position: 'absolute', top: 16, right: 16, padding: 8, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', color: 'white', border: 'none', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
          >
            <X size={24} />
          </button>
          <img
            src={selectedImage}
            alt="Full view"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="px-4 pt-4 pb-2 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-2 bg-[#f5f5f5] rounded-xl px-3 py-2 mb-3">
          <Search size={16} className="text-[#9A8F8A]" />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#0d0d0d] placeholder-[#9A8F8A] outline-none"
          />
          {query && <button onClick={() => setQuery('')}><X size={14} className="text-[#9A8F8A]" /></button>}
        </div>

        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                tab === t.id
                  ? 'bg-[#7B1F4B] border-[#7B1F4B] text-white'
                  : 'bg-white border-[#e5e5e5] text-[#9A8F8A]'
              }`}
            >
              <t.icon size={14} />
              {t.label}
              {t.count > 0 && <span className="opacity-70">({t.count})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'images' && (
          <>
            {filteredImages.length === 0 ? (
              <Empty text="No images yet. Send an image in chat to save it here." />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredImages.map(item => (
                  <div key={item.id} className="relative group rounded-2xl overflow-hidden border border-[#e5e5e5] aspect-square bg-[#f5f5f5]">
                    <img
                      src={item.dataUrlOrBlob as string}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); setSelectedImage(item.dataUrlOrBlob as string); }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                      <p className="text-white text-xs truncate">{item.name}</p>
                      <p className="text-white/60 text-[10px]">{format(item.timestamp, 'MMM d')}</p>
                    </div>
                    <button
                      onClick={() => deleteVaultItem(item.id!)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'documents' && (
          <>
            {filteredDocs.length === 0 ? (
              <Empty text="No documents yet. Send a file in chat to save it here." />
            ) : (
              <div className="space-y-2">
                {filteredDocs.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-[#f5f5f5] rounded-2xl border border-[#e5e5e5]">
                    <div className="w-10 h-10 rounded-xl bg-[#7B1F4B]/10 flex items-center justify-center shrink-0">
                      {item.type === 'pdf' ? <FileText size={20} className="text-[#7B1F4B]" /> : <File size={20} className="text-[#7B1F4B]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0d0d0d] truncate">{item.name}</p>
                      <p className="text-[10px] text-[#9A8F8A]">{item.type.toUpperCase()} · {format(item.timestamp, 'MMM d, yyyy')}</p>
                    </div>
                    <button onClick={() => deleteVaultItem(item.id!)} className="p-2 text-[#9A8F8A] hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'links' && (
          <>
            {filteredLinks.length === 0 ? (
              <Empty text="No links yet. Paste a URL in chat to save it here." />
            ) : (
              <div className="space-y-2">
                {filteredLinks.map(item => (
                  <div key={item.id} className="p-3 bg-[#f5f5f5] rounded-2xl border border-[#e5e5e5]">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#7B1F4B]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Link size={16} className="text-[#7B1F4B]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#0d0d0d] break-all">{item.content}</p>
                        {item.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {item.tags.map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-[#e5e5e5] text-[#9A8F8A]">#{tag}</span>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-[#9A8F8A] mt-1">{format(item.timestamp, 'MMM d, yyyy')}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <a href={item.content} target="_blank" rel="noreferrer" className="p-1.5 text-[#7B1F4B]">
                          <ExternalLink size={14} />
                        </a>
                        <button onClick={() => deleteNote(item.id!)} className="p-1.5 text-[#9A8F8A] hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-48 text-center text-sm text-[#9A8F8A] px-8">
      {text}
    </div>
  );
}
