import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from '../context/GlobalState';
import { 
  Users, CheckCircle2, AlertCircle, FileText, 
  TrendingUp, Calendar, Clock, Filter, ChevronLeft, ChevronRight, X, Check, PlayCircle,
  GraduationCap, BookOpen, Activity, AlertTriangle, ShieldAlert, Star
} from 'lucide-react';

const DashboardWidget: React.FC<{ id: string, initialStat: any, data: any, lang: string }> = ({ id, initialStat, data, lang }) => {
  // Persistent State
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem(`widget_config_${id}`);
    return saved ? JSON.parse(saved) : { type: '', criteria: [], interval: 5000 };
  });

  const [mode, setMode] = useState<'default' | 'custom'>(() => {
    return localStorage.getItem(`widget_config_${id}`) ? 'custom' : 'default';
  });

  const [showFilter, setShowFilter] = useState(false);
  const [tempConfig, setTempConfig] = useState(config);
  const [slides, setSlides] = useState<string[][]>([]); // Array of arrays (pages of lines)
  const [currentIndex, setCurrentIndex] = useState(0);

  // Save config whenever it changes
  useEffect(() => {
    if (mode === 'custom') {
      localStorage.setItem(`widget_config_${id}`, JSON.stringify(config));
    }
  }, [config, mode, id]);

  const reportTypes = [
    { id: 'students', label: lang === 'ar' ? 'تقارير الطلاب' : 'Students' },
    { id: 'teachers', label: lang === 'ar' ? 'متابعة المعلمين' : 'Teachers' },
    { id: 'violations', label: lang === 'ar' ? 'التعهدات' : 'Violations' },
    { id: 'substitutions', label: lang === 'ar' ? 'تغطية الحصص' : 'Substitutions' },
  ];

  const criteriaOptions: any = {
    students: [
      { id: 'excellent', label: lang === 'ar' ? 'المتميزين' : 'Excellent', icon: '🌟' },
      { id: 'blacklisted', label: lang === 'ar' ? 'القائمة السوداء' : 'Blacklisted', icon: '⛔' },
      { id: 'health', label: lang === 'ar' ? 'حالات صحية' : 'Health Issues', icon: '🏥' },
      { id: 'behavior', label: lang === 'ar' ? 'سلوكيات' : 'Behavior', icon: '🤬' },
      { id: 'academic_weak', label: lang === 'ar' ? 'ضعف دراسي' : 'Academic Weakness', icon: '📉' },
      { id: 'work', label: lang === 'ar' ? 'يعملون' : 'Working', icon: '💼' },
      { id: 'guardian', label: lang === 'ar' ? 'تعاون ولي الأمر (ضعيف)' : 'Guardian (Poor)', icon: '🤝' },
    ],
    teachers: [
      { id: 'top', label: lang === 'ar' ? 'الأعلى أداءً' : 'Top Performers', icon: '🥇' },
      { id: 'low', label: lang === 'ar' ? 'الأقل أداءً' : 'Low Performers', icon: '🔻' },
      { id: 'violations', label: lang === 'ar' ? 'لديهم مخالفات' : 'Violations', icon: '🚫' },
      { id: 'attendance', label: lang === 'ar' ? 'ضعف الحضور' : 'Low Attendance', icon: '📅' },
      { id: 'preparation', label: lang === 'ar' ? 'ضعف التحضير' : 'Low Prep', icon: '📝' },
    ],
    violations: [
      { id: 'pledge', label: lang === 'ar' ? 'تعهد' : 'Pledge', icon: '📝' },
      { id: 'warning', label: lang === 'ar' ? 'إنذار' : 'Warning', icon: '⚠️' },
      { id: 'suspension', label: lang === 'ar' ? 'فصل' : 'Suspension', icon: '⛔' },
      { id: 'recent', label: lang === 'ar' ? 'أحدث 5' : 'Recent 5', icon: '🕒' },
    ],
    substitutions: [
      { id: 'recent', label: lang === 'ar' ? 'أحدث التغطيات' : 'Recent', icon: '🔄' },
      { id: 'absent', label: lang === 'ar' ? 'المعلم الغائب' : 'Absent', icon: '👤' },
      { id: 'pending', label: lang === 'ar' ? 'غير موقعة' : 'Pending Sig', icon: '⏳' },
    ]
  };

  useEffect(() => {
    if (mode === 'default') return;
    
    let allLines: string[] = [];
    
    if (config.type === 'students') {
       const students = data.studentReports || [];
       if (config.criteria.includes('excellent')) {
          students.filter((s:any) => s.isExcellent).forEach((s:any) => allLines.push(`🌟 ${lang==='ar'?'المتميزين':'Excellent'}: ${s.name}`));
       }
       if (config.criteria.includes('blacklisted')) {
          students.filter((s:any) => s.isBlacklisted).forEach((s:any) => allLines.push(`⛔ ${lang==='ar'?'القائمة السوداء':'Blacklist'}: ${s.name}`));
       }
       if (config.criteria.includes('health')) {
          students.filter((s:any) => s.healthStatus.includes('مريض') || s.healthStatus !== 'ممتاز').forEach((s:any) => allLines.push(`🏥 ${lang==='ar'?'صحي':'Health'}: ${s.name} (${s.healthStatus})`));
       }
       if (config.criteria.includes('behavior')) {
          students.filter((s:any) => ['ضعيف', 'سيء', 'مشاغب', 'ضعيف جدا'].some((v:string) => s.behaviorLevel.includes(v))).forEach((s:any) => allLines.push(`🤬 ${lang==='ar'?'سلوك':'Behavior'}: ${s.name}`));
       }
       if (config.criteria.includes('academic_weak')) {
          students.filter((s:any) => ['ضعيف', 'ضعيف جدا'].some((v:string) => s.academicReading.includes(v) || s.academicWriting.includes(v))).forEach((s:any) => allLines.push(`📉 ${lang==='ar'?'دراسي':'Academic'}: ${s.name}`));
       }
       if (config.criteria.includes('work')) {
          students.filter((s:any) => s.workOutside === 'يعمل').forEach((s:any) => allLines.push(`💼 ${lang==='ar'?'عمل':'Work'}: ${s.name}`));
       }
       if (config.criteria.includes('guardian')) {
          students.filter((s:any) => ['ضعيفة', 'متذمر', 'عدواني'].some((v:string) => s.guardianCooperation.includes(v))).forEach((s:any) => allLines.push(`🤝 ${lang==='ar'?'ولي أمر':'Guardian'}: ${s.name}`));
       }
    } else if (config.type === 'teachers') {
       const report = data.dailyReports[data.dailyReports.length - 1];
       const teachers = report ? report.teachersData : [];
       
       if (config.criteria.includes('top')) {
          [...teachers].sort((a:any,b:any) => {
             const scoreA = Object.values(a).filter(v => typeof v === 'number').reduce((x:any,y:any)=>x+y,0) as number;
             const scoreB = Object.values(b).filter(v => typeof v === 'number').reduce((x:any,y:any)=>x+y,0) as number;
             return scoreB - scoreA;
          }).slice(0, 5).forEach((t:any) => allLines.push(`🥇 ${lang==='ar'?'الأول':'Top'}: ${t.teacherName}`));
       }
       if (config.criteria.includes('low')) {
           [...teachers].sort((a:any,b:any) => {
             const scoreA = Object.values(a).filter(v => typeof v === 'number').reduce((x:any,y:any)=>x+y,0) as number;
             const scoreB = Object.values(b).filter(v => typeof v === 'number').reduce((x:any,y:any)=>x+y,0) as number;
             return scoreA - scoreB;
          }).slice(0, 5).forEach((t:any) => allLines.push(`🔻 ${lang==='ar'?'الأقل':'Low'}: ${t.teacherName}`));
       }
       if (config.criteria.includes('violations')) {
          teachers.filter((t:any) => t.violations_score > 0).forEach((t:any) => allLines.push(`🚫 ${lang==='ar'?'مخالفة':'Violation'}: ${t.teacherName}`));
       }
       if (config.criteria.includes('attendance')) {
          teachers.filter((t:any) => t.attendance < 5).forEach((t:any) => allLines.push(`📅 ${lang==='ar'?'حضور':'Attendance'}: ${t.teacherName}`));
       }
       if (config.criteria.includes('preparation')) {
          teachers.filter((t:any) => t.preparation < 8).forEach((t:any) => allLines.push(`📝 ${lang==='ar'?'تحضير':'Prep'}: ${t.teacherName}`));
       }
    } else if (config.type === 'violations') {
       const vs = data.violations || [];
       if (config.criteria.includes('recent')) {
          vs.slice(-5).forEach((v:any) => allLines.push(`🕒 ${lang==='ar'?'جديد':'Recent'}: ${v.studentName} (${v.type})`));
       }
       if (config.criteria.includes('pledge')) {
          vs.filter((v:any) => v.type === 'تعهد').forEach((v:any) => allLines.push(`📝 ${lang==='ar'?'تعهد':'Pledge'}: ${v.studentName}`));
       }
       if (config.criteria.includes('warning')) {
          vs.filter((v:any) => v.type === 'إنذار').forEach((v:any) => allLines.push(`⚠️ ${lang==='ar'?'إنذار':'Warning'}: ${v.studentName}`));
       }
       if (config.criteria.includes('suspension')) {
          vs.filter((v:any) => v.type === 'فصل').forEach((v:any) => allLines.push(`⛔ ${lang==='ar'?'فصل':'Suspension'}: ${v.studentName}`));
       }
    } else if (config.type === 'substitutions') {
       const subs = data.substitutions || [];
       if (config.criteria.includes('recent')) {
          subs.slice(-5).forEach((s:any) => allLines.push(`🔄 ${lang==='ar'?'تغطية':'Sub'}: ${s.absentTeacher} (${s.date})`));
       }
       if (config.criteria.includes('absent')) {
          const counts = subs.reduce((acc:any, s:any) => { acc[s.absentTeacher] = (acc[s.absentTeacher]||0)+1; return acc; }, {});
          Object.entries(counts).forEach(([k,v]) => allLines.push(`👤 ${lang==='ar'?'غياب':'Absent'}: ${k} (${v})`));
       }
       if (config.criteria.includes('pending')) {
          subs.forEach((s:any) => {
             // Check pending signatures
             [1,2,3,4,5,6,7].forEach(n => {
                if (s[`p${n}`] && s[`sig${n}`] !== 'تمت الموافقة') {
                   allLines.push(`⏳ ${lang==='ar'?'توقيع':'Sig'}: ${s[`p${n}`]} (ح${n})`);
                }
             });
          });
       }
    }

    if (allLines.length === 0) allLines.push(lang === 'ar' ? '✨ لا توجد بيانات مطابقة' : 'No matching data');

    // Group into pages of 3 lines
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

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % slides.length);
  };
  
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
  };

  const handleApply = () => {
     setConfig(tempConfig);
     setMode('custom');
     setShowFilter(false);
  };

  const currentLabel = reportTypes.find(t => t.id === config.type)?.label;

  return (
    <div className={`relative bg-gradient-to-br from-white to-${initialStat.color}-50 p-4 rounded-2xl border shadow-sm hover:shadow-lg transition-all overflow-hidden h-48 flex flex-col justify-center group`}>
      
      {/* Geometric Background Shapes */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-${initialStat.color}-100 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700`}></div>
      <div className={`absolute -left-8 -bottom-8 w-32 h-32 rounded-full border-[20px] border-${initialStat.color}-50 opacity-30 pointer-events-none`}></div>
      <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 100 L100 0 L100 100 Z" fill="currentColor" />
      </svg>

      {/* Filter Toggle */}
      <button 
        onClick={() => {
            setShowFilter(true);
            setTempConfig(config.type ? config : { ...config, type: 'students' });
        }}
        className="absolute top-2 left-2 z-20 p-1.5 bg-white/80 hover:bg-white text-slate-500 rounded-lg shadow-sm backdrop-blur transition-all border border-slate-100"
      >
        <Filter size={14} />
      </button>

      {/* Content */}
      {mode === 'default' ? (
        <div className="flex flex-col items-center justify-center text-center">
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 relative z-10 bg-${initialStat.color}-100 text-${initialStat.color}-600 shadow-inner`}>
             {initialStat.icon}
           </div>
           <div className="text-4xl font-black text-slate-800 relative z-10 tracking-tight">{initialStat.value}</div>
           <div className="text-xs text-slate-500 font-bold relative z-10 mt-1 uppercase tracking-wider">{initialStat.label}</div>
        </div>
      ) : (
        <div className="relative z-10 w-full h-full flex flex-col pt-6">
            {/* Header: Filter Name */}
            <div className="absolute top-0 right-0 left-0 text-center">
               <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black bg-${initialStat.color}-100 text-${initialStat.color}-700 shadow-sm border border-${initialStat.color}-200`}>
                 {currentLabel}
               </span>
            </div>

            {/* Slides */}
            <div className="flex-1 flex flex-col justify-center items-center w-full animate-in fade-in duration-300">
                <div className="space-y-2 w-full px-2">
                    {slides[currentIndex]?.map((line, idx) => (
                      <div key={idx} className="w-full bg-white/60 backdrop-blur-sm p-2 rounded-lg border border-slate-100 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-700 animate-in slide-in-from-right-2" style={{ animationDelay: `${idx * 100}ms` }}>
                          <span className="flex-1 truncate text-right" dir="rtl">{line}</span>
                      </div>
                    ))}
                </div>
            </div>

            {/* Navigation & Progress */}
            <div className="flex items-center justify-between w-full mt-2 px-1">
                <button onClick={handlePrev} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-full transition-all">
                    <ChevronRight size={16} />
                </button>
                <div className="flex gap-1">
                   {slides.length > 1 && slides.map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentIndex ? `w-4 bg-${initialStat.color}-500` : 'w-1.5 bg-slate-300'}`}></div>
                   ))}
                </div>
                <button onClick={handleNext} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-full transition-all">
                    <ChevronLeft size={16} />
                </button>
            </div>
            
            <button onClick={() => { setMode('default'); localStorage.removeItem(`widget_config_${id}`); }} className="absolute bottom-1 right-2 text-[9px] text-slate-400 hover:text-red-500 font-bold transition-colors">✕</button>
        </div>
      )}

      {/* Filter Modal Overlay */}
      {showFilter && (
         <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 p-4 flex flex-col animate-in zoom-in duration-200 rounded-2xl">
             <div className="flex justify-between items-center mb-3 border-b pb-2">
                <span className="text-sm font-black text-slate-800">تصفية البيانات</span>
                <button onClick={() => setShowFilter(false)} className="bg-slate-100 p-1 rounded-full hover:bg-slate-200"><X size={14} className="text-slate-500"/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">نوع التقرير</label>
                    <select 
                      className="w-full text-xs p-2 border rounded-xl bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      value={tempConfig.type}
                      onChange={(e) => setTempConfig({...tempConfig, type: e.target.value, criteria: []})}
                    >
                        <option value="">اختر التقرير...</option>
                        {reportTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                 </div>
                 
                 {tempConfig.type && (
                     <div className="animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">المعايير (اختر ما تريد)</label>
                        <div className="grid grid-cols-1 gap-1.5">
                           {criteriaOptions[tempConfig.type]?.map((c: any) => (
                               <label key={c.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${tempConfig.criteria.includes(c.id) ? `bg-${initialStat.color}-50 border-${initialStat.color}-200` : 'hover:bg-slate-50 border-slate-100'}`}>
                                   <input 
                                     type="checkbox" 
                                     className={`rounded text-${initialStat.color}-600 focus:ring-0 w-3.5 h-3.5`}
                                     checked={tempConfig.criteria.includes(c.id)}
                                     onChange={(e) => {
                                        const newCriteria = e.target.checked 
                                          ? [...tempConfig.criteria, c.id]
                                          : tempConfig.criteria.filter(id => id !== c.id);
                                        setTempConfig({...tempConfig, criteria: newCriteria});
                                     }}
                                   />
                                   <span className="text-lg">{c.icon}</span>
                                   <span className="text-[10px] font-bold text-slate-700">{c.label}</span>
                               </label>
                           ))}
                        </div>
                     </div>
                 )}

                 <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">سرعة العرض</label>
                    <div className="flex gap-2">
                      {[3000, 5000, 10000].map(time => (
                        <button 
                          key={time}
                          onClick={() => setTempConfig({...tempConfig, interval: time})}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${tempConfig.interval === time ? `bg-${initialStat.color}-600 text-white border-${initialStat.color}-600` : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                        >
                           {time/1000} ث
                        </button>
                      ))}
                    </div>
                 </div>
             </div>

             <button onClick={handleApply} className={`mt-3 w-full py-2.5 bg-${initialStat.color}-600 text-white rounded-xl text-xs font-black hover:bg-${initialStat.color}-700 shadow-lg shadow-${initialStat.color}-200 transition-all transform active:scale-95`}>
                تطبيق الفلتر
             </button>
         </div>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { lang, data } = useGlobal();

  const stats = [
    { 
      label: lang === 'ar' ? 'إجمالي الحصص الاحتياط' : 'Total Substitutions', 
      value: data.substitutions.length, 
      color: 'blue', 
      icon: <Users /> 
    },
    { 
      label: lang === 'ar' ? 'التقارير المكتملة' : 'Completed Reports', 
      value: data.dailyReports.length, 
      color: 'green', 
      icon: <CheckCircle2 /> 
    },
    { 
      label: lang === 'ar' ? 'حالات الغياب اليوم' : 'Absences Today', 
      value: 0, 
      color: 'red', 
      icon: <AlertCircle /> 
    },
    { 
      label: lang === 'ar' ? 'التكليفات الطارئة' : 'Emergency Tasks', 
      value: 0, 
      color: 'amber', 
      icon: <TrendingUp /> 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-arabic">
      <header>
        <h2 className="text-2xl font-black text-slate-800">
          {lang === 'ar' ? `مرحباً بك في سجل المشرف الاحترافي` : 'Welcome to Professional Supervisor Log'}
        </h2>
        <p className="text-slate-500 font-bold mt-1">
          {lang === 'ar' ? 'نظام الإشراف الإداري والتربوي الرقمي' : 'Digital Administrative and Educational Supervision System'}
        </p>
      </header>

      {/* Stats Grid - Now using Dynamic Widgets with IDs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <DashboardWidget key={idx} id={`widget_${idx}`} initialStat={stat} data={data} lang={lang} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-slate-800">
            <Calendar className="text-blue-500" />
            {lang === 'ar' ? 'بيانات المدرسة' : 'School Profile'}
          </h3>
          <div className="space-y-5 relative z-10">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <label className="text-[10px] text-blue-500 font-black uppercase tracking-wider block mb-1">{lang === 'ar' ? 'اسم المدرسة' : 'School Name'}</label>
              <div className="text-slate-800 font-bold text-sm">{data.profile.schoolName || '---'}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <label className="text-[10px] text-blue-500 font-black uppercase tracking-wider block mb-1">{lang === 'ar' ? 'المشرف' : 'Supervisor'}</label>
              <div className="text-slate-800 font-bold text-sm">{data.profile.supervisorName || '---'}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <label className="text-[10px] text-blue-500 font-black uppercase tracking-wider block mb-1">{lang === 'ar' ? 'العام الدراسي' : 'Academic Year'}</label>
              <div className="text-slate-800 font-bold text-sm">{data.profile.year}</div>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-50 rounded-full opacity-50 pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-slate-800">
            <Clock className="text-green-500" />
            {lang === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'تقرير يومي', icon: <FileText className="w-6 h-6"/>, color: 'blue' },
              { label: 'تغطية حصة', icon: <Users className="w-6 h-6"/>, color: 'purple' },
              { label: 'تعهد طالب', icon: <AlertCircle className="w-6 h-6"/>, color: 'red' },
              { label: 'خطة إشراف', icon: <Calendar className="w-6 h-6"/>, color: 'green' },
            ].map((btn, i) => (
              <button key={i} className={`flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-${btn.color}-50 hover:border-${btn.color}-200 transition-all gap-3 group relative overflow-hidden`}>
                <div className={`p-3 bg-white rounded-xl shadow-sm text-${btn.color}-500 group-hover:scale-110 transition-transform`}>
                  {btn.icon}
                </div>
                <span className="text-xs font-black text-slate-600 group-hover:text-slate-800">{btn.label}</span>
                <div className={`absolute inset-0 bg-${btn.color}-500 opacity-0 group-hover:opacity-5 transition-opacity`}></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;