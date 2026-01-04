
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Note } from '../types';
import { LoadingScreen } from './LoadingScreen';
import { StickyNote, Plus, Trash2, Calendar, User as UserIcon, X, Save, AlertCircle } from 'lucide-react';

interface NotesProps {
    user: { name: string };
}

export const Notes: React.FC<NotesProps> = ({ user }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', content: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await StorageService.getNotes();
        setNotes(data);
        setLoading(false);
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.title.trim() || !newNote.content.trim()) return;

        const note: Note = {
            id: '',
            title: newNote.title,
            content: newNote.content,
            date: new Date().toISOString(),
            user: user.name
        };

        await StorageService.addNote(note);
        setNewNote({ title: '', content: '' });
        setIsAddModalOpen(false);
        loadData();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Bu notu silmek istediğinize emin misiniz?")) {
            await StorageService.deleteNote(id);
            loadData();
        }
    };

    if (loading) return <LoadingScreen message="Notlar yükleniyor..." />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-zinc-950 p-10 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 blur-3xl -ml-32 -mt-32"></div>
                <div className="relative z-10">
                    <h2 className="text-4xl font-black text-zinc-900 dark:text-white flex items-center gap-4 tracking-tighter uppercase">
                        <StickyNote size={48} className="text-emerald-500" /> Notlarım
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-lg font-medium">Cihaz yer değişiklikleri ve operasyonel hatırlatıcıları burada saklayın.</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="relative z-10 bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-[2rem] font-black shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-3 text-sm tracking-widest">
                    <Plus size={24} /> YENİ NOT EKLE
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map(note => (
                    <div key={note.id} className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-900 shadow-xl group hover:border-emerald-500/30 transition-all flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl"><StickyNote size={24}/></div>
                            <button onClick={() => handleDelete(note.id)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                        </div>
                        <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-4 uppercase leading-tight">{note.title}</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed flex-1 mb-8">{note.content}</p>
                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            <span className="flex items-center gap-1.5"><Calendar size={14}/> {new Date(note.date).toLocaleDateString('tr-TR')}</span>
                            <span className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-full"><UserIcon size={12}/> {note.user}</span>
                        </div>
                    </div>
                ))}
                {notes.length === 0 && (
                    <div className="col-span-full py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-zinc-400 gap-4">
                        <AlertCircle size={48} className="opacity-20" />
                        <p className="font-bold text-lg">Henüz hiç not eklenmemiş.</p>
                    </div>
                )}
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-zinc-950 rounded-[3.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-zinc-100 dark:border-zinc-900">
                        <div className="p-10 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                            <h3 className="font-black text-2xl text-zinc-900 dark:text-white tracking-tighter uppercase">YENİ OPERASYON NOTU</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl hover:text-red-500 transition-all"><X size={24}/></button>
                        </div>
                        <form onSubmit={handleAddNote} className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">BAŞLIK / KONU</label>
                                <input required type="text" className="w-full p-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold outline-none focus:border-emerald-500" placeholder="Örn: Fizik Tedavi Cihaz Değişimi" value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">NOT İÇERİĞİ</label>
                                <textarea required rows={5} className="w-full p-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold outline-none focus:border-emerald-500" placeholder="Detaylı bilgileri buraya yazın..." value={newNote.content} onChange={e => setNewNote({...newNote, content: e.target.value})} />
                            </div>
                            <button type="submit" className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"><Save size={24} /> NOTU SİSTEME KAYDET</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
