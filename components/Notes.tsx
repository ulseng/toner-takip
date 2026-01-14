
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Note, Printer } from '../types';
import { LoadingScreen } from './LoadingScreen';
import { StickyNote, Plus, Trash2, Calendar, User as UserIcon, X, Save, AlertCircle, Image as ImageIcon, Edit3, Loader2, Printer as PrinterIcon } from 'lucide-react';

interface NotesProps {
    user: { name: string };
}

export const Notes: React.FC<NotesProps> = ({ user }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [printers, setPrinters] = useState<Printer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [formData, setFormData] = useState({ title: '', content: '', imageUrl: '', printerId: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        const [n, p] = await Promise.all([StorageService.getNotes(), StorageService.getPrinters()]);
        setNotes(n);
        setPrinters(p);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const noteData: Note = {
            id: editingNote?.id || '',
            printerId: formData.printerId || undefined,
            title: formData.title,
            content: formData.content,
            date: editingNote?.date || new Date().toISOString(),
            user: user.name,
            imageUrl: formData.imageUrl || undefined
        };
        if (editingNote) await StorageService.updateNote(noteData);
        else await StorageService.addNote(noteData);
        setIsModalOpen(false);
        loadData();
        setSaving(false);
    };

    if (loading && notes.length === 0) return <LoadingScreen message="Senkronize ediliyor..." />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-zinc-950 p-10 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-zinc-900 dark:text-white flex items-center gap-4 tracking-tighter uppercase"><StickyNote size={48} className="text-emerald-500" /> Notlarım</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-lg font-medium">Genel veya cihaza özel notları buradan yönetin.</p>
                </div>
                <button onClick={() => { setEditingNote(null); setFormData({title:'', content:'', imageUrl:'', printerId:''}); setIsModalOpen(true); }} className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black shadow-xl uppercase text-sm"><Plus size={24} /> YENİ NOT</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {notes.map(note => {
                    const linkedPrinter = printers.find(p => p.id === note.printerId);
                    return (
                        <div key={note.id} className="bg-white dark:bg-zinc-950 rounded-[3rem] border border-zinc-100 dark:border-zinc-900 shadow-xl p-8 flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <StickyNote size={28} className="text-emerald-500"/>
                                <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 text-right">
                                    <p>{new Date(note.date).toLocaleDateString()}</p>
                                    <p>{note.user}</p>
                                </div>
                            </div>
                            {linkedPrinter && (
                                <div className="mb-4 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <PrinterIcon size={12}/> {linkedPrinter.brand} {linkedPrinter.model}
                                </div>
                            )}
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-4 uppercase leading-none">{note.title}</h3>
                            <p className="text-zinc-500 text-sm font-medium leading-relaxed flex-1 mb-8">{note.content}</p>
                            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-2 gap-4">
                                <button onClick={() => { setEditingNote(note); setFormData({title:note.title, content:note.content, imageUrl:note.imageUrl||'', printerId:note.printerId||''}); setIsModalOpen(true); }} className="py-4 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-2xl font-black text-[10px] uppercase">DÜZENLE</button>
                                <button onClick={() => StorageService.deleteNote(note.id, user.name, note.title).then(loadData)} className="py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase">SİL</button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-zinc-950 rounded-[4rem] w-full max-w-xl shadow-2xl border border-zinc-100 dark:border-zinc-900 flex flex-col max-h-[90vh]">
                        <div className="p-10 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
                            <h3 className="font-black text-3xl uppercase tracking-tighter text-zinc-900 dark:text-white">{editingNote ? 'NOTU DÜZENLE' : 'YENİ NOT'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-4 bg-red-600 text-white rounded-3xl"><X size={32}/></button>
                        </div>
                        <form onSubmit={handleSave} className="p-10 space-y-6 overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">BAĞLI CİHAZ (OPSİYONEL)</label>
                                <select className="w-full p-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-900 font-bold" value={formData.printerId} onChange={e => setFormData({...formData, printerId: e.target.value})}>
                                    <option value="">Genel Not (Bağlı Cihaz Yok)</option>
                                    {printers.map(p => <option key={p.id} value={p.id}>{p.brand} {p.model} - {p.location}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">BAŞLIK</label>
                                <input required type="text" className="w-full p-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-900 font-black" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">İÇERİK</label>
                                <textarea required rows={5} className="w-full p-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-900 font-bold" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                            </div>
                            <button type="submit" disabled={saving} className="w-full py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black shadow-2xl uppercase tracking-widest">
                                {saving ? <Loader2 className="animate-spin" size={24}/> : 'KAYDET'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
