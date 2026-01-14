
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Printer, CounterLog, InvoiceRecord } from '../types';
import { LoadingScreen } from './LoadingScreen';
import { Banknote, Calculator, TrendingUp, Calendar, ArrowRight, Save, Image as ImageIcon, CheckCircle2, AlertCircle, FileText, Upload, Plus, X, Eye } from 'lucide-react';

// PDF'deki Sabitler
const FIXED_RENTAL_EURO = 745;
const A4_SB_QUOTA = 67000;
const HEALTH_TOURISM_QUOTA = 1000;

export const CostAnalysis: React.FC = () => {
    const [printers, setPrinters] = useState<Printer[]>([]);
    const [counterLogs, setCounterLogs] = useState<CounterLog[]>([]);
    const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [euroRate, setEuroRate] = useState<number>(50.25);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedInvoiceImage, setSelectedInvoiceImage] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [p, l, i] = await Promise.all([
            StorageService.getPrinters(),
            StorageService.getCounterLogs(),
            StorageService.getInvoices()
        ]);
        setPrinters(p);
        setCounterLogs(l);
        setInvoices(i);
        setLoading(false);
    };

    // Dinamik Hesaplama: Mevcut ayın (15-15) verileri
    const calculateCurrentPeriodData = () => {
        const now = new Date();
        const cur15 = new Date(now.getFullYear(), now.getMonth(), 15);
        if (now.getDate() < 15) cur15.setMonth(cur15.getMonth() - 1);
        const prev15 = new Date(cur15);
        prev15.setMonth(prev15.getMonth() - 1);

        let totalA4SB = 0;
        let totalA3Color = 0;
        let totalA4Color = 0;
        let totalScan = 0;

        printers.forEach(p => {
            const logs = counterLogs.filter(l => l.printerId === p.id);
            const curLog = logs.find(l => {
                const d = new Date(l.date);
                return d.getDate() >= 13 && d.getDate() <= 17 && d.getMonth() === cur15.getMonth();
            });
            const prevLog = logs.find(l => {
                const d = new Date(l.date);
                return d.getDate() >= 13 && d.getDate() <= 17 && d.getMonth() === prev15.getMonth();
            });

            if (curLog && prevLog) {
                const usage = curLog.currentCounter - prevLog.currentCounter;
                // PDF Mantığı: Genelde hepsi A4 SB ama bazıları farklı sayılıyor
                if (p.model.includes('DR-c')) totalScan += usage;
                else if (p.isColor) totalA4Color += usage;
                else totalA4SB += usage;
            }
        });

        // Birim Fiyatlar (PDF'den TL bazlı hesaplanmış çarpanlar)
        // 0.0065€ * Kur = 0.326 TL gibi
        const a4sb_multiplier = 0.0065 * euroRate;
        const a4color_multiplier = 0.0700 * euroRate;
        const a3color_multiplier = 0.1400 * euroRate;
        const scan_multiplier = 0.0010 * euroRate;

        const overQuota = Math.max(0, totalA4SB - A4_SB_QUOTA);
        const fixedFeeTL = FIXED_RENTAL_EURO * euroRate;
        const overQuotaCost = overQuota * (0.0075 * euroRate); // Kota aşım ek primi tahmini

        const subtotal = fixedFeeTL + overQuotaCost + (totalA4Color * a4color_multiplier) + (totalScan * scan_multiplier);
        const vat = subtotal * 0.20;
        const total = subtotal + vat;

        return {
            totalA4SB,
            overQuota,
            totalA4Color,
            totalScan,
            fixedFeeTL,
            overQuotaCost,
            subtotal,
            vat,
            total,
            period: `${prev15.toLocaleDateString('tr-TR')} - ${cur15.toLocaleDateString('tr-TR')}`
        };
    };

    const stats = calculateCurrentPeriodData();

    const handleSaveInvoice = async (imageUrl?: string) => {
        const now = new Date();
        const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        const newInvoice: InvoiceRecord = {
            id: '',
            month: months[now.getMonth()],
            year: now.getFullYear(),
            euroRate: euroRate,
            fixedFeeEuro: FIXED_RENTAL_EURO,
            totalAmountTL: stats.total,
            status: 'UNPAID',
            imageUrl,
            details: {
                a4QuotaUsed: stats.totalA4SB,
                a4OverQuota: stats.overQuota,
                a3ColorCount: 0,
                a4ColorCount: stats.totalA4Color,
                scanCount: stats.totalScan
            }
        };
        await StorageService.addInvoice(newInvoice);
        fetchData();
        setIsInvoiceModalOpen(false);
        alert("Fatura dönemi kaydedildi.");
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => handleSaveInvoice(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const togglePaid = async (inv: InvoiceRecord) => {
        const updated = { ...inv, status: inv.status === 'PAID' ? 'UNPAID' : 'PAID' as 'PAID' | 'UNPAID' };
        await StorageService.updateInvoice(updated);
        fetchData();
    };

    if (loading) return <LoadingScreen message="Maliyet tabloları oluşturuluyor..." />;

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Euro Ayar Paneli */}
            <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] shadow-xl border border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl shadow-sm"><Banknote size={32}/></div>
                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Finansal Parametreler</h2>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Dinamik Kur ve Sabit Bedel Ayarları</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex-1 md:w-48">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block ml-2">GÜNCEL EURO KURU (TL)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl font-black text-zinc-900 dark:text-white outline-none focus:border-blue-500" 
                            value={euroRate}
                            onChange={(e) => setEuroRate(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="flex-1 md:w-48">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 block ml-2">SABİT KİRA (EURO)</label>
                        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent rounded-2xl font-black text-zinc-500 dark:text-zinc-400">
                            {FIXED_RENTAL_EURO} €
                        </div>
                    </div>
                </div>
            </div>

            {/* Mevcut Dönem Özeti (PDF Stilinde) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Ana Hesaplama Kartı */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-900 overflow-hidden">
                    <div className="p-8 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Dönemlik Kiralama Analizi</h3>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{stats.period}</p>
                        </div>
                        <button onClick={() => setIsInvoiceModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                            <Save size={18}/> DÖNEMİ KAPAT & ARŞİVLE
                        </button>
                    </div>

                    <div className="p-10 space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">A4 SB Kullanım</p>
                                <p className="text-2xl font-black text-zinc-900 dark:text-white font-mono">{stats.totalA4SB.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Kota Aşımı</p>
                                <p className="text-2xl font-black text-orange-600 font-mono">{stats.overQuota.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">A4 Renkli</p>
                                <p className="text-2xl font-black text-purple-600 font-mono">{stats.totalA4Color.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tarama (DR-C)</p>
                                <p className="text-2xl font-black text-blue-600 font-mono">{stats.totalScan.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-bold uppercase">SABİT KİRA BEDELİ (745€)</span>
                                <span className="font-black text-zinc-900 dark:text-white font-mono">{stats.fixedFeeTL.toLocaleString(undefined, {minimumFractionDigits: 2})} ₺</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-bold uppercase">KOTA AŞIMI & EKSTRA BİRİMLER</span>
                                <span className="font-black text-zinc-900 dark:text-white font-mono">{(stats.subtotal - stats.fixedFeeTL).toLocaleString(undefined, {minimumFractionDigits: 2})} ₺</span>
                            </div>
                            <div className="flex justify-between items-center text-sm py-4 border-y border-zinc-50 dark:border-zinc-900">
                                <span className="text-zinc-400 font-bold uppercase">ARA TOPLAM</span>
                                <span className="font-black text-zinc-500 font-mono">{stats.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})} ₺</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-400 font-bold uppercase">KDV (%20)</span>
                                <span className="font-black text-zinc-500 font-mono">{stats.vat.toLocaleString(undefined, {minimumFractionDigits: 2})} ₺</span>
                            </div>
                            <div className="flex justify-between items-center pt-4">
                                <span className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">GENEL TOPLAM</span>
                                <span className="text-4xl font-black text-emerald-600 font-mono">{stats.total.toLocaleString(undefined, {minimumFractionDigits: 2})} ₺</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Arşiv Paneli (Ödeme Durumu) */}
                <div className="bg-white dark:bg-zinc-950 rounded-[3rem] shadow-xl border border-zinc-100 dark:border-zinc-900 flex flex-col">
                    <div className="p-8 border-b border-zinc-50 dark:border-zinc-900">
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                            <FileText size={20} className="text-blue-500"/> Fatura Arşivi & Takip
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 max-h-[600px]">
                        {invoices.map(inv => (
                            <div key={inv.id} className="p-5 bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-black text-zinc-900 dark:text-white uppercase text-base">{inv.month} {inv.year}</p>
                                        <p className="text-[10px] text-zinc-400 font-bold">Kur: {inv.euroRate} TL</p>
                                    </div>
                                    <button 
                                        onClick={() => togglePaid(inv)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}
                                    >
                                        {inv.status === 'PAID' ? 'ÖDENDİ' : 'ÖDEME BEKLE'}
                                    </button>
                                </div>
                                <div className="flex justify-between items-end">
                                    <p className="text-xl font-black text-zinc-800 dark:text-zinc-200 font-mono">{inv.totalAmountTL.toLocaleString()} ₺</p>
                                    <div className="flex gap-2">
                                        {inv.imageUrl && (
                                            <button 
                                                onClick={() => setSelectedInvoiceImage(inv.imageUrl || null)}
                                                className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl text-zinc-500 shadow-sm border border-zinc-100 dark:border-zinc-700"
                                            >
                                                <Eye size={18}/>
                                            </button>
                                        )}
                                        {!inv.imageUrl && (
                                            <label className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 cursor-pointer shadow-sm border border-blue-100 dark:border-blue-900/50">
                                                <Upload size={18}/>
                                                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = async () => {
                                                            const updated = { ...inv, imageUrl: reader.result as string };
                                                            await StorageService.updateInvoice(updated);
                                                            fetchData();
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}/>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {invoices.length === 0 && (
                            <div className="py-20 text-center text-zinc-400 font-bold uppercase tracking-widest opacity-30">Arşiv henüz boş.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Invoice Image Modal */}
            {selectedInvoiceImage && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 animate-in fade-in duration-500" onClick={() => setSelectedInvoiceImage(null)}>
                    <button className="absolute top-10 right-10 p-4 bg-white/10 text-white rounded-full"><X size={32}/></button>
                    <img src={selectedInvoiceImage} className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl" />
                </div>
            )}

            {/* Dönem Kapatma Onay Modal */}
            {isInvoiceModalOpen && (
                <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-white dark:bg-zinc-950 rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-zinc-100 dark:border-zinc-900 text-center space-y-8">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl"><Save size={40}/></div>
                        <div>
                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Dönem Verisi Kaydedilsin mi?</h3>
                            <p className="text-zinc-500 text-sm mt-4">Bu işlem mevcut hesaplamayı ({stats.total.toLocaleString()} ₺) arşive ekleyecektir.</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setIsInvoiceModalOpen(false)} className="flex-1 py-5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded-2xl font-black uppercase text-xs tracking-widest">İPTAL</button>
                            <button onClick={() => handleSaveInvoice()} className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20">KAYDET</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
