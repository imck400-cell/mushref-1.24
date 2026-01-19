import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useGlobal } from '../context/GlobalState';
import { Plus, Search, Trash2, Filter, ChevronDown, Check, Calendar, Percent, User, Target, Settings2, AlertCircle, X, ChevronRight, Zap, CheckCircle, FilePlus, FolderOpen, Save, ListOrdered, ArrowUpDown, ArrowUp, ArrowDown, SortAsc, Book, School, Type, Sparkles, BarChart3, LayoutList, Upload, Download, Phone, UserCircle, Activity, Star, FileText, FileSpreadsheet, Share2, Edit, ChevronLeft, MessageCircle, Eye, EyeOff, CheckSquare } from 'lucide-react';
import { TeacherFollowUp, DailyReportContainer, StudentReport } from '../types';
import * as XLSX from 'xlsx';

// Adding local types for TeacherFollowUpPage sorting and filtering
type FilterMode = 'all' | 'student' | 'percent' | 'metric' | 'grade' | 'section' | 'specific' | 'blacklist' | 'excellence' | 'date' | 'specific_names';
type SortCriteria = 'manual' | 'name' | 'subject' | 'class';
type SortDirection = 'asc' | 'desc';

// --- Teachers Follow-up Page (DailyReportsPage) ---
export const DailyReportsPage: React.FC = () => {
  const { lang, data, updateData } = useGlobal();
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [showMetricPicker, setShowMetricPicker] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ criteria: SortCriteria, direction: SortDirection }>({ criteria: 'manual', direction: 'asc' });
  const [violationModal, setViolationModal] = useState<{ id: string, notes: string[], score: number } | null>(null);
  const [activeTeacherFilter, setActiveTeacherFilter] = useState<string>('');

  const reports = data.dailyReports || [];
  
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dayName = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date());
    
    const todayReport = reports.find(r => r.dateStr === todayStr);
    
    if (todayReport) {
      if (activeReportId !== todayReport.id) {
        setActiveReportId(todayReport.id);
      }
    } else {
      const lastReport = reports[reports.length - 1];
      const newTeachers = lastReport ? lastReport.teachersData.map(t => ({ 
        ...t, 
        attendance: 0, appearance: 0, preparation: 0, supervision_queue: 0, supervision_rest: 0, supervision_end: 0, 
        correction_books: 0, correction_notebooks: 0, correction_followup: 0, teaching_aids: 0, extra_activities: 0, 
        radio: 0, creativity: 0, zero_period: 0, violations_score: 0, violations_notes: [] 
      })) : [];
      
      const newReport: DailyReportContainer = {
        id: Date.now().toString(),
        dayName: dayName,
        dateStr: todayStr,
        teachersData: newTeachers as any
      };
      
      updateData({ dailyReports: [...reports, newReport] });
      setActiveReportId(newReport.id);
    }
  }, []);

  const currentReport = reports.find(r => r.id === activeReportId);
  const subjectOrder = ["القرآن الكريم", "التربية الإسلامية", "اللغة العربية", "اللغة الإنجليزية", "الرياضيات", "العلوم", "الكيمياء", "الفيزياء", "الأحياء", "الاجتماعيات", "الحاسوب", "المكتبة", "الفنية", "المختص الاجتماعي", "الأنشطة", "غيرها"];
  
  const teachers = useMemo(() => {
    let list = currentReport ? [...currentReport.teachersData] : [];
    if (filterMode === 'student' && activeTeacherFilter) {
      list = list.filter(t => t.teacherName.includes(activeTeacherFilter));
    }
    list.sort((a, b) => {
      let res = 0;
      if (sortConfig.criteria === 'name') res = a.teacherName.localeCompare(b.teacherName);
      else if (sortConfig.criteria === 'subject') {
        const idxA = subjectOrder.indexOf(a.subjectCode);
        const idxB = subjectOrder.indexOf(b.subjectCode);
        if (idxA !== -1 && idxB !== -1) res = idxA - idxB;
        else if (idxA !== -1) res = -1;
        else if (idxB !== -1) res = 1;
        else res = a.subjectCode.localeCompare(b.subjectCode);
      } else if (sortConfig.criteria === 'class') res = a.className.localeCompare(b.className);
      else if (sortConfig.criteria === 'manual') res = (a.order || 0) - (b.order || 0);
      return sortConfig.direction === 'asc' ? res : -res;
    });
    return list;
  }, [currentReport, sortConfig, filterMode, activeTeacherFilter]);

  const metricsConfig = [
    { key: 'attendance', label: 'الحضور', max: data.maxGrades.attendance || 5, icon: '📅' },
    { key: 'appearance', label: 'المظهر', max: data.maxGrades.appearance || 5, icon: '👔' },
    { key: 'preparation', label: 'التحضير', max: data.maxGrades.preparation || 10, icon: '📝' },
    { key: 'supervision_queue', label: 'طابور', max: data.maxGrades.supervision_queue || 5, icon: '🚶' },
    { key: 'supervision_rest', label: 'راحة', max: data.maxGrades.supervision_rest || 5, icon: '🥪' },
    { key: 'supervision_end', label: 'نهاية', max: data.maxGrades.supervision_end || 5, icon: '🚪' },
    { key: 'correction_books', label: 'كتب', max: data.maxGrades.correction_books || 10, icon: '📚' },
    { key: 'correction_notebooks', label: 'دفاتر', max: data.maxGrades.correction_notebooks || 10, icon: '📓' },
    { key: 'correction_followup', label: 'متابعة', max: data.maxGrades.correction_followup || 10, icon: '🔍' },
    { key: 'teaching_aids', label: 'وسائل', max: data.maxGrades.teaching_aids || 10, icon: '🖥️' },
    { key: 'extra_activities', label: 'أنشطة', max: data.maxGrades.extra_activities || 10, icon: '⚽' },
    { key: 'radio', label: 'إذاعة', max: data.maxGrades.radio || 5, icon: '🎙️' },
    { key: 'creativity', label: 'إبداع', max: data.maxGrades.creativity || 5, icon: '💡' },
    { key: 'zero_period', label: 'صفرية', max: data.maxGrades.zero_period || 5, icon: '0️⃣' },
  ];

  const subjects = ["القرآن الكريم", "التربية الإسلامية", "اللغة العربية", "اللغة الإنجليزية", "الرياضيات", "العلوم", "الكيمياء", "الفيزياء", "الأحياء", "الاجتماعيات", "الحاسوب", "المكتبة", "الفنية", "المختص الاجتماعي", "الأنشطة", "غيرها"];
  const grades = ["التمهيدي", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"];
  const violationTypes = ["تأخر عن طابور", "تأخر عن حصة", "خروج من الحصة", "الإفراط في العقاب", "رفض القرارات الإدارية", "عدم تسليم ما كلف به"];

  const displayedMetrics = filterMode === 'metric' && selectedMetrics.length > 0 ? metricsConfig.filter(m => selectedMetrics.includes(m.key)) : metricsConfig;
  const getMetricColor = (key: string) => {
    if (key === 'attendance' || key === 'appearance') return 'bg-[#E2EFDA]';
    if (key === 'preparation') return 'bg-white';
    if (key.startsWith('supervision')) return 'bg-[#FCE4D6]';
    return 'bg-[#DDEBF7]';
  };

  // ... (Keeping all existing Teacher functions identical) ...
  const handleTeacherFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... same code ...
    const file = e.target.files?.[0];
    if (!file || !activeReportId) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const dataXLSX = XLSX.utils.sheet_to_json(ws);
        const importedTeachers: TeacherFollowUp[] = dataXLSX.map((row: any, idx) => ({
            id: Date.now().toString() + idx,
            teacherName: row['اسم المعلم'] || row['Name'] || '',
            subjectCode: row['المادة'] || row['Subject'] || '',
            className: row['الصف'] || row['Class'] || '',
            attendance: 0, appearance: 0, preparation: 0, supervision_queue: 0, supervision_rest: 0, supervision_end: 0,
            correction_books: 0, correction_notebooks: 0, correction_followup: 0, teaching_aids: 0, extra_activities: 0,
            radio: 0, creativity: 0, zero_period: 0, violations_score: 0, violations_notes: [], 
            order: idx + 1
        }));
        const updatedReports = reports.map(r => r.id === activeReportId ? { ...r, teachersData: [...r.teachersData, ...importedTeachers] } : r);
        updateData({ dailyReports: updatedReports });
        alert(lang === 'ar' ? 'تم استيراد بيانات المعلمين بنجاح' : 'Teachers imported successfully');
    };
    reader.readAsBinaryString(file);
  };

  const handleCreateReport = () => {
    const lastReport = reports[reports.length - 1];
    const newTeachers = lastReport ? lastReport.teachersData.map(t => ({ 
      ...t, 
      attendance: 0, appearance: 0, preparation: 0, supervision_queue: 0, supervision_rest: 0, supervision_end: 0, 
      correction_books: 0, correction_notebooks: 0, correction_followup: 0, teaching_aids: 0, extra_activities: 0, 
      radio: 0, creativity: 0, zero_period: 0, violations_score: 0, violations_notes: [] 
    })) : [];
    
    const newReport: DailyReportContainer = {
      id: Date.now().toString(),
      dayName: new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date()),
      dateStr: new Date().toISOString().split('T')[0],
      teachersData: newTeachers as any
    };
    updateData({ dailyReports: [...reports, newReport] });
    setActiveReportId(newReport.id);
  };

  const addNewTeacher = () => {
    if (!activeReportId) return;
    const newTeacher: TeacherFollowUp = {
        id: Date.now().toString(), teacherName: '', subjectCode: '', className: '',
        attendance: 0, appearance: 0, preparation: 0, supervision_queue: 0, supervision_rest: 0, supervision_end: 0,
        correction_books: 0, correction_notebooks: 0, correction_followup: 0, teaching_aids: 0, extra_activities: 0,
        radio: 0, creativity: 0, zero_period: 0, violations_score: 0, violations_notes: [], order: teachers.length + 1
    };
    const updatedReports = reports.map(r => r.id === activeReportId ? { ...r, teachersData: [...r.teachersData, newTeacher] } : r);
    updateData({ dailyReports: updatedReports });
  };

  const updateTeacher = (teacherId: string, field: string, value: any) => {
    if (!activeReportId) return;
    const updatedReports = reports.map(r => {
      if (r.id === activeReportId) {
        return { ...r, teachersData: r.teachersData.map(t => t.id === teacherId ? { ...t, [field]: value } : t) };
      }
      return r;
    });
    updateData({ dailyReports: updatedReports });
  };

  const fillAllMax = () => {
    if (!activeReportId) return;
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من تعبئة جميع الدرجات بالحد الأقصى؟' : 'Fill all max?')) return;
    const updatedReports = reports.map(r => {
      if (r.id === activeReportId) {
        return {
          ...r,
          teachersData: r.teachersData.map(t => {
            const filled: any = { ...t };
            metricsConfig.forEach(m => filled[m.key] = m.max);
            return filled;
          })
        };
      }
      return r;
    });
    updateData({ dailyReports: updatedReports });
  };

  const fillMetricColumn = (metricKey: string, val?: number) => {
    if (!activeReportId) return;
    const max = metricsConfig.find(m => m.key === metricKey)?.max || 0;
    const valueToFill = val !== undefined ? val : max;
    const updatedReports = reports.map(r => {
        if (r.id === activeReportId) {
            return { ...r, teachersData: r.teachersData.map(t => ({ ...t, [metricKey]: valueToFill })) };
        }
        return r;
    });
    updateData({ dailyReports: updatedReports });
  };

  const updateMaxGrade = (metricKey: string, newVal: number) => {
    const updatedMax = { ...data.maxGrades, [metricKey]: newVal };
    updateData({ maxGrades: updatedMax });
  };

  const calculateTotal = (t: TeacherFollowUp) => {
    let sum = metricsConfig.reduce((acc, m) => acc + (Number((t as any)[m.key]) || 0), 0);
    return Math.max(0, sum - (t.violations_score || 0));
  };
  const totalMaxScore = metricsConfig.reduce((acc, m) => acc + m.max, 0);
  const handleKeyDown = (e: React.KeyboardEvent, teacherIdx: number, metricKey: string) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const nextTeacher = teachers[teacherIdx + 1];
        if (nextTeacher) {
            const nextInput = document.getElementById(`input-${nextTeacher.id}-${metricKey}`);
            if (nextInput) nextInput.focus();
        }
    }
  };
  const getColSum = (key: string) => teachers.reduce((acc, t) => acc + (Number((t as any)[key]) || 0), 0);
  const getColPercent = (key: string, max: number) => {
    const sum = getColSum(key);
    return teachers.length && max > 0 ? ((sum / (teachers.length * max)) * 100).toFixed(1) : '0';
  };

  const generateTeacherReportText = () => {
    let text = `*📋 تقرير متابعة المعلمين اليومي*\n`;
    text += `*📅 التاريخ:* ${currentReport?.dayName || ''} ${currentReport?.dateStr || ''}\n`;
    text += `----------------------------------\n`;
    teachers.forEach((t, i) => {
      const total = calculateTotal(t);
      const percent = totalMaxScore > 0 ? ((total / totalMaxScore) * 100).toFixed(1) : '0';
      text += `\n*${i + 1}. 👤 المعلم:* ${t.teacherName}\n`;
      text += `   📚 *المادة:* ${t.subjectCode} | 🏫 *الصف:* ${t.className}\n`;
      text += `   *📊 التقييم التفصيلي:*\n`;
      metricsConfig.forEach(m => {
         const val = (t as any)[m.key] || 0;
         let icon = '✅';
         let status = 'ممتاز';
         if (val === 0) { icon = '🔴'; status = 'مشكلة'; }
         else if (val < m.max) { icon = '⚠️'; status = 'يحتاج تحسين'; }
         else if (val === m.max) { icon = '🌟'; status = 'مكتمل'; }
         text += `   ${icon} ${m.icon || '🔹'} *${m.label}:* ${val}/${m.max}\n`;
      });
      if (t.violations_score > 0 || t.violations_notes.length > 0) {
          text += `   *⛔ المخالفات:* -${t.violations_score} (${t.violations_notes.join(', ')})\n`;
      }
      let totalIcon = '🥉';
      if (Number(percent) >= 90) totalIcon = '🥇';
      else if (Number(percent) >= 80) totalIcon = '🥈';
      text += `   *📝 المجموع النهائي:* ${total} / ${totalMaxScore} ${totalIcon}\n`;
      text += `   *📈 النسبة:* ${percent}%\n`;
      text += `----------------------------------\n`;
    });
    text += `\n*إعداد: رفيق المشرف الإداري*`;
    return text;
  };
  const exportTeachersTxt = () => {
    const text = generateTeacherReportText().replace(/\*/g, '');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Teachers_Report_${new Date().getTime()}.txt`;
    link.click();
  };
  const exportTeachersExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(teachers.map(t => {
      const row: any = { 'اسم المعلم': t.teacherName, 'المادة': t.subjectCode, 'الصف': t.className };
      metricsConfig.forEach(m => { row[m.label] = (t as any)[m.key]; });
      row['خصم المخالفات'] = t.violations_score;
      row['ملاحظات المخالفات'] = t.violations_notes.join(', ');
      row['المجموع'] = calculateTotal(t);
      row['النسبة'] = `${totalMaxScore > 0 ? ((calculateTotal(t) / totalMaxScore) * 100).toFixed(1) : 0}%`;
      return row;
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");
    XLSX.writeFile(workbook, `Teachers_Report_${Date.now()}.xlsx`);
  };
  const sendTeachersWhatsApp = () => {
    const text = generateTeacherReportText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 font-arabic">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleCreateReport} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all text-xs sm:text-sm"><FilePlus size={16}/> إضافة جدول جديد</button>
          <button onClick={() => setShowArchive(true)} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-all text-xs sm:text-sm"><FolderOpen size={16}/> فتح تقرير</button>
          <button onClick={addNewTeacher} className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-xl font-bold border border-purple-200 hover:bg-purple-100 transition-all text-xs sm:text-sm"><UserCircle size={16}/> إضافة معلم</button>
          
          <label className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold border border-green-200 hover:bg-green-100 transition-all text-xs sm:text-sm cursor-pointer">
             <Upload size={16}/> استيراد ملف
             <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleTeacherFileUpload} />
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button onClick={exportTeachersTxt} className="p-2.5 hover:bg-white text-slate-600 rounded-lg transition-all" title="TXT">
              <FileText className="w-4 h-4" />
            </button>
            <button onClick={exportTeachersExcel} className="p-2.5 hover:bg-white text-green-600 rounded-lg transition-all" title="Excel">
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button onClick={sendTeachersWhatsApp} className="p-2.5 hover:bg-white text-green-500 rounded-lg transition-all" title="WhatsApp">
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <button onClick={() => setFilterMode(prev => prev === 'all' ? 'metric' : 'all')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border transition-all text-xs sm:text-sm ${filterMode === 'metric' ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                <Filter size={16}/> {filterMode === 'metric' ? 'عرض مخصص' : 'عرض الجميع'}
            </button>
            {filterMode === 'metric' && (
                <button onClick={() => setShowMetricPicker(true)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-[10px]"><Settings2 size={10}/></button>
            )}
          </div>
          
          <button onClick={() => setShowSortModal(true)} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 hover:bg-white"><ListOrdered size={18}/></button>
          {currentReport && (
             <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-xl border border-blue-100">
                <Calendar size={16}/>
                <span className="text-xs font-black">{currentReport.dayName} {currentReport.dateStr}</span>
                <button className="hover:bg-blue-200 rounded p-0.5"><Edit size={12}/></button>
             </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className={`w-full text-center border-collapse ${filterMode === 'metric' ? '' : 'min-w-[1400px]'}`}>
            <thead>
              <tr className="border-b border-slate-300">
                <th rowSpan={2} className="p-2 border-e border-slate-300 w-10 sticky right-0 bg-[#FFD966] z-20">م</th>
                <th rowSpan={2} className={`p-2 border-e border-slate-300 sticky right-10 bg-[#FFD966] z-20 ${filterMode === 'metric' ? 'w-40' : 'w-48'}`}>اسم المعلم</th>
                {!filterMode.includes('metric') && (
                    <>
                        <th rowSpan={2} className="p-2 border-e border-slate-300 w-28 bg-[#FFD966]">المادة</th>
                        <th rowSpan={2} className="p-2 border-e border-slate-300 w-24 bg-[#FFD966]">الصف</th>
                    </>
                )}
                <th colSpan={displayedMetrics.length} className="p-2 border-b border-slate-300 font-black text-sm bg-[#FFD966]">
                    <div className="flex items-center gap-2">
                        <span>مجالات تقييم المعلمين</span>
                        <button onClick={fillAllMax} title="تعبئة الجميع بالحد الأقصى" className="bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-1 text-[10px] flex items-center gap-1">
                           <Sparkles size={10} /> مطابقة التعبئة للجميع
                        </button>
                    </div>
                </th>
                <th rowSpan={2} className="p-2 border-e border-slate-300 w-24 bg-[#C6E0B4]">المخالفات</th>
                <th rowSpan={2} className="p-2 border-e border-slate-300 w-20 bg-[#C6E0B4]">المجموع</th>
                <th rowSpan={2} className="p-2 w-20 bg-[#FFD966]">النسبة</th>
              </tr>
              <tr className="text-[10px]">
                {displayedMetrics.map(m => (
                  <th key={m.key} className={`p-1 border-e border-slate-300 min-w-[70px] align-bottom ${getMetricColor(m.key)}`}>
                    <div className="flex flex-col items-center justify-end gap-1 pb-1 h-full w-full">
                        <div className="vertical-text font-bold text-slate-800 h-20 mb-auto text-[11px]">{m.label}</div>
                        <div className="w-full px-1">
                            <input 
                              type="number"
                              className="w-full bg-white border border-slate-300 rounded text-center text-[10px] font-bold py-0.5 shadow-sm outline-none focus:border-blue-500"
                              value={m.max}
                              onChange={(e) => updateMaxGrade(m.key, parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="w-full px-1">
                            <button 
                                onClick={() => {
                                    const input = document.getElementById(`header-input-${m.key}`) as HTMLInputElement;
                                    const val = input?.value ? parseInt(input.value) : m.max;
                                    fillMetricColumn(m.key, val);
                                }}
                                className="w-full bg-blue-50 text-blue-600 border border-blue-200 rounded flex items-center justify-center gap-1 text-[9px] font-bold py-0.5 hover:bg-blue-100 transition-colors"
                            >
                                <Zap size={8} className="fill-current" /> الكل
                            </button>
                        </div>
                        <div className="flex items-center gap-1 w-full px-1">
                            <button 
                                onClick={() => fillMetricColumn(m.key, m.max)}
                                className="bg-green-50 text-green-600 border border-green-200 rounded p-0.5 hover:bg-green-100 flex-shrink-0"
                                title="تعبئة الدرجة الكاملة"
                            >
                                <CheckCircle size={10} />
                            </button>
                            <input 
                                id={`header-input-${m.key}`}
                                className="w-full text-[9px] text-center border border-slate-300 rounded py-0.5 outline-none bg-white focus:ring-1 focus:ring-blue-200" 
                                placeholder="درجة"
                                type="number"
                                max={m.max}
                            />
                        </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                  <tr><td colSpan={20} className="p-8 text-slate-400">لا توجد بيانات.. أضف معلمين أو أنشئ جدولاً جديداً</td></tr>
              ) : teachers.map((t, idx) => {
                const total = calculateTotal(t);
                const percent = totalMaxScore > 0 ? ((total / totalMaxScore) * 100).toFixed(1) : '0';
                return (
                  <tr key={t.id} className="border-b hover:bg-slate-50 transition-colors h-10">
                    <td className="p-1 border-e sticky right-0 bg-white group-hover:bg-slate-50 font-bold text-xs">{idx + 1}</td>
                    <td className="p-1 border-e sticky right-10 bg-white group-hover:bg-slate-50">
                        <input className="w-full text-right font-bold outline-none bg-transparent text-xs" value={t.teacherName} onChange={e => updateTeacher(t.id, 'teacherName', e.target.value)} placeholder="اسم المعلم.." />
                    </td>
                    {!filterMode.includes('metric') && (
                        <>
                            <td className="p-1 border-e">
                            <select className="w-full bg-transparent outline-none text-[10px] text-center" value={t.subjectCode} onChange={e => updateTeacher(t.id, 'subjectCode', e.target.value)}>
                                <option value="">اختر..</option>
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            </td>
                            <td className="p-1 border-e">
                            <select className="w-full bg-transparent outline-none text-[10px] text-center" value={t.className} onChange={e => updateTeacher(t.id, 'className', e.target.value)}>
                                <option value="">اختر..</option>
                                {grades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            </td>
                        </>
                    )}
                    {displayedMetrics.map(m => (
                      <td key={m.key} className="p-1 border-e">
                        <input 
                            id={`input-${t.id}-${m.key}`}
                            type="number" 
                            className="w-full text-center outline-none bg-transparent font-bold text-xs focus:bg-blue-50 focus:ring-1 focus:ring-blue-200 rounded" 
                            value={(t as any)[m.key]} 
                            onChange={e => {
                                const val = Math.min(m.max, Math.max(0, parseInt(e.target.value) || 0));
                                updateTeacher(t.id, m.key, val);
                            }} 
                            onKeyDown={(e) => handleKeyDown(e, idx, m.key)}
                            onFocus={(e) => e.target.select()}
                        />
                      </td>
                    ))}
                    <td 
                        className="p-1 border-e cursor-pointer hover:bg-red-50 transition-colors relative group"
                        onClick={() => setViolationModal({ id: t.id, notes: t.violations_notes, score: t.violations_score })}
                    >
                      <div className="flex items-center justify-center gap-1 font-bold text-red-600 h-full">
                          {t.violations_score > 0 ? `-${t.violations_score}` : '0'}
                          {t.violations_notes.length > 0 && <div className="w-2 h-2 rounded-full bg-red-600 absolute top-1 right-1"></div>}
                      </div>
                    </td>
                    <td className="p-1 border-e font-black text-blue-600 text-xs">{total}</td>
                    <td className="p-1 font-black text-slate-800 text-xs">{percent}%</td>
                  </tr>
                );
              })}
            </tbody>
            {teachers.length > 0 && (
                <tfoot className="bg-slate-50 text-slate-800 font-bold text-xs sticky bottom-0 z-20 shadow-lg border-t-2 border-slate-200">
                    <tr>
                        <td colSpan={filterMode === 'metric' ? 2 : 4} className="p-2 text-left px-4 border-e">المجموع الكلي</td>
                        {displayedMetrics.map(m => (
                            <td key={m.key} className="p-2 border-e text-blue-600">
                                <div className="flex flex-col">
                                    <span>{getColSum(m.key)}</span>
                                </div>
                            </td>
                        ))}
                        <td className="p-2 border-e"></td>
                        <td className="p-2 border-e text-blue-700">{teachers.reduce((acc, t) => acc + calculateTotal(t), 0)}</td>
                        <td className="p-2 border-e">
                            {((teachers.reduce((acc, t) => acc + calculateTotal(t), 0) / (teachers.length * totalMaxScore)) * 100).toFixed(1)}%
                        </td>
                    </tr>
                </tfoot>
            )}
          </table>
        </div>
      </div>

      {showArchive && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-4 text-right">أرشيف التقارير</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {reports.map(r => (
                <button key={r.id} onClick={() => { setActiveReportId(r.id); setShowArchive(false); }} className={`w-full flex justify-between p-4 rounded-xl font-bold border transition-all ${activeReportId === r.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'}`}>
                  <span>{r.dateStr}</span>
                  <span>{r.dayName}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowArchive(false)} className="w-full mt-4 p-3 bg-slate-100 rounded-xl font-bold hover:bg-slate-200">إغلاق</button>
          </div>
        </div>
      )}

      {showSortModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200 space-y-4">
                <h3 className="text-xl font-black text-center">ترتيب المعلمين</h3>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setSortConfig({...sortConfig, criteria: 'name'})} className={`p-3 rounded-xl border font-bold ${sortConfig.criteria === 'name' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-slate-50'}`}>أبجدياً</button>
                    <button onClick={() => setSortConfig({...sortConfig, criteria: 'subject'})} className={`p-3 rounded-xl border font-bold ${sortConfig.criteria === 'subject' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-slate-50'}`}>حسب المادة</button>
                    <button onClick={() => setSortConfig({...sortConfig, criteria: 'class'})} className={`p-3 rounded-xl border font-bold ${sortConfig.criteria === 'class' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-slate-50'}`}>حسب الصف</button>
                    <button onClick={() => setSortConfig({...sortConfig, criteria: 'manual'})} className={`p-3 rounded-xl border font-bold ${sortConfig.criteria === 'manual' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-slate-50'}`}>يدوي</button>
                </div>
                {sortConfig.criteria === 'manual' && (
                    <div className="max-h-40 overflow-y-auto border p-2 rounded-xl bg-slate-50">
                        {teachers.map(t => (
                            <div key={t.id} className="flex items-center gap-2 mb-1">
                                <input type="number" className="w-12 p-1 text-center rounded border" value={t.order || 0} onChange={(e) => updateTeacher(t.id, 'order', parseInt(e.target.value))} />
                                <span className="text-xs font-bold">{t.teacherName}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex gap-2 justify-center pt-2">
                    <button onClick={() => setSortConfig({...sortConfig, direction: 'asc'})} className={`p-2 rounded-lg border ${sortConfig.direction === 'asc' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}><ArrowUp/></button>
                    <button onClick={() => setSortConfig({...sortConfig, direction: 'desc'})} className={`p-2 rounded-lg border ${sortConfig.direction === 'desc' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}><ArrowDown/></button>
                </div>
                <button onClick={() => setShowSortModal(false)} className="w-full p-3 bg-slate-800 text-white rounded-xl font-black">تم</button>
            </div>
        </div>
      )}

      {showMetricPicker && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
                  <h3 className="font-bold text-center mb-4">اختر المعايير للعرض</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                      {metricsConfig.map(m => (
                          <button 
                            key={m.key} 
                            onClick={() => setSelectedMetrics(prev => prev.includes(m.key) ? prev.filter(k => k !== m.key) : [...prev, m.key])}
                            className={`p-2 rounded-lg text-xs font-bold border ${selectedMetrics.includes(m.key) ? 'bg-blue-500 text-white border-blue-600' : 'bg-slate-50 border-slate-200'}`}
                          >
                              {m.label}
                          </button>
                      ))}
                  </div>
                  <button onClick={() => setShowMetricPicker(false)} className="w-full p-2 bg-slate-800 text-white rounded-xl font-bold">موافق</button>
              </div>
          </div>
      )}

      {violationModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                <h3 className="text-lg font-black text-red-600 mb-4 text-center">تفاصيل المخالفات</h3>
                <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 mb-1">خصم الدرجات</label>
                    <input 
                        type="number" 
                        className="w-full p-3 border rounded-xl bg-slate-50 text-center font-bold"
                        value={violationModal.score}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setViolationModal({...violationModal, score: val});
                            updateTeacher(violationModal.id, 'violations_score', val);
                        }}
                    />
                </div>
                <div className="space-y-2 mb-4">
                    {violationTypes.map(v => (
                        <button 
                            key={v}
                            onClick={() => {
                                const exists = violationModal.notes.includes(v);
                                const newNotes = exists ? violationModal.notes.filter(n => n !== v) : [...violationModal.notes, v];
                                setViolationModal({ ...violationModal, notes: newNotes });
                                updateTeacher(violationModal.id, 'violations_notes', newNotes);
                            }}
                            className={`w-full p-3 rounded-xl text-right font-bold border transition-all flex justify-between ${violationModal.notes.includes(v) ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-50 border-slate-100'}`}
                        >
                            {v}
                            {violationModal.notes.includes(v) && <Check size={16}/>}
                        </button>
                    ))}
                </div>
                <textarea 
                    className="w-full p-3 border rounded-xl bg-slate-50 text-right text-sm font-bold min-h-[80px]" 
                    placeholder="ملاحظات إضافية..."
                    value={violationModal.notes.filter(n => !violationTypes.includes(n)).join(', ')}
                    onChange={(e) => {}}
                ></textarea>
                <button onClick={() => setViolationModal(null)} className="w-full mt-2 p-3 bg-slate-800 text-white rounded-xl font-bold">حفظ وإغلاق</button>
            </div>
        </div>
      )}
    </div>
  );
};

export const ViolationsPage: React.FC = () => {
    // ... Keeping ViolationsPage identical
    const { lang, data, updateData } = useGlobal();
    const [textModal, setTextModal] = useState<{ id: string, field: 'reason' | 'action', value: string } | null>(null);
    const violations = data.violations || [];
  
    const handleAdd = () => {
      const newV = { id: Date.now().toString(), studentName: '', type: 'تعهد', reason: '', action: '', date: new Date().toISOString().split('T')[0] };
      updateData({ violations: [...violations, newV] });
    };
  
    const updateV = (id: string, field: string, value: any) => {
      const updated = violations.map(v => v.id === id ? { ...v, [field]: value } : v);
      updateData({ violations: updated });
    };
  
    const generateReportText = () => {
      let text = `*⚠️ سجل التعهدات والمخالفات*\n`;
      text += `*التاريخ:* ${new Date().toLocaleDateString('ar-EG')}\n------------------\n`;
      violations.forEach((v, i) => {
        text += `*${i+1}. الطالب:* ${v.studentName}\n🔴 النوع: ${v.type}\n📝 السبب: ${v.reason}\n🛡️ الإجراء: ${v.action || '---'}\n📅 التاريخ: ${v.date}\n------------------\n`;
      });
      return text;
    };
  
    const sendWhatsApp = () => {
      window.open(`https://wa.me/?text=${encodeURIComponent(generateReportText())}`, '_blank');
    };
  
    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(violations.map(v => ({
            'اسم الطالب': v.studentName, 'النوع': v.type, 'السبب': v.reason, 'الإجراء': v.action, 'التاريخ': v.date
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Violations");
        XLSX.writeFile(workbook, `Violations_Log_${Date.now()}.xlsx`);
    };
  
    return (
      <div className="space-y-4 font-arabic">
        <div className="bg-white p-4 rounded-2xl shadow-sm border flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-xl font-black text-slate-800">{lang === 'ar' ? 'سجل التعهدات والمخالفات' : 'Violations Log'}</h2>
          <div className="flex gap-2">
              <button onClick={exportToExcel} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"><FileSpreadsheet size={20}/></button>
              <button onClick={sendWhatsApp} className="p-2.5 bg-green-50 text-green-600 rounded-xl border border-green-200 hover:bg-green-100 transition-colors"><Share2 size={20}/></button>
              <button onClick={handleAdd} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"><AlertCircle size={18}/> {lang === 'ar' ? 'إضافة مخالفة' : 'Add Violation'}</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col max-h-[70vh]">
          <div className="overflow-auto">
              <table className="w-full text-center border-collapse min-w-[800px]">
                <thead className="bg-red-50 border-b sticky top-0 z-10 shadow-sm">
                  <tr className="h-12 text-slate-700">
                    <th className="p-3 border-e font-black w-48">اسم الطالب</th>
                    <th className="border-e font-black w-32">النوع</th>
                    <th className="border-e font-black w-64">السبب</th>
                    <th className="border-e font-black w-64">الإجراء</th>
                    <th className="border-e font-black w-32">التاريخ</th>
                    <th className="font-black w-16">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-slate-400 italic">لا توجد مخالفات مسجلة</td></tr>
                  ) : violations.map(v => (
                    <tr key={v.id} className="border-b hover:bg-red-50/10 transition-colors h-12">
                      <td className="p-2 border-e"><input className="w-full text-center outline-none bg-transparent font-bold text-slate-800" value={v.studentName} onChange={e => updateV(v.id, 'studentName', e.target.value)} placeholder="اسم الطالب.." /></td>
                      <td className="p-2 border-e">
                        <select className="w-full text-center outline-none bg-transparent font-bold text-slate-600 cursor-pointer" value={v.type} onChange={e => updateV(v.id, 'type', e.target.value)}>
                          <option value="تعهد">تعهد</option>
                          <option value="إنذار">إنذار</option>
                          <option value="فصل">فصل مؤقت</option>
                          <option value="استدعاء ولي أمر">استدعاء ولي أمر</option>
                        </select>
                      </td>
                      <td 
                        className="p-2 border-e cursor-pointer hover:bg-slate-50 relative group"
                        onClick={() => setTextModal({ id: v.id, field: 'reason', value: v.reason || '' })}
                      >
                        <div className="text-xs font-bold text-slate-600 truncate max-w-[200px] mx-auto">
                          {v.reason || <span className="text-slate-300">أضف سبب...</span>}
                        </div>
                      </td>
                      <td 
                        className="p-2 border-e cursor-pointer hover:bg-slate-50 relative group"
                        onClick={() => setTextModal({ id: v.id, field: 'action', value: v.action || '' })}
                      >
                        <div className="text-xs font-bold text-slate-600 truncate max-w-[200px] mx-auto">
                          {v.action || <span className="text-slate-300">أضف إجراء...</span>}
                        </div>
                      </td>
                      <td className="p-2 border-e"><input type="date" className="w-full text-center outline-none bg-transparent text-sm font-bold text-slate-500" value={v.date} onChange={e => updateV(v.id, 'date', e.target.value)} /></td>
                      <td className="p-2"><button onClick={() => updateData({ violations: violations.filter(x => x.id !== v.id) })} className="text-red-300 hover:text-red-600 bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        </div>
        {textModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
                  <h3 className="text-lg font-black text-slate-800 mb-4 text-center">
                      {textModal.field === 'reason' ? 'سبب المخالفة' : 'الإجراء المتخذ'}
                  </h3>
                  <textarea 
                      className="w-full p-4 border rounded-xl bg-slate-50 text-right font-bold min-h-[120px] outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="اكتب هنا..."
                      value={textModal.value}
                      onChange={(e) => setTextModal({ ...textModal, value: e.target.value })}
                  ></textarea>
                  <div className="flex gap-2 mt-4">
                      <button 
                          onClick={() => {
                              updateV(textModal.id, textModal.field, textModal.value);
                              setTextModal(null);
                          }} 
                          className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700"
                      >
                          حفظ
                      </button>
                      <button 
                          onClick={() => setTextModal(null)} 
                          className="flex-1 bg-slate-100 text-slate-600 p-3 rounded-xl font-bold hover:bg-slate-200"
                      >
                          إلغاء
                      </button>
                  </div>
              </div>
          </div>
        )}
      </div>
    );
};

export const StudentsReportsPage: React.FC = () => {
  const { data, updateData, lang } = useGlobal();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedStudentNames, setSelectedStudentNames] = useState<string[]>([]);
  const [studentInput, setStudentInput] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSpecificFilterModal, setShowSpecificFilterModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  // New States for Blacklist and Excellence lists
  const [showListModal, setShowListModal] = useState<'blacklist' | 'excellence' | null>(null);
  const [listSearch, setListSearch] = useState('');
  const [tempListSelected, setTempListSelected] = useState<string[]>([]);
  const [mainNotesModal, setMainNotesModal] = useState<{ id: string, currentNotes: string[] } | null>(null);
  const [importConfirmation, setImportConfirmation] = useState<{ data: any[] } | null>(null);

  const studentData = data.studentReports || [];

  // Auto-populate logic: If selecting a date with no data, copy from last available date
  useEffect(() => {
    const targetDate = selectedDate || new Date().toISOString().split('T')[0];
    const hasData = studentData.some(s => s.createdAt.startsWith(targetDate));
    
    if (!hasData && studentData.length > 0) {
        const sorted = [...studentData].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latestDate = sorted[0].createdAt.split('T')[0];
        
        if (latestDate !== targetDate) {
             const studentsToCopy = studentData.filter(s => s.createdAt.startsWith(latestDate));
             const newEntries = studentsToCopy.map(s => ({
                 ...s,
                 id: Date.now().toString() + Math.random().toString().slice(2),
                 createdAt: targetDate, 
                 notes: '',
                 mainNotes: [],
             }));
             if (newEntries.length > 0) {
                 updateData({ studentReports: [...studentData, ...newEntries] });
             }
        }
    }
  }, [selectedDate, studentData]);

  const columnsMap = [
    { key: 'grade', label: 'الصف' },
    { key: 'section', label: 'الشعبة' },
    { key: 'gender', label: 'النوع' },
    { key: 'address', label: 'العنوان' },
    { key: 'workOutside', label: 'العمل' },
    { key: 'health', label: 'الصحة' },
    { key: 'guardian', label: 'ولي الأمر' },
    { key: 'academic', label: 'المستوى العلمي' },
    { key: 'behavior', label: 'السلوك' },
    { key: 'notes', label: 'الملاحظات' },
    { key: 'followup', label: 'متابعة الولي' },
  ];

  const options = {
    gender: ["ذكر", "أنثى"],
    workOutside: ["لا يعمل", "يعمل"],
    health: ["ممتاز", "مريض"],
    level: ["ممتاز", "متوسط", "جيد", "ضعيف", "ضعيف جداً"],
    behavior: ["ممتاز", "متوسط", "جيد", "جيد جدا", "مقبول", "ضعيف", "ضعيف جدا"],
    mainNotes: ["ممتاز", "تأخر عن الطابور", "تأخر عن الحصة الأولى", "تأخر عن حصة", "كثير الكلام", "كثير الشغب", "عدواني", "تطاول على معلم", "اعتداء على طالب جسدياً", "اعتداء على طالب لفظيا", "أخذ أدوات الغير دون أذنهم", "إتلاف ممتلكات المدرسة"],
    eduStatus: ["متعلم", "ضعيف", "أمي"],
    followUp: ["ممتازة", "متوسطة", "ضعيفة"],
    cooperation: ["ممتازة", "متوسطة", "ضعيفة", "متذمر", "كثير النقد", "عدواني"],
    grades: ["التمهيدي", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"],
    sections: ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"]
  };

  const updateStudent = (id: string, field: string, value: any) => {
    const updated = studentData.map(s => s.id === id ? { ...s, [field]: value } : s);
    updateData({ studentReports: updated });
  };

  const addStudent = () => {
    const newStudent: StudentReport = {
      id: Date.now().toString(),
      name: '',
      gender: options.gender[0],
      grade: options.grades[0],
      section: options.sections[0],
      address: '',
      workOutside: options.workOutside[0],
      healthStatus: options.health[0],
      healthDetails: '',
      guardianName: '',
      guardianPhones: [''],
      academicReading: options.level[0],
      academicWriting: options.level[0],
      academicParticipation: options.level[0],
      behaviorLevel: options.behavior[0],
      mainNotes: [],
      otherNotesText: '',
      guardianEducation: options.eduStatus[0],
      guardianFollowUp: options.followUp[0],
      guardianCooperation: options.cooperation[0],
      notes: '',
      createdAt: new Date().toISOString()
    };
    updateData({ studentReports: [...studentData, newStudent] });
  };

  const bulkAutoFill = () => {
    if (!confirm(lang === 'ar' ? 'سيتم تعبئة الخيار الأول لجميع الحقول في كافة الطلاب. استمرار؟' : 'Auto-fill first option for all students?')) return;
    const updated = studentData.map(s => ({
      ...s,
      healthStatus: options.health[0],
      guardianFollowUp: options.followUp[0],
      guardianEducation: options.eduStatus[0],
      guardianCooperation: options.cooperation[0],
      academicReading: options.level[0],
      academicWriting: options.level[0],
      academicParticipation: options.level[0],
      behaviorLevel: options.behavior[0],
      workOutside: options.workOutside[0],
    }));
    updateData({ studentReports: updated });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const dataXLSX = XLSX.utils.sheet_to_json(ws);
      const imported = dataXLSX.map((row: any) => ({
        id: Date.now().toString() + Math.random(),
        name: row['اسم الطالب'] || '',
        gender: row['النوع'] || options.gender[0],
        grade: row['الصف'] || options.grades[0],
        section: row['الشعبة'] || options.sections[0],
        address: row['عنوان السكن'] || '',
        workOutside: row['العمل'] || options.workOutside[0],
        healthStatus: row['الحالة الصحية'] || options.health[0],
        guardianName: row['ولي الأمر'] || '',
        guardianPhones: [row['الهاتف'] || ''],
        academicReading: options.level[0], academicWriting: options.level[0], academicParticipation: options.level[0],
        behaviorLevel: options.behavior[0], mainNotes: [], otherNotesText: '', guardianEducation: options.eduStatus[0],
        guardianFollowUp: options.followUp[0], guardianCooperation: options.cooperation[0], notes: '', createdAt: new Date().toISOString()
      }));
      setImportConfirmation({ data: imported as any });
    };
    reader.readAsBinaryString(file);
  };

  const filteredData = useMemo(() => {
    let result = [...studentData];
    if (filterMode === 'date' || selectedDate) {
        const filterDateStr = selectedDate || new Date().toISOString().split('T')[0];
        result = result.filter(s => s.createdAt.startsWith(filterDateStr));
    }
    if (filterMode === 'blacklist' || filterMode === 'excellence') {
      if (selectedStudentNames.length === 0) return [];
      result = result.filter(s => selectedStudentNames.includes(s.name));
    } else if (filterMode === 'student') {
      if (selectedStudentNames.length === 0) return [];
      result = result.filter(s => selectedStudentNames.some(name => s.name.toLowerCase().includes(name.toLowerCase())));
    } else if (filterMode === 'specific_names' || filterMode === 'specific') {
      if (selectedStudentNames.length > 0) {
         result = result.filter(s => selectedStudentNames.some(name => s.name.toLowerCase().includes(name.toLowerCase())));
      }
    }
    return result;
  }, [studentData, filterMode, selectedStudentNames, selectedDate]);

  const addStudentToFilter = (name?: string) => {
    const targetName = name || studentInput.trim();
    if (targetName && !selectedStudentNames.includes(targetName)) {
      setSelectedStudentNames(prev => [...prev, targetName]);
      setStudentInput('');
    }
  };

  const toggleStar = (id: string, type: 'isBlacklisted' | 'isExcellent') => {
    const student = studentData.find(s => s.id === id);
    if (student) {
      updateStudent(id, type, !student[type]);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف الطلاب المحددين؟' : 'Delete selected students?')) {
        const remaining = studentData.filter(s => !selectedStudentIds.includes(s.id));
        updateData({ studentReports: remaining });
        setSelectedStudentIds([]);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedStudentIds(filteredData.map(s => s.id));
    } else {
        setSelectedStudentIds([]);
    }
  };

  const isColVisible = (key: string) => {
    if (filterMode !== 'specific') return true;
    return selectedColumns.includes(key);
  };

  const getStatusIcon = (val: string) => {
      if (typeof val !== 'string') return '';
      if (val.includes('ضعيف') || val.includes('مريض') || val.includes('سيء') || val.includes('متذمر')) return '🔴';
      if (val.includes('ممتاز') || val.includes('جيد جدا')) return '🟢';
      if (val.includes('متوسط') || val.includes('مقبول')) return '⚠️';
      return '🔹';
  };

  const generateReportText = () => {
    let text = `*📋 تقرير شؤون الطلاب التفصيلي*\n`;
    text += `*📅 التاريخ:* ${new Date(selectedDate).toLocaleDateString('ar-EG')}\n`;
    text += `----------------------------------\n\n`;

    filteredData.forEach((s, i) => {
      text += `*👤 الطالب (${i + 1}): ${s.name}*\n`;
      text += `📍 *البيانات الأساسية:*\n`;
      text += `   - الصف: ${s.grade} | الشعبة: ${s.section} | النوع: ${s.gender}\n`;
      text += `   - العنوان: ${s.address || '---'} | العمل: ${getStatusIcon(s.workOutside)} ${s.workOutside}\n`;
      
      text += `🏥 *الصحة:* ${getStatusIcon(s.healthStatus)} ${s.healthStatus} ${s.healthDetails ? `(${s.healthDetails})` : ''}\n`;
      
      text += `👨‍👦 *ولي الأمر:* ${s.guardianName || '---'} | 📞 ${s.guardianPhones.join(', ')}\n`;
      text += `   - التعليم: ${s.guardianEducation} | المتابعة: ${getStatusIcon(s.guardianFollowUp)} ${s.guardianFollowUp} | التعاون: ${getStatusIcon(s.guardianCooperation)} ${s.guardianCooperation}\n`;
      
      text += `📚 *المستوى العلمي:*\n`;
      text += `   - القراءة: ${getStatusIcon(s.academicReading)} ${s.academicReading}\n`;
      text += `   - الكتابة: ${getStatusIcon(s.academicWriting)} ${s.academicWriting}\n`;
      text += `   - المشاركة: ${getStatusIcon(s.academicParticipation)} ${s.academicParticipation}\n`;
      
      text += `🧠 *السلوك:* ${getStatusIcon(s.behaviorLevel)} ${s.behaviorLevel}\n`;
      
      if (s.mainNotes.length > 0 || s.notes) {
          text += `📝 *الملاحظات:* ${s.mainNotes.join('، ')} ${s.notes ? `| ${s.notes}` : ''}\n`;
      }
      
      text += `----------------------------------\n`;
    });
    
    text += `\n*إعداد: رفيق المشرف الإداري*`;
    return text;
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(s => ({
      'اسم الطالب': s.name, 'الصف': s.grade, 'الشعبة': s.section, 'النوع': s.gender, 'العنوان': s.address,
      'العمل': s.workOutside, 'الحالة الصحية': s.healthStatus, 'تفاصيل الصحة': s.healthDetails, 'ولي الأمر': s.guardianName,
      'الهواتف': s.guardianPhones.join(', '), 'القراءة': s.academicReading, 'الكتابة': s.academicWriting, 'المشاركة': s.academicParticipation,
      'السلوك': s.behaviorLevel, 'الملاحظات': s.mainNotes.join(', '), 'تعليم الولي': s.guardianEducation, 'متابعة الولي': s.guardianFollowUp,
      'تعاون الولي': s.guardianCooperation, 'ملاحظات أخرى': s.notes
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, `Students_Report_Full_${Date.now()}.xlsx`);
  };

  const exportToTxt = () => {
    const text = generateReportText().replace(/\*/g, '');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Students_Report_Full_${Date.now()}.txt`;
    link.click();
  };

  const sendWhatsApp = () => {
    const text = generateReportText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleListApply = () => {
    if (tempListSelected.length > 0) {
      setSelectedStudentNames(tempListSelected);
      setFilterMode(showListModal === 'blacklist' ? 'blacklist' : 'excellence');
    }
    setShowListModal(null);
    setTempListSelected([]);
    setListSearch('');
  };

  return (
    <div className="space-y-4 font-arabic animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={addStudent} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-blue-700 shadow-md transform active:scale-95 transition-all">
            <Plus className="w-4 h-4" /> {lang === 'ar' ? 'إضافة طالب' : 'Add Student'}
          </button>
          <label className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-xl font-bold text-sm border border-green-200 cursor-pointer hover:bg-green-100 transition-all">
            <Upload className="w-4 h-4" /> {lang === 'ar' ? 'استيراد ملف' : 'Import File'}
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
          </label>
          <button onClick={bulkAutoFill} className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2.5 rounded-xl font-bold text-sm border border-purple-200 hover:bg-purple-100 transition-all">
            <Sparkles className="w-4 h-4" /> {lang === 'ar' ? 'التعبئة التلقائية' : 'Auto Fill'}
          </button>
          
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button onClick={exportToTxt} className="p-2.5 hover:bg-white text-slate-600 rounded-lg transition-all" title="TXT Export (Full)">
              <FileText className="w-4 h-4" />
            </button>
            <button onClick={exportToExcel} className="p-2.5 hover:bg-white text-green-600 rounded-lg transition-all" title="Excel Export (Full)">
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button onClick={sendWhatsApp} className="p-2.5 hover:bg-white text-green-500 rounded-lg transition-all" title="WhatsApp Report (Full)">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border px-3 py-2 rounded-xl">
             <Calendar size={16} className="text-slate-500"/>
             <input type="date" className="bg-transparent font-bold text-sm outline-none text-slate-700" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
          <button onClick={() => setShowListModal('excellence')} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl font-black text-sm hover:bg-green-700 transition-all shadow-sm"><Star className="w-4 h-4 fill-white" /> {lang === 'ar' ? 'قائمة التميز' : 'Excellence List'}</button>
          <button onClick={() => setShowListModal('blacklist')} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl font-black text-sm hover:bg-slate-900 transition-all shadow-sm"><AlertCircle className="w-4 h-4" /> {lang === 'ar' ? 'القائمة السوداء' : 'Blacklist'}</button>
        </div>
      </div>
      
      {/* Smart Filter Bar (Name & Feature) */}
      <div className="bg-slate-50 p-4 rounded-xl border flex flex-col sm:flex-row gap-4 items-start sm:items-center">
         <div className="flex-1 w-full">
            <div className="flex gap-2">
                <input 
                    className="flex-1 p-2.5 border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" 
                    placeholder="اكتب اسم الطالب هنا لإضافته للفلتر..." 
                    value={studentInput}
                    onChange={(e) => setStudentInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addStudentToFilter()}
                />
                <button onClick={() => addStudentToFilter()} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700"><Plus size={16}/></button>
            </div>
            {selectedStudentNames.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedStudentNames.map(name => (
                        <span key={name} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                            {name} <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setSelectedStudentNames(prev => prev.filter(n => n !== name))} />
                        </span>
                    ))}
                </div>
            )}
         </div>
         <div className="flex gap-2 w-full sm:w-auto">
             <button onClick={() => { setFilterMode('specific_names'); }} className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2.5 rounded-xl font-black text-sm hover:bg-blue-700">موافق (عرض)</button>
             <button onClick={() => { setFilterMode('specific'); setShowSpecificFilterModal(true); }} className="flex-1 sm:flex-none bg-white text-slate-700 border px-4 py-2.5 rounded-xl font-black text-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                 <Filter size={16}/> تصفية حسب صفة معينة
             </button>
         </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden relative">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-center border-collapse min-w-[1200px]">
             <thead className="sticky top-0 z-20 shadow-sm text-xs">
                <tr className="border-b border-slate-300">
                  <th colSpan={4} className="p-3 border-e border-slate-300 bg-[#FFD966] font-black whitespace-nowrap">بيانات الطالب</th>
                  {isColVisible('address') && <th colSpan={6} className="p-3 border-e border-slate-300 bg-slate-50 font-black whitespace-nowrap">البيانات الشخصية</th>}
                  {isColVisible('academic') && <th colSpan={3} className="p-3 border-e border-slate-300 bg-[#FFF2CC] font-black whitespace-nowrap">المستوى العلمي</th>}
                  {isColVisible('behavior') && <th rowSpan={2} className="p-3 border-e border-slate-300 bg-white font-black whitespace-nowrap">السلوك</th>}
                  {isColVisible('notes') && <th colSpan={2} className="p-3 border-e border-slate-300 bg-white font-black whitespace-nowrap">الملاحظات</th>}
                  {isColVisible('followup') && <th colSpan={3} className="p-3 border-e border-slate-300 bg-[#DDEBF7] font-black whitespace-nowrap">متابعة ولي الأمر</th>}
                  <th rowSpan={2} className="p-3 bg-white font-black min-w-[100px] whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        <span>حذف</span>
                        <div className="flex items-center gap-2">
                           <input type="checkbox" className="w-4 h-4 cursor-pointer" onChange={toggleSelectAll} checked={selectedStudentIds.length > 0 && selectedStudentIds.length === filteredData.length} />
                           <button onClick={handleBulkDelete} className={`transition-colors ${selectedStudentIds.length > 0 ? 'text-red-600' : 'text-slate-300'}`} disabled={selectedStudentIds.length === 0}><Trash2 size={16}/></button>
                        </div>
                      </div>
                  </th>
                </tr>
                <tr className="border-b border-slate-300">
                  <th className="p-3 border-e border-slate-300 bg-[#FFD966] min-w-[200px] whitespace-nowrap sticky right-0 z-30">اسم الطالب</th>
                  {isColVisible('grade') && <th className="p-3 border-e border-slate-300 bg-[#FFD966] whitespace-nowrap">الصف</th>}
                  {isColVisible('section') && <th className="p-3 border-e border-slate-300 bg-[#FFD966] whitespace-nowrap">الشعبة</th>}
                  {isColVisible('gender') && <th className="p-3 border-e border-slate-300 bg-[#FFD966] whitespace-nowrap">النوع</th>}
                  {isColVisible('address') && (
                    <>
                        <th className="p-3 border-e border-slate-300 bg-slate-50 whitespace-nowrap">العنوان</th>
                        <th className="p-3 border-e border-slate-300 bg-slate-50 whitespace-nowrap">العمل</th>
                        <th className="p-3 border-e border-slate-300 bg-slate-50 whitespace-nowrap">الصحة</th>
                        <th className="p-3 border-e border-slate-300 bg-slate-50 min-w-[150px] whitespace-nowrap">تفاصيل الصحة</th>
                        <th className="p-3 border-e border-slate-300 bg-slate-50 min-w-[150px] whitespace-nowrap">ولي الأمر</th>
                        <th className="p-3 border-e border-slate-300 bg-slate-50 whitespace-nowrap">الهاتف</th>
                    </>
                  )}
                  {isColVisible('academic') && (
                    <>
                        <th className="p-3 border-e border-slate-300 bg-[#FFF2CC] whitespace-nowrap">القراءة</th>
                        <th className="p-3 border-e border-slate-300 bg-[#FFF2CC] whitespace-nowrap">الكتابة</th>
                        <th className="p-3 border-e border-slate-300 bg-[#FFF2CC] whitespace-nowrap">المشاركة</th>
                    </>
                  )}
                  {isColVisible('notes') && (
                    <>
                        <th className="p-3 border-e border-slate-300 bg-white min-w-[180px] whitespace-nowrap">الأساسية</th>
                        <th className="p-3 border-e border-slate-300 bg-white min-w-[180px] whitespace-nowrap">أخرى</th>
                    </>
                  )}
                  {isColVisible('followup') && (
                    <>
                        <th className="p-3 border-e border-slate-300 bg-[#DDEBF7] whitespace-nowrap">التعليم</th>
                        <th className="p-3 border-e border-slate-300 bg-[#DDEBF7] whitespace-nowrap">المتابعة</th>
                        <th className="p-3 border-e border-slate-300 bg-[#DDEBF7] whitespace-nowrap">التعاون</th>
                    </>
                  )}
                </tr>
             </thead>
             <tbody className="divide-y">
                {filteredData.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                     <td className="p-2 border-e sticky right-0 bg-white z-10 flex items-center gap-1 group-hover:bg-slate-50 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                           <button onClick={() => toggleStar(s.id, 'isExcellent')}><Star size={12} className={s.isExcellent ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}/></button>
                           <button onClick={() => toggleStar(s.id, 'isBlacklisted')}><AlertCircle size={12} className={s.isBlacklisted ? "text-red-600" : "text-slate-300"}/></button>
                        </div>
                        <input className="w-full text-xs font-bold bg-transparent outline-none" value={s.name} onChange={(e) => updateStudent(s.id, 'name', e.target.value)} placeholder="الاسم..." />
                     </td>
                     {isColVisible('grade') && <td className="p-1 border-e whitespace-nowrap"><select className="w-full bg-transparent text-[10px] outline-none" value={s.grade} onChange={(e) => updateStudent(s.id, 'grade', e.target.value)}>{options.grades.map(o => <option key={o} value={o}>{o}</option>)}</select></td>}
                     {isColVisible('section') && <td className="p-1 border-e whitespace-nowrap"><select className="w-full bg-transparent text-[10px] outline-none" value={s.section} onChange={(e) => updateStudent(s.id, 'section', e.target.value)}>{options.sections.map(o => <option key={o} value={o}>{o}</option>)}</select></td>}
                     {isColVisible('gender') && <td className="p-1 border-e whitespace-nowrap"><select className="w-full bg-transparent text-[10px] outline-none" value={s.gender} onChange={(e) => updateStudent(s.id, 'gender', e.target.value)}>{options.gender.map(o => <option key={o} value={o}>{o}</option>)}</select></td>}
                     
                     {isColVisible('address') && (
                        <>
                            <td className="p-1 border-e whitespace-nowrap"><input className="w-full text-[10px] bg-transparent outline-none text-center" value={s.address} onChange={(e) => updateStudent(s.id, 'address', e.target.value)} /></td>
                            <td className="p-1 border-e whitespace-nowrap"><select className="w-full bg-transparent text-[10px] outline-none" value={s.workOutside} onChange={(e) => updateStudent(s.id, 'workOutside', e.target.value)}>{options.workOutside.map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                            <td className={`p-1 border-e font-bold text-[10px] whitespace-nowrap ${s.healthStatus.includes('مريض') ? 'text-red-600' : ''}`}><select className="w-full bg-transparent outline-none" value={s.healthStatus} onChange={(e) => updateStudent(s.id, 'healthStatus', e.target.value)}>{options.health.map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                            <td className="p-1 border-e whitespace-nowrap"><input className="w-full text-[10px] bg-transparent outline-none text-center" value={s.healthDetails} onChange={(e) => updateStudent(s.id, 'healthDetails', e.target.value)} placeholder="-" /></td>
                            <td className="p-1 border-e whitespace-nowrap"><input className="w-full text-[10px] bg-transparent outline-none text-center" value={s.guardianName} onChange={(e) => updateStudent(s.id, 'guardianName', e.target.value)} /></td>
                            <td className="p-1 border-e whitespace-nowrap"><input className="w-full text-[10px] bg-transparent outline-none text-center" value={s.guardianPhones[0] || ''} onChange={(e) => updateStudent(s.id, 'guardianPhones', [e.target.value])} /></td>
                        </>
                     )}
                     {isColVisible('academic') && (
                        <>
                            <td className={`p-1 border-e font-bold text-[10px] whitespace-nowrap ${s.academicReading.includes('ضعيف') ? 'text-red-600' : ''}`}><select className="w-full bg-transparent outline-none" value={s.academicReading} onChange={(e) => updateStudent(s.id, 'academicReading', e.target.value)}>{options.level.map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                            <td className={`p-1 border-e font-bold text-[10px] whitespace-nowrap ${s.academicWriting.includes('ضعيف') ? 'text-red-600' : ''}`}><select className="w-full bg-transparent outline-none" value={s.academicWriting} onChange={(e) => updateStudent(s.id, 'academicWriting', e.target.value)}>{options.level.map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                            <td className={`p-1 border-e font-bold text-[10px] whitespace-nowrap ${s.academicParticipation.includes('ضعيف') ? 'text-red-600' : ''}`}><select className="w-full bg-transparent outline-none" value={s.academicParticipation} onChange={(e) => updateStudent(s.id, 'academicParticipation', e.target.value)}>{options.level.map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                        </>
                     )}
                     {isColVisible('behavior') && <td className={`p-1 border-e font-bold text-[10px] whitespace-nowrap ${s.behaviorLevel.includes('ضعيف') ? 'text-red-600' : ''}`}><select className="w-full bg-transparent outline-none" value={s.behaviorLevel} onChange={(e) => updateStudent(s.id, 'behaviorLevel', e.target.value)}>{options.behavior.map(o => <option key={o} value={o}>{o}</option>)}</select></td>}
                     {isColVisible('notes') && (
                        <>
                            <td className="p-1 border-e whitespace-nowrap">
                                <div className="flex flex-wrap gap-1 justify-center">
                                {s.mainNotes.map(n => <span key={n} className="bg-slate-100 text-[8px] px-1 rounded border">{n}</span>)}
                                <button onClick={() => setMainNotesModal({ id: s.id, currentNotes: s.mainNotes })} className="text-[10px] text-blue-600 font-bold">+</button>
                                </div>
                            </td>
                            <td className="p-1 border-e whitespace-nowrap"><input className="w-full text-[10px] bg-transparent outline-none text-center" value={s.notes} onChange={(e) => updateStudent(s.id, 'notes', e.target.value)} placeholder="..." /></td>
                        </>
                     )}
                     {isColVisible('followup') && (
                        <>
                            <td className="p-1 border-e whitespace-nowrap"><select className="w-full bg-transparent text-[10px] outline-none" value={s.guardianEducation} onChange={(e) => updateStudent(s.id, 'guardianEducation', e.target.value)}>{options.eduStatus.map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                            <td className="p-1 border-e whitespace-nowrap"><select className="w-full bg-transparent text-[10px] outline-none" value={s.guardianFollowUp} onChange={(e) => updateStudent(s.id, 'guardianFollowUp', e.target.value)}>{options.followUp.map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                            <td className="p-1 border-e whitespace-nowrap"><select className="w-full bg-transparent text-[10px] outline-none" value={s.guardianCooperation} onChange={(e) => updateStudent(s.id, 'guardianCooperation', e.target.value)}>{options.cooperation.map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                        </>
                     )}
                     <td className="p-1 border-e bg-white z-10 sticky right-0 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                             <input type="checkbox" className="w-4 h-4" checked={selectedStudentIds.includes(s.id)} onChange={(e) => e.target.checked ? setSelectedStudentIds(prev => [...prev, s.id]) : setSelectedStudentIds(prev => prev.filter(id => id !== s.id))} />
                             <button onClick={() => { if(confirm('حذف؟')) updateData({studentReports: studentData.filter(x => x.id !== s.id)}) }} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                        </div>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
      
      {mainNotesModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <h3 className="font-bold mb-4 text-center text-slate-800">الملاحظات الأساسية</h3>
            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto mb-4">
              {options.mainNotes.map(note => (
                 <button 
                   key={note}
                   onClick={() => {
                      const current = mainNotesModal.currentNotes;
                      const updated = current.includes(note) ? current.filter(n => n !== note) : [...current, note];
                      setMainNotesModal({...mainNotesModal, currentNotes: updated});
                   }}
                   className={`p-2 text-xs border rounded-lg font-bold transition-all ${mainNotesModal.currentNotes.includes(note) ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                 >
                   {note}
                 </button>
              ))}
            </div>
            <div className="flex gap-2">
               <button onClick={() => { updateStudent(mainNotesModal.id, 'mainNotes', mainNotesModal.currentNotes); setMainNotesModal(null); }} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700">موافق</button>
               <button onClick={() => setMainNotesModal(null)} className="flex-1 bg-slate-100 py-2.5 rounded-xl font-bold hover:bg-slate-200">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showSpecificFilterModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                <h3 className="font-black mb-4 text-center text-xl text-slate-800">اختر الأعمدة للعرض</h3>
                <div className="mb-2">
                    <button 
                       onClick={() => setSelectedColumns(columnsMap.map(c => c.key))}
                       className="w-full bg-blue-50 text-blue-600 p-2 rounded-lg font-bold text-sm hover:bg-blue-100 border border-blue-200"
                    >
                        الجميع (إظهار كافة الحقول)
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto mb-4">
                    {columnsMap.map(col => (
                        <button 
                            key={col.key}
                            onClick={() => {
                                if (selectedColumns.includes(col.key)) {
                                    setSelectedColumns(selectedColumns.filter(c => c !== col.key));
                                } else {
                                    setSelectedColumns([...selectedColumns, col.key]);
                                }
                            }}
                            className={`p-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-between ${selectedColumns.includes(col.key) ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                        >
                            {col.label}
                            {selectedColumns.includes(col.key) && <Check size={16}/>}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setShowSpecificFilterModal(false); }} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black hover:bg-blue-700 transition-colors">عرض</button>
                    <button onClick={() => { setShowSpecificFilterModal(false); setFilterMode('all'); }} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black hover:bg-slate-200 transition-colors">إلغاء</button>
                </div>
            </div>
        </div>
      )}

      {showListModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                <h3 className="font-black mb-4 text-center text-xl text-slate-800">{showListModal === 'excellence' ? 'قائمة التميز' : 'القائمة السوداء'}</h3>
                <input type="text" placeholder="بحث عن اسم..." className="w-full p-3 border rounded-xl mb-4 text-sm font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100" value={listSearch} onChange={(e) => setListSearch(e.target.value)} />
                <div className="max-h-[50vh] overflow-y-auto space-y-2 border p-2 rounded-xl bg-slate-50 mb-4">
                   {studentData.filter(s => showListModal === 'excellence' ? s.isExcellent : s.isBlacklisted).filter(s => s.name.toLowerCase().includes(listSearch.toLowerCase())).map(s => (
                         <div key={s.id} className="flex items-center gap-2 bg-white p-3 rounded-lg border hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => { if(tempListSelected.includes(s.name)) setTempListSelected(tempListSelected.filter(n => n !== s.name)); else setTempListSelected([...tempListSelected, s.name]); }}>
                             <div className={`w-5 h-5 rounded border flex items-center justify-center ${tempListSelected.includes(s.name) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>{tempListSelected.includes(s.name) && <Check size={14} className="text-white"/>}</div>
                             <span className="text-sm font-bold text-slate-700">{s.name}</span>
                             <span className="text-xs text-slate-500 mr-auto font-bold bg-slate-100 px-2 py-1 rounded">{s.grade}</span>
                         </div>
                      ))
                   }
                   {studentData.filter(s => showListModal === 'excellence' ? s.isExcellent : s.isBlacklisted).length === 0 && <div className="text-center text-slate-400 py-8 italic font-bold">لا توجد أسماء في هذه القائمة</div>}
                </div>
                <div className="flex gap-2">
                   <button onClick={handleListApply} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black hover:bg-blue-700 transition-colors">عرض المختارين</button>
                   <button onClick={() => { setShowListModal(null); setTempListSelected([]); }} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black hover:bg-slate-200 transition-colors">إلغاء</button>
                </div>
            </div>
        </div>
      )}

      {importConfirmation && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
                  <h3 className="text-lg font-black text-center mb-4">خيارات الاستيراد</h3>
                  <p className="text-center mb-6 text-slate-600 font-bold">هل تريد إضافة البيانات إلى القائمة الحالية أم استبدالها بالكامل؟</p>
                  <div className="space-y-3">
                      <button onClick={() => { updateData({ studentReports: [...studentData, ...importConfirmation.data] }); setImportConfirmation(null); }} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black hover:bg-blue-700">إضافة إلى الموجود</button>
                      <button onClick={() => { updateData({ studentReports: importConfirmation.data }); setImportConfirmation(null); }} className="w-full bg-red-600 text-white py-3 rounded-xl font-black hover:bg-red-700">استبدال الكل (حذف السابق)</button>
                      <button onClick={() => setImportConfirmation(null)} className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-black hover:bg-slate-200">إلغاء</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
