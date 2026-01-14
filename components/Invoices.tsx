
import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { MonthlyInvoice } from '../types';
import { LoadingScreen } from './LoadingScreen';
import { Banknote, FileText, Plus, Camera, X, Save, Eye, Calendar, TrendingUp, AlertCircle, FileDigit, Trash2, Loader2, AlertTriangle, ZoomIn, ZoomOut, Maximize2, Minimize2, Edit3, CheckCircle2, Clock, Download, Printer, Search, ExternalLink } from 'lucide-react';

export const Invoices: React.FC = () => {
    const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<MonthlyInvoice | null>(null);
    const [viewFileUrl, setViewFileUrl] = useState<string | null>(null);
    const [isPdfView, setIsPdfView] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmDeleteInv, setConfirmDeleteInv] = useState<MonthlyInvoice | null>(null);
    const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');

    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const currentYear = 2025;

    const [inputEuroRate, setInputEuroRate] = useState('');
    const [inputTotalTL, setInputTotalTL] = useState('');
    const [inputPaidAt, setInputPaidAt] = useState('');

    const [formData, setFormData] = useState<MonthlyInvoice>({
        id: '',
        month: months[new Date().getMonth()],
        year: currentYear,
        euroRate: 0,
        totalTL: 0,
        imageUrl: '',
        status: 'PENDING',
        createdAt: '',
        paidAt: ''
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (viewFileUrl) closeViewer();
                else if (isModalOpen) setIsModalOpen(false);
                else if (confirmDeleteInv) setConfirmDeleteInv(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewFileUrl, isModalOpen, confirmDeleteInv]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await StorageService.getMonthlyInvoices();
            const validData = data.filter(d => d.id).sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                const m1 = months.indexOf(a.month);
                const m2 = months.indexOf(b.month);
                return m2 - m1;
            });
            setInvoices(validData);
        } catch (error) {
            console.error("Veri yükleme hatası:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredInvoices = useMemo(() => {
        if (!invoiceSearchTerm.trim()) return invoices;
        const s = invoiceSearchTerm.toLocaleLowerCase('tr-TR');
        return invoices.filter(inv => {
            const monthMatch = inv.month.toLocaleLowerCase('tr-TR').includes(s);
            const yearMatch = inv.year.toString().includes(s);
            const combinedMatch = `${inv.month} ${inv.year}`.toLocaleLowerCase('tr-TR').includes(s);
            return monthMatch || yearMatch || combinedMatch;
        });
    }, [invoices, invoiceSearchTerm]);

    const parseLocaleNumber = (val: string): number => {
        if (!val) return 0;
        let cleanVal = val.toString().replace(/\s/g, '');
        if (cleanVal.includes(',') && cleanVal.includes('.')) {
            cleanVal = cleanVal.replace(/\./g, '').replace(',', '.');
        } else if (cleanVal.includes(',')) {
            cleanVal = cleanVal.replace(',', '.');
        }
        const parsed = parseFloat(cleanVal);
        return isNaN(parsed) ? 0 : parsed;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const openEditModal = (inv: MonthlyInvoice) => {
        setEditingInvoice(inv);
        setFormData({ ...inv });
        setInputEuroRate(inv.euroRate.toString());
        setInputTotalTL(inv.totalTL.toString());
        setInputPaidAt(inv.paidAt || '');
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessingId('saving');
        const finalEuroRate = parseLocaleNumber(inputEuroRate);
        const finalTotalTL = parseLocaleNumber(inputTotalTL);
        try {
            const payload: MonthlyInvoice = {
                ...formData,
                euroRate: finalEuroRate,
                totalTL: finalTotalTL,
                paidAt: (formData.status === 'PAID' && inputPaidAt) ? inputPaidAt : undefined,
                createdAt: formData.createdAt || new Date().toISOString()
            };
            await StorageService.saveMonthlyInvoice(payload);
            setIsModalOpen(false);
            await loadData();
        } catch (error) {
            alert("Kaydedilirken hata oluştu.");
        } finally {
            setProcessingId(null);
        }
    };

    const openViewer = async (dataUrl: string) => {
        setZoomLevel(dataUrl.startsWith('data:application/pdf') ? 1 : 1.2);
        if (dataUrl.startsWith('data:application/pdf')) {
            try {
                // Daha kararlı bir blob dönüşümü için fetch kullanıyoruz
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                setViewFileUrl(url);
                setIsPdfView(true);
            } catch (e) {
                console.error("PDF processing error:", e);
                alert("PDF dosyası işlenemedi.");
            }
        } else {
            setViewFileUrl(dataUrl);
            setIsPdfView(false);
        }
    };

    const closeViewer = () => {
        if (viewFileUrl && viewFileUrl.startsWith('blob:')) {
            URL.revokeObjectURL(viewFileUrl);
        }
        setViewFileUrl(null);
        setIsPdfView(false);
        setZoomLevel(1);
    };

    const handlePrint = () => {
        if (!viewFileUrl) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        if (isPdfView) {
            printWindow.location.href = viewFileUrl;
        } else {
            printWindow.document.write(`
                <html>
                    <body style="margin:0; display:flex; justify-content:center; align-items:center;">
                        <img src="${viewFileUrl}" style="max-width:100%; height:auto;" onload="window.print(); window.close();" />
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const handleDownload = () => {
        if (!viewFileUrl) return;
        const link = document.createElement('a');
        link.href = viewFileUrl;
        link.download = `fatura_${new Date().getTime()}.${isPdfView ? 'pdf' : 'jpg'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const executeDelete = async () => {
        if (!confirmDeleteInv || !confirmDeleteInv.id) return;
        const idToDelete = confirmDeleteInv.id;
        setProcessingId(idToDelete);
        setConfirmDeleteInv(null);
        try {
            await StorageService.deleteMonthlyInvoice(idToDelete);
            setInvoices(prev => prev.filter(inv => inv.id !== idToDelete));
        } catch (error) {
            alert("Silme işlemi başarısız.");
            await loadData();
        } finally {
            setProcessingId(null);
        }
    };

    const formatCurrency = (val: number) => {
        return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const isPdf = (dataUrl?: string) => dataUrl?.startsWith('data:application/pdf');

    if (loading && invoices.length === 0) return <LoadingScreen message="Fatura arşivi yükleniyor..." />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-32">
            {/* Header Area */}
            <div className="bg-white dark:bg-zinc-950 p-10 rounded-[3.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 blur-3xl -ml-32 -mt-32"></div>
                <div className="relative z-10 text-center md:text-left">
                    <h2 className="text-4xl font-black text-zinc-900 dark:text-white flex items-center justify-center md:justify-start gap-4 tracking-tighter uppercase">
                        <Banknote size={48} className="text-emerald-500" /> Fatura Arşivi
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-lg font-medium">Ödeme durumlarını geriye dönük yönetin ve inceleyin.</p>
                </div>
                <button 
                    onClick={() => { 
                        setEditingInvoice(null);
                        setFormData({ id: '', month: months[new Date().getMonth()], year: currentYear, euroRate: 0, totalTL: 0, imageUrl: '', status: 'PENDING', createdAt: '', paidAt: '' }); 
                        setInputEuroRate('');
                        setInputTotalTL('');
                        setInputPaidAt('');
                        setIsModalOpen(true); 
                    }} 
                    className="relative z-10 bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-[2rem] font-black shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-3 text-sm tracking-widest uppercase"
                >
                    <Plus size={24} /> YENİ FATURA EKLE
                </button>
            </div>

            {/* Arama Barı */}
            <div className="relative group mx-4 md:mx-0">
                <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-emerald-500 transition-colors">
                    <Search size={28} />
                </div>
                <input 
                    type="text" 
                    placeholder="Ay veya Yıl ara... (Örn: Ocak, 2024)" 
                    className="w-full pl-24 pr-20 py-8 rounded-[3rem] bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-100 dark:border-white/5 text-zinc-900 dark:text-white shadow-2xl focus:border-emerald-500/50 outline-none transition-all font-black text-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-700" 
                    value={invoiceSearchTerm} 
                    onChange={(e) => setInvoiceSearchTerm(e.target.value)} 
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredInvoices.map(inv => {
                    const isPaid = inv.status === 'PAID';
                    return (
                        <div 
                            key={inv.id} 
                            className={`bg-white dark:bg-zinc-950 rounded-[3rem] border transition-all duration-500 flex flex-col h-full overflow-hidden shadow-xl group
                                ${isPaid 
                                    ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20' 
                                    : 'border-zinc-100 dark:border-zinc-900 hover:border-emerald-500/30'}`}
                        >
                            <div 
                                className="relative h-64 overflow-hidden bg-zinc-100 dark:bg-zinc-900 cursor-pointer"
                                onClick={() => inv.imageUrl && openViewer(inv.imageUrl)}
                            >
                                {inv.imageUrl ? (
                                    isPdf(inv.imageUrl) ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800 transition-colors">
                                            <FileDigit size={64} className="text-red-500" />
                                            <span className="text-[10px] font-black mt-3 text-zinc-500 tracking-widest uppercase">PDF DÖKÜMANI</span>
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="bg-white text-zinc-900 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                                                    <Maximize2 size={16} /> TAM EKRAN AÇ
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <img src={inv.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Fatura" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="bg-white text-zinc-900 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                    <Maximize2 size={16} /> BÜYÜTEREK İNCELE
                                                </div>
                                            </div>
                                        </>
                                    )
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300"><FileText size={48} /></div>
                                )}
                                <div className={`absolute top-4 left-4 backdrop-blur-md px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg
                                    ${isPaid ? 'bg-emerald-600 text-white' : 'bg-zinc-900/80 text-white'}`}>
                                    {inv.month} {inv.year}
                                </div>
                                {isPaid && (
                                    <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                                        <CheckCircle2 size={20} />
                                    </div>
                                )}
                            </div>

                            <div className="p-8 flex-1 flex flex-col">
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">EURO KURU</p>
                                        <p className="text-xl font-black text-zinc-900 dark:text-white font-mono">{formatCurrency(inv.euroRate)} ₺</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">TOPLAM TUTAR</p>
                                        <p className={`text-xl font-black font-mono ${isPaid ? 'text-emerald-500' : 'text-zinc-900 dark:text-white'}`}>
                                            {formatCurrency(inv.totalTL)} ₺
                                        </p>
                                    </div>
                                </div>

                                {isPaid && (
                                    <div className="mb-6 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg"><CheckCircle2 size={16}/></div>
                                        <div>
                                            <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">ÖDEME TAMAMLANDI</p>
                                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                                                {inv.paidAt ? `${new Date(inv.paidAt).toLocaleDateString('tr-TR')} tarihinde ödendi` : 'Ödeme Tarihi: -'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-900 flex flex-col gap-4">
                                    <div className="flex justify-between items-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                            isPaid ? 'bg-emerald-500 text-white' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                            {isPaid ? 'ÖDENDİ' : 'ÖDEME BEKLİYOR'}
                                        </span>
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1">
                                            <Clock size={12}/> {new Date(inv.createdAt).toLocaleDateString('tr-TR')}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => openEditModal(inv)}
                                            className="py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-[1.5rem] font-black text-[10px] tracking-widest uppercase hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <Edit3 size={16} /> DÜZENLE
                                        </button>
                                        <button 
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteInv(inv); }} 
                                            disabled={processingId === inv.id}
                                            className="py-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-[1.5rem] font-black text-[10px] tracking-widest uppercase hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            {processingId === inv.id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16} />}
                                            SİL
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filteredInvoices.length === 0 && (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center text-zinc-400 opacity-50 space-y-4">
                        <Search size={64} />
                        <p className="font-black text-xl uppercase tracking-widest">Eşleşen Fatura Bulunamadı</p>
                    </div>
                )}
            </div>

            {/* Modal - Belge Görüntüleyici */}
            {viewFileUrl && (
                <div className="fixed inset-0 z-[1000] bg-zinc-950 flex flex-col animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-full bg-zinc-900/80 backdrop-blur-2xl p-6 md:p-8 flex justify-between items-center border-b border-white/10 z-[1010] shadow-2xl">
                        <div className="flex items-center gap-6">
                            <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 text-emerald-500 hidden sm:block">
                                {isPdfView ? <FileDigit size={32}/> : <FileText size={32}/>}
                            </div>
                            <div>
                                <h3 className="text-white font-black text-xl uppercase tracking-tighter leading-none">BELGE İNCELEME</h3>
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                    {isPdfView ? 'PDF DÖKÜMANI' : 'FATURA GÖRSELİ'} // 
                                    <span className="text-emerald-500">ZOOM: %{Math.round(zoomLevel * 100)}</span>
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 md:gap-4">
                            {!isPdfView && (
                                <div className="flex bg-black/40 p-2 rounded-[1.5rem] border border-white/5 mr-2 md:mr-6">
                                    <button onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.2))} className="p-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><ZoomOut size={24} /></button>
                                    <div className="w-px h-8 bg-white/10 mx-2 self-center"></div>
                                    <button onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.2))} className="p-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><ZoomIn size={24} /></button>
                                </div>
                            )}
                            <button onClick={handleDownload} className="p-4 bg-zinc-800 text-white rounded-2xl hover:bg-zinc-700 transition-all shadow-lg flex items-center gap-2"><Download size={20} /> <span className="hidden sm:inline text-[10px] font-black tracking-widest">İNDİR</span></button>
                            <button onClick={handlePrint} className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all shadow-lg flex items-center gap-2"><Printer size={20} /> <span className="hidden sm:inline text-[10px] font-black tracking-widest uppercase">YAZDIR / PDF</span></button>
                            <button onClick={closeViewer} className="p-4 bg-red-600 text-white rounded-2xl hover:rotate-90 transition-all shadow-2xl ml-2"><X size={24} strokeWidth={3}/></button>
                        </div>
                    </div>

                    <div className="flex-1 w-full overflow-auto custom-scrollbar bg-[#0f0f12] relative flex items-start justify-center p-4 md:p-10">
                        <div 
                            className="transition-all duration-300 ease-out min-h-full flex items-center justify-center relative w-full"
                            style={{ 
                                transform: isPdfView ? 'none' : `scale(${zoomLevel})`,
                                transformOrigin: 'top center'
                            }}
                        >
                            {isPdfView ? (
                                <object 
                                    data={viewFileUrl + "#toolbar=0&navpanes=0&scrollbar=0"} 
                                    type="application/pdf" 
                                    className="w-full h-[85vh] rounded-[2rem] bg-white shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
                                >
                                    <div className="flex flex-col items-center justify-center h-full p-10 text-center space-y-6">
                                        <div className="p-10 bg-zinc-900 rounded-[3rem] border border-white/5">
                                            <FileDigit size={80} className="text-emerald-500 mb-6 mx-auto" />
                                            <h4 className="text-white font-black text-2xl uppercase tracking-tighter">PDF GÖMÜLEMEDİ</h4>
                                            <p className="text-zinc-500 text-sm font-medium mt-4 max-w-xs">Tarayıcınız veya cihazınız PDF'i doğrudan bu ekranda gösteremiyor olabilir.</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <a 
                                                href={viewFileUrl} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="px-10 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-3"
                                            >
                                                <ExternalLink size={20}/> HARİCİ PENCEREDE AÇ
                                            </a>
                                            <button 
                                                onClick={handleDownload}
                                                className="px-10 py-5 bg-zinc-800 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest border border-white/10"
                                            >
                                                DOSYAYI İNDİR
                                            </button>
                                        </div>
                                    </div>
                                </object>
                            ) : (
                                <img 
                                    src={viewFileUrl} 
                                    className="rounded-2xl shadow-[0_0_100px_rgba(0,0,0,1)] select-none max-w-full h-auto cursor-zoom-in" 
                                    alt="Fatura Belgesi" 
                                    onClick={() => setZoomLevel(zoomLevel === 1 ? 1.5 : 1)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal - Kayıt Formu */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-500">
                    <div className="bg-white dark:bg-zinc-950 rounded-[4rem] w-full max-w-xl shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-900 flex flex-col max-h-[95vh]">
                        <div className="p-10 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                            <div>
                                <h3 className="font-black text-3xl text-zinc-900 dark:text-white tracking-tighter uppercase">
                                    {editingInvoice ? 'FATURAYI DÜZENLE' : 'FATURA KAYDET'}
                                </h3>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em] mt-2">Finansal Kayıt Yönetimi</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-4 bg-red-600 text-white rounded-3xl shadow-xl hover:rotate-90 transition-all"><X size={32}/></button>
                        </div>
                        <form onSubmit={handleSave} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">AY</label>
                                    <select required className="w-full p-4 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900 font-bold" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})}>
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">YIL</label>
                                    <input required type="number" className="w-full p-4 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900 font-bold" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">KUR (TL)</label>
                                    <input 
                                        required 
                                        type="text" 
                                        inputMode="decimal"
                                        placeholder="0,00"
                                        className="w-full p-4 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900 font-mono font-bold" 
                                        value={inputEuroRate} 
                                        onChange={e => setInputEuroRate(e.target.value)} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">TOPLAM (TL)</label>
                                    <input 
                                        required 
                                        type="text" 
                                        inputMode="decimal"
                                        placeholder="0,00"
                                        className="w-full p-4 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900 font-mono font-bold" 
                                        value={inputTotalTL} 
                                        onChange={e => setInputTotalTL(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">ÖDEME DURUMU</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({...formData, status: 'PENDING'})} 
                                        className={`py-5 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all ${formData.status === 'PENDING' ? 'bg-orange-600 text-white shadow-lg' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                                    >
                                        ÖDEME BEKLİYOR
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setFormData({...formData, status: 'PAID'});
                                        }} 
                                        className={`py-5 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all ${formData.status === 'PAID' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                                    >
                                        ÖDENDİ
                                    </button>
                                </div>
                            </div>

                            {formData.status === 'PAID' && (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-2">ÖDEME TARİHİ</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-4 border-2 border-emerald-500/30 rounded-2xl bg-emerald-500/5 text-emerald-900 dark:text-emerald-100 font-bold" 
                                        value={inputPaidAt}
                                        onChange={e => setInputPaidAt(e.target.value)}
                                        onClick={(e) => e.currentTarget.showPicker()}
                                    />
                                    <p className="text-[9px] text-zinc-400 italic ml-2">* Eski kayıtlar için tarih kısmını boş bırakabilirsiniz (- görünür).</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">DOSYA / DÖKÜMAN (PDF VEYA RESİM)</label>
                                <label className="flex flex-col items-center justify-center p-10 border-4 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:border-emerald-500 transition-all group">
                                    <Camera size={48} className="text-zinc-300 group-hover:text-emerald-500 mb-4" />
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">DOSYA SEÇ (GÖRÜNTÜLEME İÇİN PDF ÖNERİLİR)</span>
                                    <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" />
                                </label>
                                {formData.imageUrl && <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-center font-black uppercase text-[10px]">{isPdf(formData.imageUrl) ? 'PDF DOSYASI EKLENDİ' : 'RESİM EKLENDİ'}</div>}
                            </div>
                            <button type="submit" disabled={processingId === 'saving'} className="w-full py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black shadow-2xl flex items-center justify-center gap-4 uppercase tracking-widest active:scale-95 transition-all">
                                {processingId === 'saving' ? <Loader2 size={24} className="animate-spin" /> : <Save size={24}/>} 
                                {editingInvoice ? 'GÜNCELLEMEYİ KAYDET' : 'FATURAYI KAYDET'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Silme Onayı */}
            {confirmDeleteInv && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[400] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-zinc-950 rounded-[4rem] w-full max-w-md p-12 text-center shadow-2xl border border-zinc-100 dark:border-zinc-900 space-y-8 animate-in zoom-in-95">
                        <div className="w-24 h-24 bg-red-100 dark:bg-red-950/30 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-xl"><AlertTriangle size={48} /></div>
                        <div>
                            <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">EMİN MİSİNİZ?</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 mt-4 font-medium leading-relaxed">
                                <strong className="text-zinc-900 dark:text-white">{confirmDeleteInv.month} {confirmDeleteInv.year}</strong> dönemine ait bu fatura kaydı kalıcı olarak silinecektir.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setConfirmDeleteInv(null)} className="py-6 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 rounded-3xl font-black text-[11px] tracking-widest uppercase active:scale-95 transition-all">VAZGEÇ</button>
                            <button onClick={executeDelete} className="py-6 bg-red-600 text-white rounded-3xl font-black text-[11px] tracking-widest uppercase shadow-xl active:scale-95 transition-all">EVET, SİL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
