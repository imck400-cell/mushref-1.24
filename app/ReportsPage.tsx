
import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from '../context/GlobalState';
import { StudentReport } from '../types';
import * as XLSX from 'xlsx';
import { 
  Plus, Upload, Sparkles, FileText, FileSpreadsheet, Share2, 
  Calendar, Star, AlertCircle, Filter, Check, Trash2, X, Search 
} from 'lucide-react';
import DynamicTable from '../components/DynamicTable';

type FilterMode = 'all' | 'date' | 'blacklist' | 'excellence' | 'student' | 'specific' | 'specific_names';

export const DailyReportsPage: React.FC = () => {
  const { data, updateData, lang } = useGlobal();

  const handleDelete = (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) {
      updateData({ dailyReports: data.dailyReports.filter(r => r.id !== id) });
    }
  };

  const columns = [
    { key: 'dateStr', label: lang === 'ar' ? 'التاريخ' : 'Date' },
    { key: 'dayName', label: lang === 'ar' ? 'اليوم' : 'Day' },
    { key: 'teacherCount', label: lang === 'ar' ? 'عدد المعلمين' : 'Teachers Count' }
  ];

  const tableData = data.dailyReports.map(r => ({
    ...r,
    teacherCount: r.teachersData?.length || 0
  }));

  return (
    <div className="space-y-6 font-arabic animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
         <h2 className="text-xl font-black text-slate-800">{lang === 'ar' ? 'التقارير اليومية' : 'Daily Reports'}</h2>
         <button 
           onClick={() => {
             // Logic to add new report would go here, possibly navigating or opening a modal
             alert(lang === 'ar' ? 'يمكنك إضافة تقرير جديد من لوحة التحكم' : 'Add from Dashboard');
           }} 
           className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
         >
            <Plus size={18} /> {lang === 'ar' ? 'إضافة تقرير' : 'Add Report'}
         </button>
      </div>
      <DynamicTable 
        title={lang === 'ar' ? 'سجل التقارير اليومية' : 'Daily Reports Log'}
        columns={columns}
        data={tableData}
        onAdd={() => {}}
        onEdit={(item) => console.log(item)}
        onDelete={handleDelete}
      />
    </div>
  );
};

export const ViolationsPage: React.FC = () => {
  const { data, updateData, lang } = useGlobal();

  const columns = [
    { key: 'studentName', label: lang === 'ar' ? 'اسم الطالب' : 'Student Name' },
    { key: 'grade', label: lang === 'ar' ? 'الصف' : 'Grade' },
    { key: 'type', label: lang === 'ar' ? 'نوع المخالفة' : 'Type' },
    { key: 'date', label: lang === 'ar' ? 'التاريخ' : 'Date' },
    { key: 'reason', label: lang === 'ar' ? 'السبب' : 'Reason' },
  ];

  const handleAdd = () => {
    const newViolation = {
      id: Date.now().toString(),
      studentName: 'طالب جديد',
      grade: '---',
      type: 'تعهد',
      date: new Date().toISOString().split('T')[0],
      reason: '',
    };
    updateData({ violations: [...data.violations, newViolation] });
  };

  const handleDelete = (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) {
       updateData({ violations: data.violations.filter(v => v.id !== id) });
    }
  };

  // Simple inline edit could be implemented or a modal, here we assume direct interaction via table edit callback 
  // For simplicity using a prompt in this placeholder
  const handleEdit = (item: any) => {
     const newReason = prompt(lang === 'ar' ? 'تعديل السبب:' : 'Edit Reason:', item.reason);
     if (newReason !== null) {
        const updated = data.violations.map(v => v.id === item.id ? { ...v, reason: newReason } : v);
        updateData({ violations: updated });
     }
  };

  return (
    <div className="space-y-6 font-arabic animate-in fade-in">
       <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
         <h2 className="text-xl font-black text-slate-800">{lang === 'ar' ? 'سجل التعهدات والمخالفات' : 'Violations Log'}</h2>
       </div>
       <DynamicTable 
         title={lang === 'ar' ? 'قائمة المخالفات' : 'Violations List'}
         columns={columns}
         data={data.violations}
         onAdd={handleAdd}
         onEdit={handleEdit}
         onDelete={handleDelete}
       />
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
  
  // Suggestion State
  const [showSuggestions, setShowSuggestions] = useState(false);

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
         <div className="flex-1 w-full relative">
            <div className="flex gap-2">
                <input 
                    className="flex-1 p-2.5 border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" 
                    placeholder="اكتب اسم الطالب هنا لإضافته للفلتر..." 
                    value={studentInput}
                    onChange={(e) => { setStudentInput(e.target.value); setShowSuggestions(true); }}
                    onKeyDown={(e) => e.key === 'Enter' && addStudentToFilter()}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                <button onClick={() => addStudentToFilter()} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700"><Plus size={16}/></button>
            </div>
            
            {/* Auto-Complete Suggestions */}
            {showSuggestions && studentInput && (
                <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto mt-1">
                    {studentData
                        .filter(s => s.name.includes(studentInput))
                        .map(s => s.name)
                        .filter((v, i, a) => a.indexOf(v) === i) // Unique names
                        .slice(0, 5) // Limit to top 5
                        .map((name, i) => (
                            <div 
                                key={i} 
                                className="p-2.5 hover:bg-blue-50 cursor-pointer text-sm font-bold text-slate-700 border-b border-slate-50 last:border-0" 
                                onClick={() => { addStudentToFilter(name); setShowSuggestions(false); }}
                            >
                                {name}
                            </div>
                        ))
                    }
                </div>
            )}

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
                  <th className={`p-3 border-e border-slate-300 bg-[#FFD966] whitespace-nowrap ${filterMode === 'specific_names' ? 'w-28' : 'min-w-[200px]'}`}>اسم الطالب</th>
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
                {filteredData.map((s, idx) => {
                  // Determine display name format based on filter mode
                  const displayName = useMemo(() => {
                      if (filterMode === 'specific_names') {
                          const parts = s.name.trim().split(/\s+/);
                          if (parts.length > 2) {
                              return `${parts[0]} ${parts[1]} ${parts[parts.length - 1]}`;
                          }
                          return s.name;
                      }
                      return s.name;
                  }, [s.name, filterMode]);

                  return (
                  <tr key={s.id} className="hover:bg-slate-50">
                     <td className={`p-2 border-e bg-white flex items-center gap-1 group-hover:bg-slate-50 whitespace-nowrap ${filterMode === 'specific_names' ? 'w-28' : 'min-w-[200px]'}`}>
                        <div className="flex flex-col gap-0.5">
                           <button onClick={() => toggleStar(s.id, 'isExcellent')}><Star size={12} className={s.isExcellent ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}/></button>
                           <button onClick={() => toggleStar(s.id, 'isBlacklisted')}><AlertCircle size={12} className={s.isBlacklisted ? "text-red-600" : "text-slate-300"}/></button>
                        </div>
                        <input 
                            className="w-full text-xs font-bold bg-transparent outline-none" 
                            value={displayName} 
                            onChange={(e) => updateStudent(s.id, 'name', e.target.value)} 
                            placeholder="الاسم..."
                            disabled={filterMode === 'specific_names'} 
                            title={filterMode === 'specific_names' ? s.name : ''}
                        />
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
                )})}
             </tbody>
          </table>
        </div>
      </div>
      
      {/* ... Modals (kept same) ... */}
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
