
import React, { useState, useMemo } from 'react';
import { useGlobal } from '../context/GlobalState';
import { StudentReport, AbsenceRecord, LatenessRecord } from '../types';
import * as XLSX from 'xlsx';
import { 
  Plus, Upload, Sparkles, FileText, FileSpreadsheet, Share2, 
  Calendar, Star, AlertCircle, Filter, Check, Trash2, X,
  UserMinus, Bookmark, GraduationCap, Briefcase, Users, ScrollText,
  Clock, Fingerprint, Search, Save, History, Edit3
} from 'lucide-react';
import DynamicTable from '../components/DynamicTable';

export const DailyReportsPage: React.FC = () => {
    const { data, updateData, lang } = useGlobal();
    
    return (
        <div className="space-y-4 animate-in fade-in">
             <div className="bg-white p-4 rounded-xl shadow-sm border">
                <h2 className="text-xl font-bold text-slate-800">متابعة المعلمين والتقرير اليومي</h2>
             </div>
             <DynamicTable 
                title="سجل التقارير اليومية"
                columns={[
                    { key: 'dateStr', label: 'التاريخ' },
                    { key: 'dayName', label: 'اليوم' },
                    { key: 'teacherCount', label: 'عدد المعلمين' }
                ]}
                data={data.dailyReports.map(r => ({...r, teacherCount: r.teachersData.length}))}
                onAdd={() => { /* Implement add logic */ }}
                onEdit={(item) => { /* Implement edit logic */ }}
                onDelete={(id) => updateData({ dailyReports: data.dailyReports.filter(r => r.id !== id) })}
             />
        </div>
    );
};

export const ViolationsPage: React.FC = () => {
    const { data, updateData, lang } = useGlobal();

    return (
        <div className="space-y-4 animate-in fade-in">
             <div className="bg-white p-4 rounded-xl shadow-sm border">
                <h2 className="text-xl font-bold text-slate-800">سجل المخالفات والتعهدات</h2>
             </div>
             <DynamicTable 
                title="المخالفات"
                columns={[
                    { key: 'studentName', label: 'اسم الطالب' },
                    { key: 'date', label: 'التاريخ' },
                    { key: 'type', label: 'نوع المخالفة' },
                    { key: 'reason', label: 'السبب' }
                ]}
                data={data.violations}
                onAdd={() => { /* Implement add logic */ }}
                onEdit={(item) => { /* Implement edit logic */ }}
                onDelete={(id) => updateData({ violations: data.violations.filter(v => v.id !== id) })}
             />
        </div>
    );
};

export const StudentsReportsPage: React.FC = () => {
  const { lang, data, updateData } = useGlobal();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentInput, setStudentInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStudentNames, setSelectedStudentNames] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'excellence' | 'blacklist' | 'specific' | 'specific_names'>('all');
  const [showSpecificFilterModal, setShowSpecificFilterModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [importConfirmation, setImportConfirmation] = useState<{data: StudentReport[]} | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const studentData = data.studentReports || [];

  const options = {
    grades: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    sections: ['أ', 'ب', 'ج', 'د', 'هـ'],
    gender: ['ذكر', 'أنثى'],
    workOutside: ['لا يعمل', 'يعمل'],
    health: ['ممتاز', 'مريض', 'حالة خاصة'],
    level: ['ممتاز', 'جيد جدا', 'جيد', 'مقبول', 'ضعيف'],
    behavior: ['ممتاز', 'جيد', 'مشاغب', 'عدواني'],
    mainNotes: ['يتيم', 'فقير', 'ذكي', 'كثير الحركة', 'موهوب'],
    eduStatus: ['جامعي', 'ثانوي', 'أمي'],
    followUp: ['متابع', 'غير متابع', 'مهتم'],
    cooperation: ['متعاون', 'غير متعاون', 'متذمر']
  };

  const columnsMap = [
    { key: 'gender', label: 'النوع' },
    { key: 'absenceDays', label: 'عدد الغياب' },
    { key: 'address', label: 'العنوان وتفاصيل السكن' },
    { key: 'academic', label: 'المستوى العلمي' },
    { key: 'behavior', label: 'السلوك' },
    { key: 'notes', label: 'الملاحظات' },
    { key: 'followup', label: 'متابعة ولي الأمر' },
  ];

  const addStudent = () => {
    const newStudent: StudentReport = {
        id: Date.now().toString(),
        name: 'طالب جديد',
        gender: 'ذكر',
        grade: '1',
        section: 'أ',
        address: '',
        workOutside: 'لا يعمل',
        healthStatus: 'ممتاز',
        healthDetails: '',
        guardianName: '',
        guardianPhones: [],
        academicReading: 'جيد',
        academicWriting: 'جيد',
        academicParticipation: 'جيد',
        behaviorLevel: 'ممتاز',
        mainNotes: [],
        otherNotesText: '',
        guardianEducation: '',
        guardianFollowUp: 'متابع',
        guardianCooperation: 'متعاون',
        notes: '',
        createdAt: new Date().toISOString()
    };
    updateData({ studentReports: [newStudent, ...studentData] });
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
        const jsonData = XLSX.utils.sheet_to_json(ws) as any[];
        
        const mappedData: StudentReport[] = jsonData.map((row: any, i) => ({
            id: Date.now().toString() + i,
            name: row['الاسم'] || row['name'] || 'بدون اسم',
            grade: row['الصف'] || '1',
            section: row['الشعبة'] || 'أ',
            gender: row['النوع'] || 'ذكر',
            address: row['العنوان'] || '',
            createdAt: new Date().toISOString(),
            workOutside: 'لا يعمل',
            healthStatus: 'ممتاز',
            healthDetails: '',
            guardianName: '',
            guardianPhones: [],
            academicReading: 'جيد',
            academicWriting: 'جيد',
            academicParticipation: 'جيد',
            behaviorLevel: 'ممتاز',
            mainNotes: [],
            otherNotesText: '',
            guardianEducation: '',
            guardianFollowUp: 'متابع',
            guardianCooperation: 'متعاون',
            notes: ''
        }));
        setImportConfirmation({ data: mappedData });
    };
    reader.readAsBinaryString(file);
  };

  const bulkAutoFill = () => {
    if (!confirm('هل أنت متأكد من تعبئة الحقول الفارغة بقيم افتراضية؟')) return;
    const filled = studentData.map(s => ({
        ...s,
        address: s.address || 'المدينة',
        guardianName: s.guardianName || `ولي أمر ${s.name}`,
        academicReading: s.academicReading || 'جيد',
        behaviorLevel: s.behaviorLevel || 'ممتاز'
    }));
    updateData({ studentReports: filled });
  };

  const generateReportText = () => {
    return studentData.map(s => `${s.name} - ${s.grade}`).join('\n');
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(studentData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Students.xlsx");
  };

  const sendWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(generateReportText())}`);
  };

  const addStudentToFilter = (name?: string) => {
      const target = name || studentInput;
      if (target && !selectedStudentNames.includes(target)) {
          setSelectedStudentNames([...selectedStudentNames, target]);
          setStudentInput('');
      }
  };

  const isColVisible = (key: string) => {
      if (selectedColumns.length === 0) return true;
      return selectedColumns.includes(key);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) setSelectedStudentIds(studentData.map(s => s.id));
      else setSelectedStudentIds([]);
  };

  const handleBulkDelete = () => {
      if (confirm(`حذف ${selectedStudentIds.length} طالب؟`)) {
          updateData({ studentReports: studentData.filter(s => !selectedStudentIds.includes(s.id)) });
          setSelectedStudentIds([]);
      }
  };

  const toggleStar = (id: string, field: 'isExcellent' | 'isBlacklisted') => {
      updateData({ studentReports: studentData.map(s => s.id === id ? { ...s, [field]: !s[field] } : s) });
  };

  const updateStudent = (id: string, field: keyof StudentReport, value: any) => {
      updateData({ studentReports: studentData.map(s => s.id === id ? { ...s, [field]: value } : s) });
  };

  const filteredData = useMemo(() => {
    let result = studentData;
    if (filterMode === 'excellence') result = result.filter(s => s.isExcellent);
    if (filterMode === 'blacklist') result = result.filter(s => s.isBlacklisted);
    if (filterMode === 'specific_names' && selectedStudentNames.length > 0) {
        result = result.filter(s => selectedStudentNames.includes(s.name));
    }
    return result;
  }, [studentData, filterMode, selectedStudentNames]);

  return (
    <div className="space-y-4 font-arabic animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={addStudent} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-blue-700 shadow-md">
            <Plus className="w-4 h-4" /> إضافة طالب
          </button>
          <label className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-xl font-bold text-sm border border-green-200 cursor-pointer hover:bg-green-100">
            <Upload className="w-4 h-4" /> استيراد ملف
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
          </label>
          <button onClick={bulkAutoFill} className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2.5 rounded-xl font-bold text-sm border border-purple-200 hover:bg-purple-100">
            <Sparkles className="w-4 h-4" /> تعبئة تلقائية
          </button>
          
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button onClick={() => { 
                const text = generateReportText().replace(/\*/g, ''); 
                const blob = new Blob([text], { type: 'text/plain;charset=utf-8' }); 
                const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Report.txt`; link.click();
            }} className="p-2.5 hover:bg-white text-slate-600 rounded-lg transition-all" title="TXT Export"><FileText className="w-4 h-4" /></button>
            <button onClick={exportToExcel} className="p-2.5 hover:bg-white text-green-600 rounded-lg transition-all" title="Excel Export"><FileSpreadsheet className="w-4 h-4" /></button>
            <button onClick={sendWhatsApp} className="p-2.5 hover:bg-white text-green-500 rounded-lg transition-all" title="WhatsApp Report"><Share2 className="w-4 h-4" /></button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 border px-3 py-2 rounded-xl">
           <Calendar size={16} className="text-slate-500"/>
           <input type="date" className="bg-transparent font-bold text-sm outline-none text-slate-700" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
      </div>
      
      <div className="bg-slate-50 p-4 rounded-xl border flex flex-col sm:flex-row gap-4 items-start sm:items-center">
         <div className="flex-1 w-full relative">
            <div className="flex gap-2">
                <input 
                    className="flex-1 p-2.5 border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" 
                    placeholder="اكتب اسم الطالب هنا لإضافته للفلتر..." 
                    value={studentInput}
                    onChange={(e) => { setStudentInput(e.target.value); setShowSuggestions(true); }}
                    onKeyDown={(e) => e.key === 'Enter' && addStudentToFilter()}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                <button onClick={() => addStudentToFilter()} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 font-bold px-4">موافق</button>
            </div>
            
            {showSuggestions && studentInput && (
                <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto mt-1">
                    {studentData.filter(s => s.name.includes(studentInput)).map(s => s.name).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5).map((name, i) => (
                            <div key={i} className="p-2.5 hover:bg-blue-50 cursor-pointer text-sm font-bold text-slate-700 border-b border-slate-50 last:border-0" onClick={() => { addStudentToFilter(name); setShowSuggestions(false); }}>{name}</div>
                    ))}
                </div>
            )}

            {selectedStudentNames.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedStudentNames.map(name => (
                        <span key={name} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                            {name} <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setSelectedStudentNames(prev => prev.filter(n => n !== name))} />
                        </span>
                    ))}
                    <button onClick={() => {setFilterMode('specific_names');}} className="text-xs font-bold text-blue-600 underline">تطبيق الفلتر</button>
                    <button onClick={() => {setSelectedStudentNames([]); setFilterMode('all');}} className="text-xs font-bold text-red-600 underline">مسح الكل</button>
                </div>
            )}
         </div>
         <div className="w-full sm:w-auto p-2 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
             <div className="flex flex-wrap items-center justify-center gap-2">
                 <button onClick={() => setFilterMode('excellence')} className={`px-4 py-2 rounded-xl font-bold text-xs border flex items-center gap-2 transition-all ${filterMode === 'excellence' ? 'bg-green-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                     <Star size={14} className={filterMode === 'excellence' ? 'fill-white' : ''}/> المتميزين
                 </button>
                 <button onClick={() => setFilterMode('blacklist')} className={`px-4 py-2 rounded-xl font-bold text-xs border flex items-center gap-2 transition-all ${filterMode === 'blacklist' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                     <AlertCircle size={14}/> القائمة السوداء
                 </button>
                 <button onClick={() => setShowSpecificFilterModal(true)} className={`px-4 py-2 rounded-xl font-bold text-xs border flex items-center gap-2 transition-all ${filterMode === 'specific' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                     <Filter size={14}/> تصفية حسب صفة
                 </button>
                 <button onClick={() => {setFilterMode('all'); setSelectedColumns([]);}} className="px-4 py-2 rounded-xl font-bold text-xs border bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all">الجميع</button>
             </div>
         </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden relative">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-center border-collapse min-w-[1200px]">
             <thead className="sticky top-0 z-20 shadow-sm text-xs">
                <tr className="border-b border-slate-300">
                  <th colSpan={3 + (isColVisible('gender') ? 1 : 0) + (isColVisible('absenceDays') ? 1 : 0)} className="p-3 border-e border-slate-300 bg-[#FFD966] font-black whitespace-nowrap sticky left-0 z-30">بيانات الطالب</th>
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
                  <th className="p-3 border-e border-slate-300 bg-[#FFD966] whitespace-nowrap sticky right-0 z-30 min-w-[180px]">اسم الطالب</th>
                  <th className="p-3 border-e border-slate-300 bg-[#FFD966] whitespace-nowrap">الصف</th>
                  <th className="p-3 border-e border-slate-300 bg-[#FFD966] whitespace-nowrap">الشعبة</th>
                  {isColVisible('gender') && <th className="p-3 border-e border-slate-300 bg-[#FFD966] whitespace-nowrap">النوع</th>}
                  {isColVisible('absenceDays') && <th className="p-3 border-e border-slate-300 bg-[#FFD966] whitespace-nowrap">عدد الغياب</th>}
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
                     <td className="p-2 border-e bg-white flex items-center gap-1 group-hover:bg-slate-50 whitespace-nowrap sticky right-0 z-20 min-w-[180px] border-l shadow-sm">
                        <div className="flex flex-col gap-0.5">
                           <button onClick={() => toggleStar(s.id, 'isExcellent')}><Star size={12} className={s.isExcellent ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}/></button>
                           <button onClick={() => toggleStar(s.id, 'isBlacklisted')}><AlertCircle size={12} className={s.isBlacklisted ? "text-red-600" : "text-slate-300"}/></button>
                        </div>
                        <input className="w-full text-xs font-bold bg-transparent outline-none" value={s.name} onChange={(e) => updateStudent(s.id, 'name', e.target.value)} placeholder="الاسم..." />
                     </td>
                     <td className="p-1 border-e whitespace-nowrap"><select className="w-full bg-transparent text-[10px] outline-none" value={s.grade} onChange={(e) => updateStudent(s.id, 'grade', e.target.value)}>{options.grades.map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                     <td className="p-1 border-e whitespace-nowrap"><select className="w-full bg-transparent text-[10px] outline-none" value={s.section} onChange={(e) => updateStudent(s.id, 'section', e.target.value)}>{options.sections.map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                     {isColVisible('gender') && <td className="p-1 border-e whitespace-nowrap"><select className="w-full bg-transparent text-[10px] outline-none" value={s.gender} onChange={(e) => updateStudent(s.id, 'gender', e.target.value)}>{options.gender.map(o => <option key={o} value={o}>{o}</option>)}</select></td>}
                     {isColVisible('absenceDays') && <td className="p-1 border-e whitespace-nowrap"><input type="number" className="w-full text-[10px] bg-transparent outline-none text-center" value={s.absenceDays || 0} onChange={(e) => updateStudent(s.id, 'absenceDays', parseInt(e.target.value) || 0)} /></td>}
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
                                {s.mainNotes.map(n => <button key={n} onClick={() => updateStudent(s.id, 'mainNotes', s.mainNotes.filter(x => x !== n))} className="bg-slate-100 hover:bg-red-50 text-[8px] px-1 rounded border">{n}</button>)}
                                <div className="relative group">
                                    <button className="text-[10px] text-blue-600 font-bold">+</button>
                                    <div className="absolute top-full left-0 bg-white shadow-lg border rounded p-2 w-40 z-50 hidden group-hover:block max-h-40 overflow-y-auto">
                                        {options.mainNotes.map(op => <div key={op} onClick={() => !s.mainNotes.includes(op) && updateStudent(s.id, 'mainNotes', [...s.mainNotes, op])} className="p-1 hover:bg-blue-50 cursor-pointer text-[10px]">{op}</div>)}
                                    </div>
                                </div>
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

      {showSpecificFilterModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                <h3 className="font-black mb-4 text-center text-xl text-slate-800">تصفية الأعمدة</h3>
                <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto mb-4">
                    <button onClick={() => { setSelectedColumns([]); }} className={`p-3 rounded-xl border font-bold text-sm ${selectedColumns.length === 0 ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-slate-50'}`}>الجميع (إظهار الكل)</button>
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
                            className={`p-3 rounded-xl border font-bold text-sm flex items-center justify-between ${selectedColumns.includes(col.key) ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                        >
                            {col.label}
                            {selectedColumns.includes(col.key) && <Check size={16}/>}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setFilterMode('specific'); setShowSpecificFilterModal(false); }} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black">عرض النتائج</button>
                    <button onClick={() => setShowSpecificFilterModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black">إغلاق</button>
                </div>
            </div>
        </div>
      )}

      {importConfirmation && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
                  <h3 className="text-lg font-black text-center mb-4">خيارات الاستيراد</h3>
                  <div className="space-y-3">
                      <button onClick={() => { updateData({ studentReports: [...studentData, ...importConfirmation.data] }); setImportConfirmation(null); }} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black">إضافة إلى الموجود</button>
                      <button onClick={() => { updateData({ studentReports: importConfirmation.data }); setImportConfirmation(null); }} className="w-full bg-red-600 text-white py-3 rounded-xl font-black">استبدال الكل (حذف السابق)</button>
                      <button onClick={() => setImportConfirmation(null)} className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-black">إلغاء</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const LatenessModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const { data, updateData } = useGlobal();
  const [view, setView] = useState<'entry' | 'table' | 'archive'>('entry');
  const [formData, setFormData] = useState<Partial<LatenessRecord>>({
    date: new Date().toISOString().split('T')[0],
    term: 'الأول',
    latenessStatus: '',
    reason: '',
    actionTaken: '',
    signaturePledge: '',
    notes: '',
    previousCount: 0
  });
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentList, setShowStudentList] = useState(false);
  const [filters, setFilters] = useState({ term: 'all', start: '', end: '', name: '', grade: '', section: '' });
  const [archiveDate, setArchiveDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const latenessRecords = data.latenessRecords || [];
  const students = data.studentReports || [];

  const handleStudentSelect = (student: StudentReport) => {
    const prevCount = latenessRecords.filter(r => r.studentId === student.id).length;
    setFormData({
      ...formData,
      studentId: student.id,
      studentName: student.name,
      grade: student.grade,
      section: student.section,
      previousCount: prevCount
    });
    setStudentSearch(student.name);
    setShowStudentList(false);
  };

  const togglePin = (studentId: string) => {
    updateData({
      studentReports: students.map(s => s.id === studentId ? { ...s, isLatenessPinned: !s.isLatenessPinned } : s)
    });
  };

  const handleSave = () => {
    if (!formData.studentId || !formData.date) return alert('يرجى اختيار الطالب والتاريخ');
    const newRecord: LatenessRecord = {
      id: Date.now().toString(),
      studentId: formData.studentId,
      studentName: formData.studentName!,
      grade: formData.grade!,
      section: formData.section!,
      date: formData.date!,
      dayName: new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date(formData.date!)),
      term: formData.term!,
      latenessStatus: formData.latenessStatus!,
      reason: formData.reason!,
      actionTaken: formData.actionTaken!,
      signaturePledge: formData.signaturePledge,
      notes: formData.notes!,
      previousCount: formData.previousCount!
    };

    updateData({ latenessRecords: [...latenessRecords, newRecord] });
    alert('تم حفظ التأخر بنجاح');
    setFormData({ ...formData, studentId: undefined, studentName: '', grade: '', section: '', previousCount: 0, latenessStatus: '', reason: '', actionTaken: '', signaturePledge: '', notes: '' });
    setStudentSearch('');
  };

  const filteredRecords = useMemo(() => {
    return latenessRecords.filter(r => {
      if (filters.term !== 'all' && r.term !== filters.term) return false;
      if (filters.start && r.date < filters.start) return false;
      if (filters.end && r.date > filters.end) return false;
      if (filters.name && !r.studentName.includes(filters.name)) return false;
      if (filters.grade && r.grade !== filters.grade) return false;
      if (filters.section && r.section !== filters.section) return false;
      return true;
    });
  }, [latenessRecords, filters]);

  const generateReportText = () => {
    let text = `*📊 تقرير التأخر اليومي*\n`;
    text += `*📅 التاريخ:* ${new Date().toLocaleDateString('ar-EG')}\n------------------\n`;
    filteredRecords.forEach((r, i) => {
      text += `*${i+1}. 👤 الطالب:* ${r.studentName}\n`;
      text += `   📍 الصف: ${r.grade} - ${r.section}\n`;
      text += `   ⚠️ الحالة: ${r.latenessStatus}\n`;
      text += `   📝 الإجراء: ${r.actionTaken}\n`;
      if (r.signaturePledge) text += `   ✍️ التعهد: ${r.signaturePledge}\n`;
      text += `------------------\n`;
    });
    return text;
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRecords);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lateness");
    XLSX.writeFile(wb, "Lateness_Report.xlsx");
  };

  const exportTxt = () => {
    const text = generateReportText().replace(/\*/g, '');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Lateness_Report.txt`; link.click();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden font-arabic">
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
          <h2 className="text-2xl font-black flex items-center gap-2"><Clock className="text-orange-400"/> نظام متابعة التأخر اليومي</h2>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="flex flex-wrap gap-3 mb-6">
            <button onClick={() => setView('entry')} className={`px-6 py-3 rounded-xl font-black transition-all ${view === 'entry' ? 'bg-orange-600 text-white' : 'bg-white text-slate-600 border'}`}>تسجيل تأخر جديد</button>
            <button onClick={() => setView('table')} className={`px-6 py-3 rounded-xl font-black transition-all ${view === 'table' ? 'bg-orange-600 text-white' : 'bg-white text-slate-600 border'}`}>جدول التأخر</button>
            <button onClick={() => setView('archive')} className={`px-6 py-3 rounded-xl font-black transition-all ${view === 'archive' ? 'bg-orange-600 text-white' : 'bg-white text-slate-600 border'}`}>تقرير التأخر (الأرشيف)</button>
          </div>

          {view === 'entry' ? (
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
                 <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                       <label className="block text-sm font-bold text-slate-600 mb-1">نوع التأخر:</label>
                       <div className="flex gap-2 flex-wrap">
                          {['تأخر متكرر', 'كثير التأخر', 'دائم التأخر'].map(t => (
                            <button key={t} onClick={() => setFormData({...formData, latenessStatus: t})} className={`px-4 py-2 rounded-xl font-black text-sm border transition-all ${formData.latenessStatus === t ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 border-slate-200'}`}>{t}</button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="border-t pt-6">
                    <h3 className="font-black text-lg mb-4 flex items-center gap-2"><Plus className="text-orange-500" size={20}/> تسجيل البيانات</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="relative z-20">
                          <label className="block text-sm font-bold text-slate-600 mb-1">اسم الطالب (بحث من شؤون الطلاب)</label>
                          <div className="flex gap-2">
                             <input 
                                className="w-full p-3 border rounded-xl font-bold bg-slate-50 focus:border-orange-500 outline-none" 
                                placeholder="ابحث عن الطالب..."
                                value={studentSearch}
                                onChange={e => { setStudentSearch(e.target.value); setShowStudentList(true); }}
                             />
                             {formData.studentId && (
                                <button onClick={() => togglePin(formData.studentId!)} className={`p-3 rounded-xl border ${students.find(s=>s.id===formData.studentId)?.isLatenessPinned ? 'bg-yellow-100 border-yellow-400 text-yellow-600' : 'bg-slate-50 text-slate-400'}`}>
                                   <Star fill={students.find(s=>s.id===formData.studentId)?.isLatenessPinned ? 'currentColor' : 'none'} size={20}/>
                                </button>
                             )}
                          </div>
                          {showStudentList && studentSearch && (
                            <div className="absolute w-full bg-white border rounded-xl shadow-xl mt-1 max-h-60 overflow-y-auto">
                              {students.filter(s => s.name.includes(studentSearch)).map(s => (
                                <div key={s.id} onClick={() => handleStudentSelect(s)} className="p-3 hover:bg-orange-50 cursor-pointer border-b flex justify-between items-center">
                                   <span className="font-bold">{s.name}</span>
                                   {s.isLatenessPinned && <Star className="text-yellow-500 fill-yellow-500" size={14}/>}
                                </div>
                              ))}
                            </div>
                          )}
                       </div>

                       <div className="grid grid-cols-2 gap-2">
                          <div>
                             <label className="text-xs font-bold block mb-1">الفصل</label>
                             <select className="w-full p-3 bg-slate-50 rounded-xl border font-bold text-sm" value={formData.term} onChange={e => setFormData({...formData, term: e.target.value})}>
                                <option value="الأول">الأول</option>
                                <option value="الثاني">الثاني</option>
                             </select>
                          </div>
                          <div>
                             <label className="text-xs font-bold block mb-1">حالة التأخر</label>
                             <div className="w-full p-3 bg-orange-50 rounded-xl border border-orange-200 font-bold text-sm text-orange-700">{formData.latenessStatus || 'يرجى اختيار النوع'}</div>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border mt-4">
                       <div><span className="text-xs text-slate-500 block">الصف</span><span className="font-black">{formData.grade || '-'}</span></div>
                       <div><span className="text-xs text-slate-500 block">الشعبة</span><span className="font-black">{formData.section || '-'}</span></div>
                       <div><span className="text-xs text-slate-500 block">تأخر سابق</span><span className="font-black text-red-600">{formData.previousCount || 0}</span></div>
                       <div><span className="text-xs text-slate-500 block">التاريخ</span><span className="font-black">{formData.date}</span></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                       <div>
                          <label className="text-xs font-bold block mb-1">سبب التأخر</label>
                          <select className="w-full p-3 bg-slate-50 rounded-xl border font-bold text-sm" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}>
                             <option value="">-- اختر --</option>
                             {['مرض', 'انشغال', 'نوم', 'لم يمر له الباص', 'بلا عذر'].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-bold block mb-1">الإجراء المتخذ</label>
                          <select className="w-full p-3 bg-slate-50 rounded-xl border font-bold text-sm" value={formData.actionTaken} onChange={e => setFormData({...formData, actionTaken: e.target.value})}>
                             <option value="">-- اختر --</option>
                             {['تنبيه 1', 'تنبيه 2', 'تعهد', 'اتصال بولي الأمر', 'توقيف جزئي', 'الرفع به إلى جهة إدارية عليا', 'غيرها'].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center gap-3">
                       <button onClick={() => setFormData({...formData, signaturePledge: 'أتعهد بعدم تكرار التأخر وفي حالة التكرار فللإدارة الحق في اتخاذ اللازم.'})} className="flex items-center gap-2 bg-white px-6 py-2 rounded-xl border border-blue-200 text-blue-600 font-black shadow-sm hover:bg-blue-100 transition-all"><Fingerprint size={20}/> بصمة الطالب</button>
                       {formData.signaturePledge && <div className="text-blue-800 font-bold italic text-center">"{formData.signaturePledge}"</div>}
                    </div>

                    <div className="mt-4">
                       <label className="text-xs font-bold block mb-1">ملاحظات عامة</label>
                       <input className="w-full p-3 bg-slate-50 rounded-xl border font-bold text-sm" placeholder="..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                    </div>

                    <button onClick={handleSave} className="w-full mt-6 py-4 bg-orange-600 text-white rounded-xl font-black text-lg hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all flex items-center justify-center gap-2"><Save size={20}/> حفظ البيانات</button>
                 </div>
               </div>

               <div className="p-6 bg-white border-2 border-orange-200 rounded-3xl shadow-sm text-center">
                  <h2 className="text-xl font-black text-slate-800 mb-2">تأخر يوم {new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date())} بتاريخ {new Date().toLocaleDateString('ar-EG')}</h2>
                  <p className="text-slate-500 font-bold">الفصل الدراسي: {data.profile.term} | الصفوف المتابعة</p>
               </div>
            </div>
          ) : view === 'table' ? (
            <div className="space-y-4">
               <div className="bg-white p-6 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400">الفصل الدراسي</label>
                     <select className="w-full p-2 border rounded-lg text-xs font-bold" value={filters.term} onChange={e => setFilters({...filters, term: e.target.value})}>
                        <option value="all">الكل</option>
                        <option value="الأول">الأول</option>
                        <option value="الثاني">الثاني</option>
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400">من تاريخ</label>
                     <input type="date" className="w-full p-2 border rounded-lg text-xs font-bold" value={filters.start} onChange={e => setFilters({...filters, start: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400">إلى تاريخ</label>
                     <input type="date" className="w-full p-2 border rounded-lg text-xs font-bold" value={filters.end} onChange={e => setFilters({...filters, end: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400">اسم الطالب</label>
                     <input className="w-full p-2 border rounded-lg text-xs font-bold" value={filters.name} onChange={e => setFilters({...filters, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400">الصف</label>
                     <input className="w-full p-2 border rounded-lg text-xs font-bold" value={filters.grade} onChange={e => setFilters({...filters, grade: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400">الشعبة</label>
                     <input className="w-full p-2 border rounded-lg text-xs font-bold" value={filters.section} onChange={e => setFilters({...filters, section: e.target.value})} />
                  </div>
               </div>

               <div className="flex flex-wrap gap-2">
                  <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(generateReportText())}`, '_blank')} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-600 transition-all shadow-md shadow-green-100"><Share2 size={16}/> إرسال واتساب</button>
                  <button onClick={exportExcel} className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-800 transition-all shadow-md shadow-green-200"><FileSpreadsheet size={16}/> إكسل</button>
                  <button onClick={exportTxt} className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-700 transition-all shadow-md"><FileText size={16}/> تصدير نصي</button>
               </div>

               <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="w-full text-center border-collapse">
                        <thead>
                           <tr className="bg-slate-900 text-white text-xs">
                              <th className="p-3">اسم الطالب</th>
                              <th className="p-3">الصف</th>
                              <th className="p-3">الشعبة</th>
                              <th className="p-3">عدد التأخر</th>
                              <th className="p-3">التاريخ</th>
                              <th className="p-3">السبب</th>
                              <th className="p-3">حالة التأخر</th>
                              <th className="p-3">نوع الإجراء</th>
                              <th className="p-3">ملاحظات</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y text-xs font-bold">
                           {filteredRecords.map(r => (
                             <tr key={r.id} className="hover:bg-orange-50/50">
                                <td className="p-3 font-black text-slate-800">{r.studentName}</td>
                                <td className="p-3">{r.grade}</td>
                                <td className="p-3">{r.section}</td>
                                <td className="p-3 text-red-600 font-black">{r.previousCount + 1}</td>
                                <td className="p-3">{r.date}</td>
                                <td className="p-3">{r.reason}</td>
                                <td className="p-3"><span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg border border-orange-200">{r.latenessStatus}</span></td>
                                <td className="p-3">{r.actionTaken}</td>
                                <td className="p-3 text-slate-500 font-medium">{r.notes || '-'}</td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col items-center">
                  <h3 className="font-black text-xl mb-4">تقرير التأخر التاريخي</h3>
                  <div className="flex gap-4 items-center mb-6">
                     <label className="font-bold">اختر التاريخ لعرض البيانات:</label>
                     <input type="date" value={archiveDate} onChange={e => setArchiveDate(e.target.value)} className="p-3 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  
                  <div className="w-full overflow-hidden border rounded-2xl">
                     <table className="w-full text-center">
                        <thead className="bg-slate-100 border-b">
                           <tr className="text-xs font-black">
                              <th className="p-3">الطالب</th>
                              <th className="p-3">الحالة</th>
                              <th className="p-3">الإجراء</th>
                              <th className="p-3">تعديل</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y">
                           {latenessRecords.filter(r => r.date === archiveDate).map(r => (
                             <tr key={r.id}>
                                <td className="p-3 font-bold">{r.studentName}</td>
                                <td className="p-3 text-orange-600">{r.latenessStatus}</td>
                                <td className="p-3 text-xs">{r.actionTaken}</td>
                                <td className="p-3"><button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={16}/></button></td>
                             </tr>
                           ))}
                           {latenessRecords.filter(r => r.date === archiveDate).length === 0 && (
                             <tr><td colSpan={4} className="p-10 text-slate-400 italic">لا توجد بيانات لهذا التاريخ</td></tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SpecialReportsPage: React.FC = () => {
    const [showAbsenceModal, setShowAbsenceModal] = useState(false);
    const [showLatenessModal, setShowLatenessModal] = useState(false);

    return (
        <div className="font-arabic animate-in fade-in space-y-6">
            <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileText size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800">تقارير خاصة ومتقدمة</h2>
                    <p className="text-slate-500 text-sm font-bold">مجموعة شاملة من التقارير الإدارية والتربوية المتخصصة</p>
                </div>
            </div>

            <DailyAbsenceModal isOpen={showAbsenceModal} onClose={() => setShowAbsenceModal(false)} />
            <LatenessModal isOpen={showLatenessModal} onClose={() => setShowLatenessModal(false)} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all group">
                    <h3 className="text-xl font-black text-blue-700 mb-6 flex items-center gap-2 border-b pb-4">
                        <Briefcase size={24} className="group-hover:scale-110 transition-transform"/> المشرف الإداري
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {["الخطة الفصلية", "الخلاصة الشهرية", "المهام اليومية", "المهام المضافة", "المهام المرحلة", "أهم المشكلات اليومية", "التوصيات العامة", "احتياجات الدور", "سجل متابعة الدفاتر والتصحيح", "الجرد العام للعهد", "ملاحظات عامة"].map((item, i) => (
                            <button key={i} className="p-3 text-xs font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-slate-100 text-center shadow-sm">
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all group">
                    <h3 className="text-xl font-black text-purple-700 mb-6 flex items-center gap-2 border-b pb-4">
                        <Users size={24} className="group-hover:scale-110 transition-transform"/> الكادر التعليمي
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {["سجل الإبداع والتميز", "كشف الاستلام والتسليم", "المخالفات", "التعميمات"].map((item, i) => (
                            <button key={i} className="p-4 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-purple-600 hover:text-white transition-all border border-slate-100 flex items-center gap-3 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-purple-400"></div> {item}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all group">
                    <h3 className="text-xl font-black text-green-700 mb-6 flex items-center gap-2 border-b pb-4">
                        <GraduationCap size={24} className="group-hover:scale-110 transition-transform"/> الطلاب/ الطالبات
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {["الغياب اليومي", "التأخر", "خروج طالب أثناء الدراسة", "المخالفات الطلابية", "سجل الإتلاف المدرسي", "سجل الحالات الخاصة", "سجل الحالة الصحية", "سجل زيارة أولياء الأمور والتواصل بهم"].map((item, i) => (
                            <button 
                                key={i} 
                                onClick={() => {
                                    if (item === 'الغياب اليومي') setShowAbsenceModal(true);
                                    if (item === 'التأخر') setShowLatenessModal(true);
                                }}
                                className={`p-4 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-green-600 hover:text-white transition-all border border-slate-100 flex items-center gap-3 shadow-sm ${item === 'الغياب اليومي' ? 'ring-2 ring-green-500' : ''}`}
                            >
                                <div className="w-2 h-2 rounded-full bg-green-400"></div> {item}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all group">
                    <h3 className="text-xl font-black text-orange-700 mb-6 flex items-center gap-2 border-b pb-4">
                        <ScrollText size={24} className="group-hover:scale-110 transition-transform"/> تقارير الاختبار
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {["الاختبار الشهري", "الاختبار الفصلي"].map((item, i) => (
                            <button key={i} className="p-4 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-orange-600 hover:text-white transition-all border border-slate-100 flex items-center gap-3 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-orange-400"></div> {item}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DailyAbsenceModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const { data, updateData } = useGlobal();
  const [view, setView] = useState<'entry' | 'table'>('entry');
  const [formData, setFormData] = useState<Partial<AbsenceRecord>>({
    date: new Date().toISOString().split('T')[0],
    term: 'الأول',
    reason: 'مرض',
    contactStatus: 'تم التواصل',
    contactType: 'هاتف',
    respondent: 'الأب',
    contactResult: 'تم الرد',
    notes: '',
    tags: []
  });
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentList, setShowStudentList] = useState(false);
  const [filters, setFilters] = useState({ term: 'all', start: '', end: '', name: '', grade: '', section: '' });
  const [showTypeModal, setShowTypeModal] = useState<string | null>(null);

  if (!isOpen) return null;

  const students = data.studentReports || [];
  const absenceRecords = data.absenceRecords || [];

  const handleStudentSelect = (student: StudentReport) => {
    setFormData({
      ...formData,
      studentId: student.id,
      studentName: student.name,
      grade: student.grade,
      section: student.section,
      previousAbsenceCount: student.absenceDays || 0
    });
    setStudentSearch(student.name);
    setShowStudentList(false);
  };

  const handleSave = () => {
    if (!formData.studentId || !formData.date) return alert('يرجى اختيار الطالب والتاريخ');
    const newRecord: AbsenceRecord = {
      id: Date.now().toString(),
      studentId: formData.studentId,
      studentName: formData.studentName!,
      grade: formData.grade!,
      section: formData.section!,
      date: formData.date!,
      dayName: new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date(formData.date!)),
      reason: formData.reason!,
      contactStatus: formData.contactStatus!,
      contactType: formData.contactType!,
      respondent: formData.respondent!,
      contactResult: formData.contactResult!,
      notes: formData.notes!,
      previousAbsenceCount: formData.previousAbsenceCount!,
      term: formData.term,
      tags: formData.tags
    };

    updateData({ absenceRecords: [...absenceRecords, newRecord] });

    const updatedStudents = students.map(s => 
      s.id === formData.studentId 
      ? { ...s, absenceDays: (s.absenceDays || 0) + 1 }
      : s
    );
    updateData({ studentReports: updatedStudents });
    alert('تم حفظ الغياب بنجاح');
    setFormData({ ...formData, studentId: undefined, studentName: '', grade: '', section: '', previousAbsenceCount: 0, notes: '', tags: [] });
    setStudentSearch('');
  };

  const getFilteredRecords = () => {
    return absenceRecords.filter(r => {
      if (filters.term !== 'all' && r.term !== filters.term) return false;
      if (filters.start && r.date < filters.start) return false;
      if (filters.end && r.date > filters.end) return false;
      if (filters.name && !r.studentName.includes(filters.name)) return false;
      if (filters.grade && r.grade !== filters.grade) return false;
      if (filters.section && r.section !== filters.section) return false;
      return true;
    });
  };

  const generateWhatsAppText = () => {
    const records = getFilteredRecords();
    let text = `*📊 تقرير الغياب اليومي*\n`;
    text += `*📅 التاريخ:* ${new Date().toLocaleDateString('ar-EG')}\n------------------\n`;
    records.forEach((r, i) => {
      text += `*${i+1}. 👤 الطالب:* ${r.studentName}\n`;
      text += `   📍 الصف: ${r.grade} - ${r.section}\n`;
      text += `   ⚠️ السبب: ${r.reason}\n`;
      text += `------------------\n`;
    });
    return text;
  };

  const getStudentsByType = (type: string) => {
    if (type === 'expected') return students.filter(s => s.isExpectedAbsent);
    if (type === 'repeated') return students.filter(s => (s.absenceDays || 0) >= 2); 
    if (type === 'week') return students.filter(s => (s.absenceDays || 0) >= 5);
    if (type === 'two_weeks') return students.filter(s => (s.absenceDays || 0) >= 10);
    if (type === 'most') return [...students].sort((a,b) => (b.absenceDays||0) - (a.absenceDays||0)).slice(0, 10);
    if (type === 'disconnected') return students.filter(s => (s.absenceDays || 0) > 30);
    return [];
  };

  const toggleBookmark = (studentId: string) => {
    const updated = students.map(s => s.id === studentId ? { ...s, isExpectedAbsent: !s.isExpectedAbsent } : s);
    updateData({ studentReports: updated });
  };

  const absenceTypes = [
      { id: 'expected', label: 'غياب متوقع' },
      { id: 'repeated', label: 'غياب متكرر' },
      { id: 'week', label: 'أكثر من أسبوع' },
      { id: 'two_weeks', label: 'أكثر من أسبوعين' },
      { id: 'most', label: 'الأكثر غيابا' },
      { id: 'disconnected', label: 'منقطع' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-black flex items-center gap-2"><UserMinus className="text-red-400"/> نظام متابعة الغياب اليومي</h2>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="flex gap-3 mb-6">
            <button onClick={() => setView('entry')} className={`px-6 py-3 rounded-xl font-black transition-all ${view === 'entry' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'}`}>تسجيل غياب جديد</button>
            <button onClick={() => setView('table')} className={`px-6 py-3 rounded-xl font-black transition-all ${view === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'}`}>جدول الغائبين والأرشيف</button>
          </div>
          {view === 'entry' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {absenceTypes.map(t => (
                  <button key={t.id} onClick={() => setShowTypeModal(t.id)} className={`p-3 rounded-xl font-bold text-xs bg-white border hover:bg-slate-50`}>{t.label}</button>
                ))}
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                 <h3 className="font-black text-lg border-b pb-2 mb-4">بيانات الغياب</h3>
                 <div className="relative z-20">
                    <label className="block text-sm font-bold text-slate-600 mb-1">اسم الطالب</label>
                    <div className="flex gap-2">
                      <input className="w-full p-3 border rounded-xl font-bold bg-slate-50 focus:border-blue-500 outline-none" placeholder="ابحث..." value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setShowStudentList(true); }} />
                    </div>
                    {showStudentList && studentSearch && (
                      <div className="absolute w-full bg-white border rounded-xl shadow-xl mt-1 max-h-60 overflow-y-auto">
                        {students.filter(s => s.name.includes(studentSearch)).map(s => (
                          <div key={s.id} onClick={() => handleStudentSelect(s)} className="p-3 hover:bg-blue-50 cursor-pointer border-b flex justify-between items-center"><span className="font-bold">{s.name}</span></div>
                        ))}
                      </div>
                    )}
                 </div>
                 <button onClick={handleSave} className="w-full py-4 bg-green-600 text-white rounded-xl font-black">حفظ</button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
               <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-100">
                     <tr className="text-xs"><th>الطالب</th><th>التاريخ</th><th>السبب</th></tr>
                  </thead>
                  <tbody>{getFilteredRecords().map(r => <tr key={r.id}><td>{r.studentName}</td><td>{r.date}</td><td>{r.reason}</td></tr>)}</tbody>
               </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
