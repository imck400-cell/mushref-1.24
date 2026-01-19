import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from '../context/GlobalState';
import { 
  Download, Upload, History, AlertTriangle, FileJson, 
  Save, RefreshCw, Check, X, Database, ShieldCheck, 
  FileOutput, School, User, FileText, Trash2, ArrowRightLeft
} from 'lucide-react';
import { AppData } from '../types';

interface BackupVersion {
  id: string;
  serial: number;
  date: string;
  note: string;
  data: string; // Serialized AppData
}

export const DataManagementModal: React.FC = () => {
  const { data, lang } = useGlobal();
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'archive'>('export');
  const [backups, setBackups] = useState<BackupVersion[]>([]);
  
  // Export States
  const [exportMode, setExportMode] = useState<'all' | 'teacher' | 'school' | 'type'>('all');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedType, setSelectedType] = useState<keyof AppData | ''>('');

  // Import States
  const [dragActive, setDragActive] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Load backups on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('app_history_backups');
      if (stored) {
        setBackups(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load backups", e);
    }
  }, []);

  // Helpers
  const uniqueTeachers = useMemo(() => {
    const names = new Set<string>();
    data.dailyReports.forEach(r => r.teachersData.forEach(t => names.add(t.teacherName)));
    return Array.from(names).filter(Boolean);
  }, [data]);

  // --- EXPORT LOGIC ---
  const handleExport = () => {
    let exportData: Partial<AppData> = {};
    const timestamp = new Date().toISOString().split('T')[0];
    let filename = `rafiquk_backup_${timestamp}.json`;

    if (exportMode === 'all') {
      exportData = { ...data };
    } else if (exportMode === 'school') {
      // Technically same as all for this single-tenant app, but conceptually specific
      exportData = { ...data };
      filename = `school_${data.profile.schoolName || 'data'}_${timestamp}.json`;
    } else if (exportMode === 'teacher') {
      if (!selectedTeacher) return alert('Please select a teacher');
      // Filter reports for this teacher
      const filteredReports = data.dailyReports.map(r => ({
        ...r,
        teachersData: r.teachersData.filter(t => t.teacherName === selectedTeacher)
      })).filter(r => r.teachersData.length > 0);
      
      exportData = {
        ...data,
        dailyReports: filteredReports,
        // Reset others to empty to avoid confusion or keep common data? 
        // Prompt implies "transfer specific teacher data". We keep common data (profile) but filter lists.
        substitutions: data.substitutions.filter(s => s.absentTeacher === selectedTeacher || s.replacementTeacher === selectedTeacher),
        teacherFollowUps: data.teacherFollowUps.filter(t => t.teacherName === selectedTeacher),
        studentReports: [], // Irrelevant for teacher export usually
        violations: [] 
      };
      filename = `teacher_${selectedTeacher}_${timestamp}.json`;
    } else if (exportMode === 'type') {
      if (!selectedType) return alert('Please select a type');
      exportData = {
        profile: data.profile, // Always keep profile context
        [selectedType]: data[selectedType as keyof AppData]
      } as any;
      filename = `${selectedType}_${timestamp}.json`;
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- IMPORT & ARCHIVE LOGIC ---
  const performArchive = () => {
    try {
      const currentRaw = localStorage.getItem('rafiquk_data');
      if (!currentRaw) return; // Nothing to backup

      const newBackup: BackupVersion = {
        id: Date.now().toString(),
        serial: backups.length + 1,
        date: new Date().toLocaleString('en-GB'), // Fixed format
        note: `Backup before import/restore`,
        data: currentRaw
      };

      const updatedBackups = [newBackup, ...backups].slice(0, 5); // FIFO: Keep max 5
      localStorage.setItem('app_history_backups', JSON.stringify(updatedBackups));
      setBackups(updatedBackups);
      return true;
    } catch (e) {
      console.error("Archiving failed", e);
      alert("فشل إنشاء نسخة احتياطية. تم إلغاء العملية.");
      return false;
    }
  };

  const processImport = (fileContent: string) => {
    try {
      // 1. Validate JSON
      const parsed = JSON.parse(fileContent);
      if (!parsed || typeof parsed !== 'object') throw new Error("Invalid JSON");

      // 2. Archive Current Data
      if (!performArchive()) return;

      // 3. Smart Clear (Don't kill backups)
      // We only strictly replace 'rafiquk_data'. No need to clear() everything if we key-value manage.
      // But to be safe per prompt "Clear current data except backup array":
      const backupStr = localStorage.getItem('app_history_backups');
      localStorage.clear(); 
      if (backupStr) localStorage.setItem('app_history_backups', backupStr);
      
      // 4. Save New Data
      // Merge with default structure to ensure missing fields don't break app
      localStorage.setItem('rafiquk_data', JSON.stringify(parsed));

      // 5. Reload
      window.location.reload();

    } catch (e) {
      setImportError("الملف تالف أو غير صالح للاستخدام");
    }
  };

  const handleRestore = (backup: BackupVersion) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من استعادة هذه النسخة؟ سيتم أرشفة البيانات الحالية أولاً.' : 'Are you sure? Current data will be archived.')) {
        if (!performArchive()) return;
        
        // Restore logic
        localStorage.setItem('rafiquk_data', backup.data);
        window.location.reload();
    }
  };

  // Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else if (e.type === "dragleave") setDragActive(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };
  const handleFile = (file: File) => {
    if (file.type !== "application/json") return setImportError("يجب اختيار ملف JSON فقط");
    setImportFile(file);
    setImportError(null);
  };
  const confirmImport = () => {
    if (!importFile) return;
    const reader = new FileReader();
    reader.onload = (e) => processImport(e.target?.result as string);
    reader.readAsText(importFile);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden min-h-[600px] flex flex-col font-arabic">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h2 className="text-2xl font-black flex items-center gap-3">
             <Database className="text-blue-400" />
             {lang === 'ar' ? 'إدارة البيانات والأرشفة الذكية' : 'Data Management & Smart Archiving'}
           </h2>
           <p className="text-slate-400 text-sm mt-1 font-bold">
             {lang === 'ar' ? 'نظام النسخ الاحتياطي التلقائي والنقل الآمن للبيانات' : 'Automatic backup system and secure data transfer'}
           </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center md:justify-end">
            <button onClick={() => setActiveTab('export')} className={`px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'export' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{lang === 'ar' ? 'تصدير' : 'Export'}</button>
            <button onClick={() => setActiveTab('import')} className={`px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'import' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{lang === 'ar' ? 'استيراد' : 'Import'}</button>
            <button onClick={() => setActiveTab('archive')} className={`px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'archive' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{lang === 'ar' ? 'الأرشيف' : 'Archives'}</button>
        </div>
      </div>

      <div className="p-8 flex-1 bg-slate-50">
        
        {/* --- EXPORT TAB --- */}
        {activeTab === 'export' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button onClick={() => setExportMode('all')} className={`p-6 rounded-2xl border-2 text-right transition-all group ${exportMode === 'all' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className={`p-3 rounded-full ${exportMode === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}><Database size={24}/></div>
                        {exportMode === 'all' && <CheckCircleIcon />}
                    </div>
                    <h3 className="font-black text-lg text-black mb-1">تصدير شامل</h3>
                    <p className="text-xs font-bold text-black opacity-60">نسخة كاملة لجميع بيانات البرنامج (موصى به)</p>
                 </button>

                 <button onClick={() => setExportMode('school')} className={`p-6 rounded-2xl border-2 text-right transition-all group ${exportMode === 'school' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className={`p-3 rounded-full ${exportMode === 'school' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}><School size={24}/></div>
                        {exportMode === 'school' && <CheckCircleIcon />}
                    </div>
                    <h3 className="font-black text-lg text-black mb-1">تصدير لمدرسة محددة</h3>
                    <p className="text-xs font-bold text-black opacity-60">نقل بيانات المدرسة الحالية مع معلميها</p>
                 </button>

                 <button onClick={() => setExportMode('teacher')} className={`p-6 rounded-2xl border-2 text-right transition-all group ${exportMode === 'teacher' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className={`p-3 rounded-full ${exportMode === 'teacher' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}><User size={24}/></div>
                        {exportMode === 'teacher' && <CheckCircleIcon />}
                    </div>
                    <h3 className="font-black text-lg text-black mb-1">تصدير لمعلم محدد</h3>
                    <p className="text-xs font-bold text-black opacity-60">ملف خاص يحتوي تقارير معلم واحد فقط</p>
                 </button>

                 <button onClick={() => setExportMode('type')} className={`p-6 rounded-2xl border-2 text-right transition-all group ${exportMode === 'type' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className={`p-3 rounded-full ${exportMode === 'type' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}><FileOutput size={24}/></div>
                        {exportMode === 'type' && <CheckCircleIcon />}
                    </div>
                    <h3 className="font-black text-lg text-black mb-1">تصدير حسب نوع العمل</h3>
                    <p className="text-xs font-bold text-black opacity-60">تصفية البيانات (تعهدات، طلاب، غياب...)</p>
                 </button>
             </div>

             {/* Dynamic Selection Area */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200">
                {exportMode === 'teacher' && (
                    <div className="animate-in fade-in">
                        <label className="block text-black font-black mb-2">اختر المعلم من القائمة:</label>
                        <select className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-black outline-none focus:border-blue-500" value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
                            <option value="">-- اختر المعلم --</option>
                            {uniqueTeachers.map(t => <option key={t} value={t} className="text-black">{t}</option>)}
                        </select>
                    </div>
                )}
                
                {exportMode === 'type' && (
                    <div className="animate-in fade-in">
                        <label className="block text-black font-black mb-2">اختر نوع البيانات:</label>
                        <select className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-black outline-none focus:border-blue-500" value={selectedType} onChange={e => setSelectedType(e.target.value as any)}>
                            <option value="">-- اختر النوع --</option>
                            <option value="studentReports" className="text-black">تقارير الطلاب</option>
                            <option value="dailyReports" className="text-black">متابعة المعلمين</option>
                            <option value="violations" className="text-black">التعهدات والمخالفات</option>
                            <option value="substitutions" className="text-black">تغطية الحصص</option>
                        </select>
                    </div>
                )}

                {(exportMode === 'all' || exportMode === 'school' || (exportMode === 'teacher' && selectedTeacher) || (exportMode === 'type' && selectedType)) && (
                    <button onClick={handleExport} className="w-full mt-4 bg-blue-600 text-white p-4 rounded-xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2">
                        <Download /> تحميل ملف البيانات (JSON)
                    </button>
                )}
             </div>
          </div>
        )}

        {/* --- IMPORT TAB --- */}
        {activeTab === 'import' && (
           <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
              <div 
                className={`relative border-4 border-dashed rounded-3xl p-10 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white'}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              >
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => e.target.files && handleFile(e.target.files[0])} accept=".json" />
                  
                  <div className="pointer-events-none">
                      <div className="mx-auto w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                          <Upload size={40} />
                      </div>
                      <h3 className="text-xl font-black text-black mb-2">اسحب وأفلت ملف البيانات هنا</h3>
                      <p className="text-black font-bold opacity-60">أو اضغط للاختيار من جهازك</p>
                  </div>
              </div>

              {importError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 font-bold animate-pulse">
                      <AlertTriangle /> {importError}
                  </div>
              )}

              {importFile && !importError && (
                  <div className="mt-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
                      <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-green-100 text-green-600 rounded-xl"><FileJson size={24}/></div>
                          <div>
                              <div className="font-black text-black text-lg">{importFile.name}</div>
                              <div className="text-xs font-bold text-black opacity-50">جاهز للاستيراد</div>
                          </div>
                      </div>
                      
                      <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
                          <h4 className="text-red-800 font-black flex items-center gap-2 mb-1"><ShieldCheck size={18}/> نظام الأمان النشط</h4>
                          <p className="text-red-700 text-xs font-bold">
                              سيقوم النظام بأرشفة البيانات الحالية تلقائياً قبل الاستيراد. لن تفقد بياناتك القديمة، ويمكنك استعادتها من تبويب "الأرشيف".
                          </p>
                      </div>

                      <button onClick={confirmImport} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2">
                          <RefreshCw className="animate-spin-slow" /> تنفيذ الاستيراد والدمج
                      </button>
                  </div>
              )}
           </div>
        )}

        {/* --- ARCHIVE TAB --- */}
        {activeTab === 'archive' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                {backups.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <History size={60} className="mx-auto mb-4 text-slate-300"/>
                        <h3 className="text-xl font-black text-slate-500">سجل الأرشيف فارغ</h3>
                        <p className="text-slate-400 font-bold">يتم إنشاء النسخ تلقائياً عند الاستيراد</p>
                    </div>
                ) : (
                    backups.map((backup) => (
                        <div key={backup.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-black text-lg">
                                    {backup.serial}
                                </div>
                                <div>
                                    <h4 className="font-black text-black text-lg">{backup.date}</h4>
                                    <p className="text-xs font-bold text-black opacity-50">{backup.note}</p>
                                    <div className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded mt-1 inline-block text-black">ID: {backup.id}</div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => handleRestore(backup)}
                                className="bg-slate-800 text-white px-6 py-3 rounded-xl font-black hover:bg-slate-900 shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                            >
                                <ArrowRightLeft size={18} /> استعادة هذه النسخة
                            </button>
                        </div>
                    ))
                )}
                {backups.length > 0 && (
                    <div className="text-center mt-8">
                        <p className="text-xs font-bold text-slate-400">نظام FIFO: يتم الاحتفاظ بآخر 5 نسخ فقط لضمان كفاءة التخزين</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

const CheckCircleIcon = () => <div className="text-blue-600"><CheckCircleFilled /></div>;
const CheckCircleFilled = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
);

export const SettingsPage: React.FC = () => {
    return (
        <div className="max-w-5xl mx-auto p-4">
            <DataManagementModal />
        </div>
    );
};