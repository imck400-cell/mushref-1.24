import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from '../context/GlobalState';
import { 
  Users, CheckCircle2, AlertCircle, FileText, 
  TrendingUp, Calendar, Clock, Filter, ChevronLeft, ChevronRight, X, Check, PlayCircle
} from 'lucide-react';

const DashboardWidget: React.FC<{ initialStat: any, data: any, lang: string }> = ({ initialStat, data, lang }) => {
  const [mode, setMode] = useState<'default' | 'custom'>('default');
  const [showFilter, setShowFilter] = useState(false);
  const [config, setConfig] = useState({
    type: '',
    criteria: [] as string[],
    interval: 3000
  });
  const [tempConfig, setTempConfig] = useState(config);
  const [slides, setSlides] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const reportTypes = [
    { id: 'students', label: lang === 'ar' ? 'تقارير الطلاب' : 'Students' },
    { id: 'teachers', label: lang === 'ar' ? 'متابعة المعلمين' : 'Teachers' },
    { id: 'violations', label: lang === 'ar' ? 'التعهدات' : 'Violations' },
    { id: 'substitutions', label: lang === 'ar' ? 'تغطية الحصص' : 'Substitutions' },
  ];

  const criteriaOptions: any = {
    students: [
      { id: 'excellent', label: lang === 'ar' ? 'المتميزين' : 'Excellent' },
      { id: 'blacklisted', label: lang === 'ar' ? 'القائمة السوداء' : 'Blacklisted' },
      { id: 'health', label: lang === 'ar' ? 'حالات صحية' : 'Health Issues' },
      { id: 'behavior', label: lang === 'ar' ? 'سلوكيات' : 'Behavior Issues' },
    ],
    teachers: [
      { id: 'top', label: lang === 'ar' ? 'الأعلى تقييماً' : 'Top Rated' },
      { id: 'low', label: lang === 'ar' ? 'الأقل تقييماً' : 'Low Rated' },
      { id: 'violations', label: lang === 'ar' ? 'لديهم مخالفات' : 'Has Violations' },
    ],
    violations: [
      { id: 'recent', label: lang === 'ar' ? 'أحدث المخالفات' : 'Recent' },
      { id: 'types', label: lang === 'ar' ? 'أنواع المخالفات' : 'Types' },
    ],
    substitutions: [
      { id: 'recent', label: lang === 'ar' ? 'أحدث التغطيات' : 'Recent' },
      { id: 'absent', label: lang === 'ar' ? 'المعلم الغائب' : 'Absent Teacher' },
    ]
  };

  useEffect(() => {
    if (mode === 'default') return;
    
    let items: string[] = [];
    
    if (config.type === 'students') {
       const students = data.studentReports || [];
       if (config.criteria.includes('excellent')) {
          students.filter((s:any) => s.isExcellent).forEach((s:any) => items.push(`🌟 ${s.name} - ${s.grade}`));
       }
       if (config.criteria.includes('blacklisted')) {
          students.filter((s:any) => s.isBlacklisted).forEach((s:any) => items.push(`⛔ ${s.name} - ${s.grade}`));
       }
       if (config.criteria.includes('health')) {
          students.filter((s:any) => s.healthStatus.includes('مريض')).forEach((s:any) => items.push(`🏥 ${s.name}: ${s.healthStatus}`));
       }
       if (config.criteria.includes('behavior')) {
          students.filter((s:any) => ['ضعيف', 'مشاغب', 'سيء'].some((v:string) => s.behaviorLevel.includes(v))).forEach((s:any) => items.push(`⚠️ ${s.name}: ${s.behaviorLevel}`));
       }
    } else if (config.type === 'teachers') {
       const report = data.dailyReports[data.dailyReports.length - 1];
       const teachers = report ? report.teachersData : [];
       
       if (config.criteria.includes('top')) {
          [...teachers].sort((a:any,b:any) => {
             const scoreA = Object.values(a).filter(v => typeof v === 'number').reduce((x:any,y:any)=>x+y,0) as number;
             const scoreB = Object.values(b).filter(v => typeof v === 'number').reduce((x:any,y:any)=>x+y,0) as number;
             return scoreB - scoreA;
          }).slice(0, 5).forEach((t:any) => items.push(`🥇 ${t.teacherName}`));
       }
       if (config.criteria.includes('low')) {
           [...teachers].sort((a:any,b:any) => {
             const scoreA = Object.values(a).filter(v => typeof v === 'number').reduce((x:any,y:any)=>x+y,0) as number;
             const scoreB = Object.values(b).filter(v => typeof v === 'number').reduce((x:any,y:any)=>x+y,0) as number;
             return scoreA - scoreB;
          }).slice(0, 5).forEach((t:any) => items.push(`📉 ${t.teacherName}`));
       }
       if (config.criteria.includes('violations')) {
          teachers.filter((t:any) => t.violations_score > 0).forEach((t:any) => items.push(`🔴 ${t.teacherName}: -${t.violations_score}`));
       }
    } else if (config.type === 'violations') {
       const vs = data.violations || [];
       if (config.criteria.includes('recent')) {
          vs.slice(-5).forEach((v:any) => items.push(`⚠️ ${v.studentName}: ${v.type}`));
       }
       if (config.criteria.includes('types')) {
          const counts = vs.reduce((acc:any, v:any) => { acc[v.type] = (acc[v.type]||0)+1; return acc; }, {});
          Object.entries(counts).forEach(([k,v]) => items.push(`📊 ${k}: ${v}`));
       }
    } else if (config.type === 'substitutions') {
       const subs = data.substitutions || [];
       if (config.criteria.includes('recent')) {
          subs.slice(-5).forEach((s:any) => items.push(`🔄 ${s.absentTeacher} -> ${s.date}`));
       }
       if (config.criteria.includes('absent')) {
          const counts = subs.reduce((acc:any, s:any) => { acc[s.absentTeacher] = (acc[s.absentTeacher]||0)+1; return acc; }, {});
          Object.entries(counts).forEach(([k,v]) => items.push(`👤 ${k}: ${v}`));
       }
    }

    if (items.length === 0) items.push(lang === 'ar' ? 'لا توجد بيانات' : 'No Data');
    setSlides(items);
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

  return (
    <div className={`relative bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden h-40 flex flex-col justify-center`}>
      {/* Background decoration matching initial color */}
      <div className={`absolute inset-0 opacity-10 bg-${initialStat.color}-100 pointer-events-none`}></div>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-${initialStat.color}-50 opacity-50 pointer-events-none`}></div>

      {/* Filter Toggle */}
      <button 
        onClick={() => {
            setShowFilter(true);
            setTempConfig(config.type ? config : { ...config, type: 'students' });
        }}
        className="absolute top-2 left-2 z-20 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
      >
        <Filter size={14} />
      </button>

      {/* Content */}
      {mode === 'default' ? (
        <>
           <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 relative z-10 bg-${initialStat.color}-100 text-${initialStat.color}-600`}>
             {initialStat.icon}
           </div>
           <div className="text-3xl font-black text-slate-800 relative z-10">{initialStat.value}</div>
           <div className="text-sm text-slate-500 font-bold relative z-10">{initialStat.label}</div>
        </>
      ) : (
        <div className="relative z-10 w-full flex items-center justify-center">
            <button onClick={handlePrev} className="absolute -right-2 p-1 bg-white/50 hover:bg-white text-slate-700 rounded-full backdrop-blur-sm transition-all shadow-sm">
                <ChevronRight size={18} />
            </button>
            
            <div className="text-center px-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-lg font-black text-slate-800 leading-tight">
                    {slides[currentIndex]}
                </p>
                <div className="flex justify-center gap-1 mt-2">
                   {slides.length > 1 && slides.map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentIndex ? `w-6 bg-${initialStat.color}-500` : 'w-1.5 bg-slate-200'}`}></div>
                   ))}
                </div>
            </div>

            <button onClick={handleNext} className="absolute -left-2 p-1 bg-white/50 hover:bg-white text-slate-700 rounded-full backdrop-blur-sm transition-all shadow-sm">
                <ChevronLeft size={18} />
            </button>
            
            <button onClick={() => setMode('default')} className="absolute bottom-[-50px] text-[10px] text-slate-400 underline">استعادة الافتراضي</button>
        </div>
      )}

      {/* Filter Modal Overlay */}
      {showFilter && (
         <div className="absolute inset-0 bg-white z-30 p-3 flex flex-col animate-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-2 border-b pb-2">
                <span className="text-xs font-bold text-slate-800">تصفية البيانات</span>
                <button onClick={() => setShowFilter(false)}><X size={14} className="text-slate-400"/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">نوع التقرير</label>
                    <select 
                      className="w-full text-xs p-1.5 border rounded bg-slate-50 font-bold"
                      value={tempConfig.type}
                      onChange={(e) => setTempConfig({...tempConfig, type: e.target.value, criteria: []})}
                    >
                        <option value="">اختر...</option>
                        {reportTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                 </div>
                 
                 {tempConfig.type && (
                     <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">المعايير (واحد أو أكثر)</label>
                        <div className="space-y-1">
                           {criteriaOptions[tempConfig.type]?.map((c: any) => (
                               <label key={c.id} className="flex items-center gap-2 p-1.5 rounded border border-slate-100 hover:bg-slate-50 cursor-pointer">
                                   <input 
                                     type="checkbox" 
                                     className="rounded text-blue-600 focus:ring-0 w-3 h-3"
                                     checked={tempConfig.criteria.includes(c.id)}
                                     onChange={(e) => {
                                        const newCriteria = e.target.checked 
                                          ? [...tempConfig.criteria, c.id]
                                          : tempConfig.criteria.filter(id => id !== c.id);
                                        setTempConfig({...tempConfig, criteria: newCriteria});
                                     }}
                                   />
                                   <span className="text-[10px] font-bold text-slate-700">{c.label}</span>
                               </label>
                           ))}
                        </div>
                     </div>
                 )}

                 <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">مدة العرض (ثواني)</label>
                    <select 
                      className="w-full text-xs p-1.5 border rounded bg-slate-50 font-bold"
                      value={tempConfig.interval}
                      onChange={(e) => setTempConfig({...tempConfig, interval: parseInt(e.target.value)})}
                    >
                        <option value="2000">2 ثانية</option>
                        <option value="3000">3 ثواني</option>
                        <option value="5000">5 ثواني</option>
                        <option value="10000">10 ثواني</option>
                    </select>
                 </div>
             </div>

             <button onClick={handleApply} className="mt-2 w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">
                تطبيق
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">
          {lang === 'ar' ? `مرحباً بك في سجل المشرف الاحترافي` : 'Welcome to Professional Supervisor Log'}
        </h2>
        <p className="text-slate-500">
          {lang === 'ar' ? 'نظام الإشراف الإداري والتربوي الرقمي' : 'Digital Administrative and Educational Supervision System'}
        </p>
      </header>

      {/* Stats Grid - Now using Dynamic Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <DashboardWidget key={idx} initialStat={stat} data={data} lang={lang} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Calendar className="text-blue-500" />
            {lang === 'ar' ? 'بيانات المدرسة' : 'School Profile'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase">{lang === 'ar' ? 'اسم المدرسة' : 'School Name'}</label>
              <div className="text-slate-700 font-semibold">{data.profile.schoolName || '---'}</div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase">{lang === 'ar' ? 'المشرف' : 'Supervisor'}</label>
              <div className="text-slate-700 font-semibold">{data.profile.supervisorName || '---'}</div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase">{lang === 'ar' ? 'العام الدراسي' : 'Academic Year'}</label>
              <div className="text-slate-700 font-semibold">{data.profile.year}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Clock className="text-green-500" />
            {lang === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'تقرير يومي', icon: <FileText /> },
              { label: 'تغطية حصة', icon: <Users /> },
              { label: 'تعهد طالب', icon: <AlertCircle /> },
              { label: 'خطة إشراف', icon: <Calendar /> },
            ].map((btn, i) => (
              <button key={i} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-600 hover:text-white hover:shadow-lg transition-all gap-2 group">
                <span className="text-blue-500 group-hover:text-white">{btn.icon}</span>
                <span className="text-sm font-semibold">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;