import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from '../context/GlobalState';
import { 
  Users, CheckCircle2, AlertCircle, FileText, 
  TrendingUp, Calendar, Clock, Filter, ChevronLeft, ChevronRight, X, Check, PlayCircle,
  GraduationCap, BookOpen, Activity, AlertTriangle, ShieldAlert, Star, Search, Briefcase, ScrollText, ClipboardList
} from 'lucide-react';

const DashboardWidget: React.FC<{ id: string, initialStat: any, data: any, lang: string }> = ({ id, initialStat, data, lang }) => {
  // Persistent State
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
    { id: 'violations', label: lang === 'ar' ? 'التعهدات والمخالفات' : 'Violations' },
    { id: 'substitutions', label: lang === 'ar' ? 'تغطية الحصص' : 'Substitutions' },
    // New Report Types
    { id: 'student_absence', label: lang === 'ar' ? 'غياب الطلاب' : 'Student Absence' },
    { id: 'teacher_absence', label: lang === 'ar' ? 'غياب المعلم' : 'Teacher Absence' },
    { id: 'admin_absence', label: lang === 'ar' ? 'غياب الإداري' : 'Admin Absence' },
  ];

  const criteriaOptions: any = {
    students: [
      { id: 'excellent', label: lang === 'ar' ? 'المتميزين' : 'Excellent', icon: '🌟' },
      { id: 'blacklisted', label: lang === 'ar' ? 'القائمة السوداء' : 'Blacklisted', icon: '⛔' },
      { id: 'health', label: lang === 'ar' ? 'حالات صحية' : 'Health Issues', icon: '🏥' },
      { id: 'behavior', label: lang === 'ar' ? 'سلوكيات (مشاغب/سيء)' : 'Bad Behavior', icon: '🤬' },
      { id: 'academic_weak', label: lang === 'ar' ? 'ضعف دراسي عام' : 'Weak Academic', icon: '📉' },
      { id: 'weak_reading', label: lang === 'ar' ? 'ضعف في القراءة' : 'Weak Reading', icon: '📖' },
      { id: 'weak_writing', label: lang === 'ar' ? 'ضعف في الكتابة' : 'Weak Writing', icon: '✍️' },
      { id: 'work', label: lang === 'ar' ? 'يعملون خارج المدرسة' : 'Working', icon: '💼' },
      { id: 'guardian_poor', label: lang === 'ar' ? 'تعاون ولي الأمر (ضعيف)' : 'Guardian (Poor)', icon: '👎' },
      { id: 'guardian_aggressive', label: lang === 'ar' ? 'ولي الأمر (عدواني/متذمر)' : 'Guardian (Aggressive)', icon: '😤' },
      { id: 'orphan', label: lang === 'ar' ? 'أيتام (حسب الملاحظات)' : 'Orphans', icon: '💔' },
    ],
    teachers: [
      { id: 'top', label: lang === 'ar' ? 'الأعلى أداءً' : 'Top Performers', icon: '🥇' },
      { id: 'low', label: lang === 'ar' ? 'الأقل أداءً' : 'Low Performers', icon: '🔻' },
      { id: 'violations', label: lang === 'ar' ? 'لديهم مخالفات' : 'Violations', icon: '🚫' },
      { id: 'attendance', label: lang === 'ar' ? 'ضعف الحضور' : 'Low Attendance', icon: '📅' },
      { id: 'appearance', label: lang === 'ar' ? 'ضعف المظهر' : 'Low Appearance', icon: '👔' },
      { id: 'preparation', label: lang === 'ar' ? 'ضعف التحضير' : 'Low Prep', icon: '📝' },
      { id: 'supervision', label: lang === 'ar' ? 'تقصير في الإشراف' : 'Low Supervision', icon: '👀' },
      { id: 'correction', label: lang === 'ar' ? 'تقصير في التصحيح' : 'Low Correction', icon: '📚' },
      { id: 'aids', label: lang === 'ar' ? 'نقص الوسائل' : 'No Aids', icon: '🖥️' },
      { id: 'activities', label: lang === 'ar' ? 'نقص الأنشطة' : 'No Activities', icon: '⚽' },
    ],
    violations: [
      { id: 'pledge', label: lang === 'ar' ? 'تعهد' : 'Pledge', icon: '📝' },
      { id: 'warning', label: lang === 'ar' ? 'إنذار' : 'Warning', icon: '⚠️' },
      { id: 'suspension', label: lang === 'ar' ? 'فصل' : 'Suspension', icon: '⛔' },
      { id: 'summon', label: lang === 'ar' ? 'استدعاء ولي أمر' : 'Summon Guardian', icon: '📞' },
      { id: 'late_queue', label: lang === 'ar' ? 'تأخر عن طابور' : 'Late Queue', icon: '⏰' },
      { id: 'late_class', label: lang === 'ar' ? 'تأخر عن حصة' : 'Late Class', icon: '🏃' },
      { id: 'escape', label: lang === 'ar' ? 'خروج من الحصة' : 'Escape', icon: '🚪' },
      { id: 'recent', label: lang === 'ar' ? 'أحدث 5' : 'Recent 5', icon: '🕒' },
    ],
    substitutions: [
      { id: 'recent', label: lang === 'ar' ? 'أحدث التغطيات' : 'Recent', icon: '🔄' },
      { id: 'absent', label: lang === 'ar' ? 'المعلم الغائب' : 'Absent', icon: '👤' },
      { id: 'pending', label: lang === 'ar' ? 'غير موقعة' : 'Pending Sig', icon: '⏳' },
      { id: 'paid', label: lang === 'ar' ? 'مدفوعة' : 'Paid', icon: '💰' },
    ],
    // Absence Report Criteria
    student_absence: [
        { id: 'disconnected', label: lang === 'ar' ? 'المنقطع' : 'Disconnected', icon: '🚫' },
        { id: 'most_absent', label: lang === 'ar' ? 'الأكثر غيابا' : 'Most Absent', icon: '📉' },
        { id: 'absent_2w', label: lang === 'ar' ? 'الغائب لأكثر من أسبوعين' : '> 2 Weeks', icon: '🗓️' },
        { id: 'absent_1w', label: lang === 'ar' ? 'الغائب لأكثر من أسبوع' : '> 1 Week', icon: 'dt' },
    ],
    teacher_absence: [
        { id: 'disconnected', label: lang === 'ar' ? 'المنقطع' : 'Disconnected', icon: '🚫' },
        { id: 'most_absent', label: lang === 'ar' ? 'الأكثر غيابا' : 'Most Absent', icon: '📉' },
        { id: 'absent_2w', label: lang === 'ar' ? 'الغائب لأكثر من أسبوعين' : '> 2 Weeks', icon: '🗓️' },
        { id: 'absent_1w', label: lang === 'ar' ? 'الغائب لأكثر من أسبوع' : '> 1 Week', icon: 'dt' },
    ],
    admin_absence: [
        { id: 'disconnected', label: lang === 'ar' ? 'المنقطع' : 'Disconnected', icon: '🚫' },
        { id: 'most_absent', label: lang === 'ar' ? 'الأكثر غيابا' : 'Most Absent', icon: '📉' },
        { id: 'absent_2w', label: lang === 'ar' ? 'الغائب لأكثر من أسبوعين' : '> 2 Weeks', icon: '🗓️' },
        { id: 'absent_1w', label: lang === 'ar' ? 'الغائب لأكثر من أسبوع' : '> 1 Week', icon: 'dt' },
    ]
  };

  useEffect(() => {
    if (mode === 'default') return;
    
    let allLines: string[] = [];
    
    // Time Filter Helper
    const checkDate = (dateStr: string) => {
        if (!dateStr) return false;
        const targetDate = new Date(dateStr);
        targetDate.setHours(0,0,0,0);
        
        // Custom Date Range Check
        if (config.startDate) {
            const start = new Date(config.startDate);
            start.setHours(0,0,0,0);
            if (targetDate < start) return false;
        }
        if (config.endDate) {
            const end = new Date(config.endDate);
            end.setHours(0,0,0,0);
            if (targetDate > end) return false;
        }

        if (config.timeRange === 'all' || !config.timeRange) return true;
        const today = new Date();
        today.setHours(0,0,0,0);
        const diffTime = Math.abs(today.getTime() - targetDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (config.timeRange === 'daily') return today.getTime() === targetDate.getTime();
        if (config.timeRange === 'weekly') return diffDays <= 7;
        if (config.timeRange === 'monthly') return diffDays <= 30;
        return true;
    };

    if (config.type === 'students') {
       const students = (data.studentReports || []).filter((s:any) => checkDate(s.createdAt));
       if (config.criteria.includes('excellent')) students.filter((s:any) => s.isExcellent).forEach((s:any) => allLines.push(`🌟 ${s.name}`));
       if (config.criteria.includes('blacklisted')) students.filter((s:any) => s.isBlacklisted).forEach((s:any) => allLines.push(`⛔ ${s.name}`));
       if (config.criteria.includes('health')) students.filter((s:any) => s.healthStatus.includes('مريض') || s.healthStatus !== 'ممتاز').forEach((s:any) => allLines.push(`🏥 ${s.name} (${s.healthStatus})`));
       if (config.criteria.includes('behavior')) students.filter((s:any) => ['ضعيف', 'سيء', 'مشاغب', 'ضعيف جدا'].some((v:string) => s.behaviorLevel.includes(v))).forEach((s:any) => allLines.push(`🤬 ${s.name}`));
       if (config.criteria.includes('academic_weak')) students.filter((s:any) => ['ضعيف', 'ضعيف جدا'].some((v:string) => s.academicReading.includes(v) || s.academicWriting.includes(v))).forEach((s:any) => allLines.push(`📉 ${s.name}`));
       if (config.criteria.includes('weak_reading')) students.filter((s:any) => s.academicReading.includes('ضعيف')).forEach((s:any) => allLines.push(`📖 ${s.name}`));
       if (config.criteria.includes('weak_writing')) students.filter((s:any) => s.academicWriting.includes('ضعيف')).forEach((s:any) => allLines.push(`✍️ ${s.name}`));
       if (config.criteria.includes('work')) students.filter((s:any) => s.workOutside === 'يعمل').forEach((s:any) => allLines.push(`💼 ${s.name}`));
       if (config.criteria.includes('guardian_poor')) students.filter((s:any) => s.guardianCooperation.includes('ضعيفة')).forEach((s:any) => allLines.push(`👎 ${s.name}`));
       if (config.criteria.includes('guardian_aggressive')) students.filter((s:any) => ['متذمر', 'عدواني', 'كثير النقد'].some((v:string) => s.guardianCooperation.includes(v))).forEach((s:any) => allLines.push(`😤 ${s.name}`));
       if (config.criteria.includes('orphan')) students.filter((s:any) => (s.notes||'').includes('يتيم') || (s.mainNotes||[]).includes('يتيم')).forEach((s:any) => allLines.push(`💔 ${s.name}`));

    } else if (config.type === 'teachers') {
       const filteredReports = data.dailyReports.filter((r:any) => checkDate(r.dateStr));
       const teachers: any[] = [];
       filteredReports.forEach((r:any) => {
           r.teachersData.forEach((t:any) => teachers.push({ ...t, _reportDate: r.dateStr }));
       });
       
       if (config.criteria.includes('top')) {
          [...teachers].sort((a:any,b:any) => {
             const scoreA = Object.values(a).filter(v => typeof v === 'number').reduce((x:any,y:any)=>x+y,0) as number;
             const scoreB = Object.values(b).filter(v => typeof v === 'number').reduce((x:any,y:any)=>x+y,0) as number;
             return scoreB - scoreA;
          }).slice(0, 5).forEach((t:any) => allLines.push(`🥇 ${t.teacherName}`));
       }
       if (config.criteria.includes('low')) {
           [...teachers].sort((a:any,b:any) => {
             const scoreA = Object.values(a).filter(v => typeof v === 'number').reduce((x:any,y:any)=>x+y,0) as number;
             const scoreB = Object.values(b).filter(v => typeof v === 'number').reduce((x:any,y:any)=>x+y,0) as number;
             return scoreA - scoreB;
          }).slice(0, 5).forEach((t:any) => allLines.push(`🔻 ${t.teacherName}`));
       }
       // Detailed Teacher Criteria
       const checkMetric = (t:any, key:string, threshold:number) => (t[key] || 0) < threshold;
       if (config.criteria.includes('appearance')) teachers.filter((t:any) => checkMetric(t, 'appearance', 5)).forEach((t:any) => allLines.push(`👔 ${t.teacherName}`));
       if (config.criteria.includes('attendance')) teachers.filter((t:any) => checkMetric(t, 'attendance', 5)).forEach((t:any) => allLines.push(`📅 ${t.teacherName}`));
       if (config.criteria.includes('preparation')) teachers.filter((t:any) => checkMetric(t, 'preparation', 8)).forEach((t:any) => allLines.push(`📝 ${t.teacherName}`));
       if (config.criteria.includes('supervision')) teachers.filter((t:any) => checkMetric(t, 'supervision_queue', 5) || checkMetric(t, 'supervision_rest', 5)).forEach((t:any) => allLines.push(`👀 ${t.teacherName}`));
       if (config.criteria.includes('correction')) teachers.filter((t:any) => checkMetric(t, 'correction_books', 8) || checkMetric(t, 'correction_notebooks', 8)).forEach((t:any) => allLines.push(`📚 ${t.teacherName}`));
       if (config.criteria.includes('aids')) teachers.filter((t:any) => checkMetric(t, 'teaching_aids', 5)).forEach((t:any) => allLines.push(`🖥️ ${t.teacherName}`));
       if (config.criteria.includes('activities')) teachers.filter((t:any) => checkMetric(t, 'extra_activities', 5)).forEach((t:any) => allLines.push(`⚽ ${t.teacherName}`));
       if (config.criteria.includes('violations')) teachers.filter((t:any) => t.violations_score > 0).forEach((t:any) => allLines.push(`🚫 ${t.teacherName}`));

    } else if (config.type === 'violations') {
       const vs = (data.violations || []).filter((v:any) => checkDate(v.date));
       if (config.criteria.includes('recent')) vs.slice(-5).forEach((v:any) => allLines.push(`🕒 ${v.studentName} (${v.type})`));
       if (config.criteria.includes('pledge')) vs.filter((v:any) => v.type === 'تعهد').forEach((v:any) => allLines.push(`📝 ${v.studentName}`));
       if (config.criteria.includes('warning')) vs.filter((v:any) => v.type === 'إنذار').forEach((v:any) => allLines.push(`⚠️ ${v.studentName}`));
       if (config.criteria.includes('suspension')) vs.filter((v:any) => v.type === 'فصل' || v.type === 'فصل مؤقت').forEach((v:any) => allLines.push(`⛔ ${v.studentName}`));
       if (config.criteria.includes('summon')) vs.filter((v:any) => v.type.includes('استدعاء')).forEach((v:any) => allLines.push(`📞 ${v.studentName}`));
       if (config.criteria.includes('late_queue')) vs.filter((v:any) => (v.reason||'').includes('طابور')).forEach((v:any) => allLines.push(`⏰ ${v.studentName}`));
       if (config.criteria.includes('late_class')) vs.filter((v:any) => (v.reason||'').includes('حصة')).forEach((v:any) => allLines.push(`🏃 ${v.studentName}`));
       if (config.criteria.includes('escape')) vs.filter((v:any) => (v.reason||'').includes('خروج') || (v.reason||'').includes('هروب')).forEach((v:any) => allLines.push(`🚪 ${v.studentName}`));

    } else if (config.type === 'substitutions') {
       const subs = (data.substitutions || []).filter((s:any) => checkDate(s.date));
       if (config.criteria.includes('recent')) subs.slice(-5).forEach((s:any) => allLines.push(`🔄 ${s.absentTeacher} (${s.date})`));
       if (config.criteria.includes('absent')) {
          const counts = subs.reduce((acc:any, s:any) => { acc[s.absentTeacher] = (acc[s.absentTeacher]||0)+1; return acc; }, {});
          Object.entries(counts).forEach(([k,v]) => allLines.push(`👤 ${k} (${v})`));
       }
       if (config.criteria.includes('pending')) subs.forEach((s:any) => { [1,2,3,4,5,6,7].forEach(n => { if (s[`p${n}`] && s[`sig${n}`] !== 'تمت الموافقة') allLines.push(`⏳ ${s[`p${n}`]} (ح${n})`); }); });
       if (config.criteria.includes('paid')) subs.filter((s:any) => s.paymentStatus === 'paid').forEach((s:any) => allLines.push(`💰 ${s.absentTeacher}`));
    }
    // Absence Reports Logic
    else if (['teacher_absence', 'student_absence', 'admin_absence'].includes(config.type)) {
       let items: {name: string, count: number}[] = [];
       const threshold = config.absenceThreshold || 0;

       if (config.type === 'teacher_absence') {
          // Source from Substitutions (Absent Teacher)
          const counts = (data.substitutions || []).filter((s:any) => checkDate(s.date)).reduce((acc:any, s:any) => { 
             if(s.absentTeacher) acc[s.absentTeacher] = (acc[s.absentTeacher]||0)+1; 
             return acc; 
          }, {});
          items = Object.entries(counts).map(([name, count]) => ({name, count: count as number}));
       } else if (config.type === 'student_absence') {
          // Placeholder Logic: Map studentReports if they had absence field
          items = (data.studentReports || []).map((s:any) => ({name: s.name, count: (s as any).absenceDays || 0}));
       } else if (config.type === 'admin_absence') {
          // Placeholder Logic for Admin
          items = []; // Admin data structure to be defined
       }

       // Filter items based on criteria and threshold
       let filteredItems = items;
       if (threshold > 0) filteredItems = filteredItems.filter(i => i.count >= threshold);
       
       if (config.criteria.includes('most_absent')) {
           filteredItems.sort((a,b) => b.count - a.count).slice(0, 5).forEach(i => allLines.push(`📉 ${i.name} (${i.count})`));
       }
       if (config.criteria.includes('absent_2w')) {
           filteredItems.filter(i => i.count >= 14).forEach(i => allLines.push(`🗓️ ${i.name} (${i.count})`));
       }
       if (config.criteria.includes('absent_1w')) {
           filteredItems.filter(i => i.count >= 7).forEach(i => allLines.push(`dt ${i.name} (${i.count})`));
       }
       if (config.criteria.includes('disconnected')) {
           filteredItems.filter(i => i.count >= 30).forEach(i => allLines.push(`🚫 ${i.name} (${i.count})`));
       }
       // If only threshold is set without specific criteria, show all matching threshold
       if (config.criteria.length === 0 && threshold > 0) {
           filteredItems.forEach(i => allLines.push(`🔢 ${i.name} (${i.count})`));
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
                 {config.timeRange && config.timeRange !== 'all' && (
                    <span className="opacity-70 px-1 border-r border-${initialStat.color}-300 mx-1">
                        {config.timeRange === 'daily' ? 'يومي' : config.timeRange === 'weekly' ? 'أسبوعي' : 'شهري'}
                    </span>
                 )}
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

      {/* Filter Modal Overlay - Mobile Optimized */}
      {showFilter && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                 
                 {/* Modal Header */}
                 <div className="flex justify-between items-center p-4 border-b bg-slate-50">
                    <span className="text-base font-black text-slate-800 flex items-center gap-2"><Filter size={18}/> تصفية البيانات</span>
                    <button onClick={() => setShowFilter(false)} className="bg-white p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors border shadow-sm"><X size={16}/></button>
                 </div>
                 
                 {/* Modal Body - Scrollable */}
                 <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                     
                     {/* Report Type */}
                     <div>
                        <label className="text-xs font-black text-slate-600 block mb-2">نوع التقرير المطلوب</label>
                        <select 
                          className="w-full text-sm p-3 border rounded-xl bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                          value={tempConfig.type}
                          onChange={(e) => setTempConfig({...tempConfig, type: e.target.value, criteria: []})}
                        >
                            <option value="">-- اختر نوع البيانات --</option>
                            {reportTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                     </div>
                     
                     {/* Criteria Selection */}
                     {tempConfig.type && (
                         <div className="animate-in slide-in-from-top-2">
                            <label className="text-xs font-black text-slate-600 block mb-2">المعايير (اختر ما تريد ظهوره)</label>
                            
                            {/* Absence Custom Input */}
                            {['student_absence', 'teacher_absence', 'admin_absence'].includes(tempConfig.type) && (
                                <div className="mb-3 bg-red-50 p-3 rounded-xl border border-red-100">
                                    <label className="text-[10px] font-bold text-red-700 block mb-1">حدد عدد أيام الغياب (الحد الأدنى)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-2 text-center rounded-lg border border-red-200 outline-none text-sm font-bold"
                                        value={tempConfig.absenceThreshold || 0}
                                        onChange={(e) => setTempConfig({...tempConfig, absenceThreshold: parseInt(e.target.value)})}
                                        placeholder="مثال: 3"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                               {criteriaOptions[tempConfig.type]?.map((c: any) => (
                                   <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${tempConfig.criteria.includes(c.id) ? `bg-${initialStat.color}-50 border-${initialStat.color}-500 shadow-sm` : 'bg-slate-50 hover:bg-white border-slate-100'}`}>
                                       <input 
                                         type="checkbox" 
                                         className={`rounded text-${initialStat.color}-600 focus:ring-0 w-4 h-4`}
                                         checked={tempConfig.criteria.includes(c.id)}
                                         onChange={(e) => {
                                            const newCriteria = e.target.checked 
                                              ? [...tempConfig.criteria, c.id]
                                              : tempConfig.criteria.filter(id => id !== c.id);
                                            setTempConfig({...tempConfig, criteria: newCriteria});
                                         }}
                                       />
                                       <span className="text-xl">{c.icon}</span>
                                       <span className="text-xs font-bold text-slate-700">{c.label}</span>
                                   </label>
                               ))}
                            </div>
                         </div>
                     )}

                     {/* Time Filter */}
                     <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <label className="text-xs font-black text-slate-600 block mb-3">الفترة الزمنية</label>
                        
                        {/* Presets */}
                        <div className="flex gap-2 mb-3">
                            {[
                                {id: 'all', label: 'الكل'}, 
                                {id: 'daily', label: 'يومي'}, 
                                {id: 'weekly', label: 'أسبوعي'}, 
                                {id: 'monthly', label: 'شهري'}
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setTempConfig({...tempConfig, timeRange: opt.id})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${(tempConfig.timeRange || 'all') === opt.id ? `bg-${initialStat.color}-600 text-white border-${initialStat.color}-600` : 'bg-white text-slate-500 border-slate-200'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Range */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">من تاريخ</label>
                                <input 
                                    type="date" 
                                    className="w-full p-2 rounded-lg border border-slate-200 text-xs font-bold bg-white outline-none focus:border-blue-400"
                                    value={tempConfig.startDate || ''}
                                    onChange={(e) => setTempConfig({...tempConfig, startDate: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">إلى تاريخ</label>
                                <input 
                                    type="date" 
                                    className="w-full p-2 rounded-lg border border-slate-200 text-xs font-bold bg-white outline-none focus:border-blue-400"
                                    value={tempConfig.endDate || ''}
                                    onChange={(e) => setTempConfig({...tempConfig, endDate: e.target.value})}
                                />
                            </div>
                        </div>
                     </div>

                     {/* Speed */}
                     <div>
                        <label className="text-xs font-black text-slate-600 block mb-2">سرعة عرض الشرائح</label>
                        <div className="flex gap-2">
                          {[3000, 5000, 10000].map(time => (
                            <button 
                              key={time}
                              onClick={() => setTempConfig({...tempConfig, interval: time})}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${tempConfig.interval === time ? `bg-${initialStat.color}-600 text-white border-${initialStat.color}-600` : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                            >
                               {time/1000} ثواني
                            </button>
                          ))}
                        </div>
                     </div>
                 </div>

                 {/* Footer Actions */}
                 <div className="p-4 border-t bg-slate-50">
                     <button onClick={handleApply} className={`w-full py-3 bg-${initialStat.color}-600 text-white rounded-xl text-sm font-black hover:bg-${initialStat.color}-700 shadow-lg shadow-${initialStat.color}-200 transition-all transform active:scale-95 flex justify-center items-center gap-2`}>
                        <CheckCircle2 size={18} /> تطبيق الفلتر وعرض النتائج
                     </button>
                 </div>
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
      label: lang === 'ar' ? 'إجمالي المخالفات' : 'Violations', 
      value: data.violations.length, 
      color: 'red', 
      icon: <AlertCircle /> 
    },
    { 
      label: lang === 'ar' ? 'التكليفات الطارئة' : 'Emergency Tasks', 
      value: 0, 
      color: 'amber', 
      icon: <TrendingUp /> 
    },
    // New 4 widgets
    {
      label: lang === 'ar' ? 'عدد الطلاب' : 'Total Students',
      value: data.studentReports?.length || 0,
      color: 'cyan',
      icon: <GraduationCap />
    },
    {
      label: lang === 'ar' ? 'الطلاب المتميزين' : 'Excellent Students',
      value: data.studentReports?.filter(s => s.isExcellent).length || 0,
      color: 'yellow',
      icon: <Star />
    },
    {
      label: lang === 'ar' ? 'القائمة السوداء' : 'Blacklist',
      value: data.studentReports?.filter(s => s.isBlacklisted).length || 0,
      color: 'slate',
      icon: <ShieldAlert />
    },
    {
      label: lang === 'ar' ? 'متابعة المعلمين' : 'Teachers Follow-up',
      value: data.teacherFollowUps.length || 0,
      color: 'purple',
      icon: <BookOpen />
    }
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
            {/* New Special Reports Button */}
            <button onClick={() => setShowSpecialModal(true)} className={`flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all gap-3 group relative overflow-hidden`}>
                <div className={`p-3 bg-white rounded-xl shadow-sm text-indigo-500 group-hover:scale-110 transition-transform`}>
                  <FileText className="w-6 h-6"/>
                </div>
                <span className="text-xs font-black text-slate-600 group-hover:text-slate-800">تقارير خاصة</span>
                <div className={`absolute inset-0 bg-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Special Reports Modal */}
      {showSpecialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b bg-slate-50">
                    <span className="text-xl font-black text-slate-800 flex items-center gap-2"><FileText size={24} className="text-indigo-600"/> تقارير خاصة ومتقدمة</span>
                    <button onClick={() => setShowSpecialModal(false)} className="bg-white p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors border shadow-sm"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
                    {/* Administrative Supervisor Section */}
                    <div className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all">
                        <h3 className="text-lg font-black text-blue-700 mb-4 flex items-center gap-2 border-b pb-2"><Briefcase size={20}/> المشرف الإداري</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {["الخطة الفصلية", "الخلاصة الشهرية", "المهام اليومية", "المهام المضافة", "المهام المرحلة", "أهم المشكلات اليومية", "التوصيات العامة", "احتياجات الدور", "سجل متابعة الدفاتر والتصحيح", "الجرد العام للعهد", "ملاحظات عامة"].map((item, i) => (
                                <button key={i} className="p-2 text-xs font-bold text-slate-600 bg-slate-50 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors border border-slate-100 text-right">{item}</button>
                            ))}
                        </div>
                    </div>

                    {/* Teaching Staff Section */}
                    <div className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all">
                        <h3 className="text-lg font-black text-purple-700 mb-4 flex items-center gap-2 border-b pb-2"><Users size={20}/> الكادر التعليمي</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {["سجل الإبداع والتميز", "كشف الاستلام والتسليم", "المخالفات", "التعميمات"].map((item, i) => (
                                <button key={i} className="p-3 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-purple-50 hover:text-purple-700 transition-colors border border-slate-100 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-400"></div> {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Students Section */}
                    <div className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all">
                        <h3 className="text-lg font-black text-green-700 mb-4 flex items-center gap-2 border-b pb-2"><GraduationCap size={20}/> الطلاب/ الطالبات</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {["الغياب اليومي", "التأخر", "خروج طالب أثناء الدراسة", "المخالفات الطلابية", "سجل الإتلاف المدرسي", "سجل الحالات الخاصة", "سجل الحالة الصحية", "سجل زيارة أولياء الأمور والتواصل بهم"].map((item, i) => (
                                <button key={i} className="p-3 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-green-50 hover:text-green-700 transition-colors border border-slate-100 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div> {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Test Reports Section */}
                    <div className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all">
                        <h3 className="text-lg font-black text-orange-700 mb-4 flex items-center gap-2 border-b pb-2"><ScrollText size={20}/> تقارير الاختبار</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {["الاختبار الشهري", "الاختبار الفصلي"].map((item, i) => (
                                <button key={i} className="p-3 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-orange-50 hover:text-orange-700 transition-colors border border-slate-100 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-400"></div> {item}
                                </button>
                            ))}
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