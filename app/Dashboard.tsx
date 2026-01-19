
import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from '../context/GlobalState';
import { 
  Users, CheckCircle2, AlertCircle, FileText, 
  TrendingUp, Calendar, Clock, Filter, ChevronLeft, ChevronRight, X, Check, PlayCircle,
  GraduationCap, BookOpen, Activity, AlertTriangle, ShieldAlert, Star, Search, Briefcase, ScrollText, ClipboardList
} from 'lucide-react';

const DashboardWidget: React.FC<{ id: string, initialStat: any, data: any, lang: string }> = ({ id, initialStat, data, lang }) => {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem(`widget_config_${id}`);
    return saved ? JSON.parse(saved) : { 
        type: '', criteria: [], interval: 5000, timeRange: 'all', 
        startDate: '', endDate: '', absenceThreshold: 0 
    };
  });

  const [mode, setMode] = useState<'default' | 'custom'>(() => {
    return localStorage.getItem(`widget_config_${id}`) ? 'custom' : 'default';
  });

  const [showFilter, setShowFilter] = useState(false);
  const [tempConfig, setTempConfig] = useState(config);
  const [slides, setSlides] = useState<string[][]>([]); 
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (mode === 'custom') {
      localStorage.setItem(`widget_config_${id}`, JSON.stringify(config));
    }
  }, [config, mode, id]);

  const reportTypes = [
    { id: 'students', label: lang === 'ar' ? 'تقارير الطلاب' : 'Students' },
    { id: 'teachers', label: lang === 'ar' ? 'متابعة المعلمين' : 'Teachers' },
    { id: 'violations', label: lang === 'ar' ? 'التعهدات والمخالفات' : 'Violations' },
    { id: 'substitutions', label: lang === 'ar' ? 'تغطية الحصص' : 'Substitutions' },
    { id: 'student_absence', label: lang === 'ar' ? 'غياب الطلاب' : 'Student Absence' },
    { id: 'student_lateness', label: lang === 'ar' ? 'تأخر الطلاب' : 'Student Lateness' },
  ];

  const criteriaOptions: any = {
    students: [
      { id: 'excellent', label: lang === 'ar' ? 'المتميزين' : 'Excellent', icon: '🌟' },
      { id: 'blacklisted', label: lang === 'ar' ? 'القائمة السوداء' : 'Blacklisted', icon: '⛔' },
    ],
    student_lateness: [
      { id: 'frequent', label: 'تأخر متكرر', icon: '⏰' },
      { id: 'constant', label: 'دائم التأخر', icon: '⏳' },
    ]
  };

  useEffect(() => {
    if (mode === 'default') return;
    let allLines: string[] = [];
    
    if (config.type === 'student_lateness') {
        const records = (data.latenessRecords || []);
        records.forEach((r: any) => allLines.push(`${r.studentName} (${r.latenessStatus})`));
    } else if (config.type === 'students') {
        const students = (data.studentReports || []);
        if (config.criteria.includes('excellent')) students.filter((s:any) => s.isExcellent).forEach((s:any) => allLines.push(`🌟 ${s.name}`));
    }

    if (allLines.length === 0) allLines.push(lang === 'ar' ? '✨ لا توجد بيانات' : 'No data');

    const pages = [];
    for (let i = 0; i < allLines.length; i += 3) {
      pages.push(allLines.slice(i, i + 3));
    }
    setSlides(pages);
    setCurrentIndex(0);
  }, [config, data, mode, lang]);

  useEffect(() => {
    if (mode === 'default' || slides.length < 2) return;
    const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % slides.length);
    }, config.interval);
    return () => clearInterval(interval);
  }, [config.interval, slides.length, mode]);

  const handleApply = () => {
     setConfig(tempConfig);
     setMode('custom');
     setShowFilter(false);
  };

  const currentLabel = reportTypes.find(t => t.id === config.type)?.label;

  return (
    <div className={`relative bg-gradient-to-br from-white to-${initialStat.color}-50 p-4 rounded-2xl border shadow-sm hover:shadow-lg transition-all h-48 flex flex-col justify-center overflow-hidden group`}>
      <button onClick={() => { setShowFilter(true); setTempConfig(config.type ? config : { ...config, type: 'students' }); }} className="absolute top-2 left-2 z-20 p-1.5 bg-white/80 rounded-lg shadow-sm border border-slate-100"><Filter size={14} /></button>
      {mode === 'default' ? (
        <div className="flex flex-col items-center text-center">
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-${initialStat.color}-100 text-${initialStat.color}-600`}>{initialStat.icon}</div>
           <div className="text-4xl font-black text-slate-800 tracking-tight">{initialStat.value}</div>
           <div className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">{initialStat.label}</div>
        </div>
      ) : (
        <div className="relative z-10 w-full h-full flex flex-col pt-6">
            <div className="text-center mb-2"><span className={`px-3 py-1 rounded-full text-[10px] font-black bg-${initialStat.color}-100 text-${initialStat.color}-700 border border-${initialStat.color}-200`}>{currentLabel}</span></div>
            <div className="flex-1 flex flex-col justify-center items-center px-2">
                <div className="space-y-2 w-full">
                    {slides[currentIndex]?.map((line, idx) => (
                      <div key={idx} className="w-full bg-white/60 p-2 rounded-lg border border-slate-100 shadow-sm text-xs font-bold text-slate-700 truncate text-right" dir="rtl">{line}</div>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between w-full mt-2 px-1">
                <button onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length); }} className="p-1 text-slate-400"><ChevronRight size={16} /></button>
                <div className="flex gap-1">{slides.length > 1 && slides.map((_, i) => <div key={i} className={`h-1.5 rounded-full ${i === currentIndex ? `w-4 bg-${initialStat.color}-500` : 'w-1.5 bg-slate-300'}`}></div>)}</div>
                <button onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => (prev + 1) % slides.length); }} className="p-1 text-slate-400"><ChevronLeft size={16} /></button>
            </div>
            <button onClick={() => { setMode('default'); localStorage.removeItem(`widget_config_${id}`); }} className="absolute bottom-1 right-2 text-[9px] text-slate-400 hover:text-red-500 font-bold">✕</button>
        </div>
      )}
      {showFilter && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                 <div className="flex justify-between items-center p-4 border-b">
                    <span className="text-base font-black text-slate-800 flex items-center gap-2"><Filter size={18}/> تصفية البيانات</span>
                    <button onClick={() => setShowFilter(false)} className="bg-white p-2 rounded-full border"><X size={16}/></button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-5">
                     <div>
                        <label className="text-xs font-black text-slate-600 block mb-2">نوع التقرير</label>
                        <select className="w-full text-sm p-3 border rounded-xl font-bold" value={tempConfig.type} onChange={(e) => setTempConfig({...tempConfig, type: e.target.value, criteria: []})}>
                            <option value="">-- اختر --</option>
                            {reportTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                     </div>
                     {tempConfig.type && (
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                               {criteriaOptions[tempConfig.type]?.map((c: any) => (
                                   <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${tempConfig.criteria.includes(c.id) ? `bg-${initialStat.color}-50 border-${initialStat.color}-500` : 'bg-slate-50'}`}>
                                       <input type="checkbox" className="w-4 h-4" checked={tempConfig.criteria.includes(c.id)} onChange={(e) => {
                                            const newCriteria = e.target.checked ? [...tempConfig.criteria, c.id] : tempConfig.criteria.filter(id => id !== c.id);
                                            setTempConfig({...tempConfig, criteria: newCriteria});
                                         }} />
                                       <span className="text-xs font-bold">{c.label}</span>
                                   </label>
                               ))}
                         </div>
                     )}
                 </div>
                 <div className="p-4 border-t"><button onClick={handleApply} className={`w-full py-3 bg-${initialStat.color}-600 text-white rounded-xl font-black`}>تطبيق</button></div>
             </div>
         </div>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { lang, data } = useGlobal();
  const [showSpecialModal, setShowSpecialModal] = useState(false);

  const stats = [
    { label: lang === 'ar' ? 'إجمالي الحصص الاحتياط' : 'Total Substitutions', value: data.substitutions.length, color: 'blue', icon: <Users /> },
    { label: lang === 'ar' ? 'التقارير المكتملة' : 'Completed Reports', value: data.dailyReports.length, color: 'green', icon: <CheckCircle2 /> },
    { label: lang === 'ar' ? 'إجمالي المخالفات' : 'Violations', value: data.violations.length, color: 'red', icon: <AlertCircle /> },
    { label: lang === 'ar' ? 'عدد الطلاب' : 'Total Students', value: data.studentReports?.length || 0, color: 'cyan', icon: <GraduationCap /> },
    { label: lang === 'ar' ? 'الطلاب المتميزين' : 'Excellent Students', value: data.studentReports?.filter(s => s.isExcellent).length || 0, color: 'yellow', icon: <Star /> },
    { label: lang === 'ar' ? 'القائمة السوداء' : 'Blacklist', value: data.studentReports?.filter(s => s.isBlacklisted).length || 0, color: 'slate', icon: <ShieldAlert /> },
    { label: lang === 'ar' ? 'متابعة المعلمين' : 'Teachers Follow-up', value: data.teacherFollowUps.length || 0, color: 'purple', icon: <BookOpen /> },
    { label: lang === 'ar' ? 'إجمالي التأخر' : 'Lateness', value: data.latenessRecords?.length || 0, color: 'orange', icon: <Clock /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-arabic">
      <header><h2 className="text-2xl font-black text-slate-800">{lang === 'ar' ? `مرحباً بك في سجل المشرف الاحترافي` : 'Welcome'}</h2></header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{stats.map((stat, idx) => <DashboardWidget key={idx} id={`widget_${idx}`} initialStat={stat} data={data} lang={lang} />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border shadow-sm relative overflow-hidden group">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2"><Calendar className="text-blue-500" /> {lang === 'ar' ? 'بيانات المدرسة' : 'Profile'}</h3>
          <div className="space-y-5">
            <div className="bg-slate-50 p-3 rounded-xl border"><span>{data.profile.schoolName || '---'}</span></div>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-slate-800"><Clock className="text-green-500" /> {lang === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => setShowSpecialModal(true)} className={`flex flex-col items-center justify-center p-5 rounded-2xl border bg-slate-50 hover:bg-indigo-50 transition-all gap-3 group relative overflow-hidden`}><div className={`p-3 bg-white rounded-xl shadow-sm text-indigo-500 group-hover:scale-110 transition-transform`}><FileText className="w-6 h-6"/></div><span className="text-xs font-black text-slate-600 group-hover:text-slate-800">تقارير خاصة</span></button>
          </div>
        </div>
      </div>
      {showSpecialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b bg-slate-50"><span className="text-xl font-black text-slate-800 flex items-center gap-2"><FileText size={24} className="text-indigo-600"/> تقارير خاصة ومتقدمة</span><button onClick={() => setShowSpecialModal(false)} className="bg-white p-2 rounded-full border shadow-sm"><X size={20}/></button></div>
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
                    <div className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all">
                        <h3 className="text-lg font-black text-blue-700 mb-4 flex items-center gap-2 border-b pb-2"><Briefcase size={20}/> المشرف الإداري</h3>
                        <div className="grid grid-cols-2 gap-2">{["الخطة الفصلية", "الخلاصة الشهرية"].map((item, i) => <button key={i} className="p-2 text-xs font-bold text-slate-600 bg-slate-50 rounded-lg text-right">{item}</button>)}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all">
                        <h3 className="text-lg font-black text-green-700 mb-4 flex items-center gap-2 border-b pb-2"><GraduationCap size={20}/> الطلاب/ الطالبات</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {["الغياب اليومي", "التأخر", "المخالفات"].map((item, i) => <button key={i} className="p-3 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl flex items-center gap-2"> <div className="w-2 h-2 rounded-full bg-green-400"></div> {item}</button>)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
