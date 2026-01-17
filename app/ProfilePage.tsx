
import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalState';
import { Save, Plus, Trash2, Building2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { data, updateData, lang } = useGlobal();
  const [profile, setProfile] = useState(data.profile);

  // Sync state with global data
  useEffect(() => {
    setProfile(data.profile);
  }, [data.profile]);

  const handleChange = (field: string, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCustomField = () => {
    const newField = { id: Date.now().toString(), label: '', value: '' };
    const currentFields = profile.customFields || [];
    handleChange('customFields', [...currentFields, newField]);
  };

  const updateCustomField = (id: string, key: 'label' | 'value', val: string) => {
    const currentFields = profile.customFields || [];
    const updated = currentFields.map(f => f.id === id ? { ...f, [key]: val } : f);
    handleChange('customFields', updated);
  };

  const removeCustomField = (id: string) => {
     const currentFields = profile.customFields || [];
     handleChange('customFields', currentFields.filter(f => f.id !== id));
  };

  const handleSave = () => {
     updateData({ profile });
     alert(lang === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');
  };

  return (
    <div className="space-y-6 font-arabic animate-in fade-in">
       <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center justify-between mb-8 border-b pb-4">
             <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                    <Building2 size={24}/>
                </div>
                {lang === 'ar' ? 'ملف المدرسة' : 'School Profile'}
             </h2>
             <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
                 <Save size={18} /> {lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Fields */}
              <div className="space-y-2">
                 <label className="text-sm font-black text-slate-600">وزارة التربية والتعليم والبحث العلمي</label>
                 <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 font-bold outline-none transition-all" value={profile.ministry || ''} onChange={e => handleChange('ministry', e.target.value)} placeholder="الوزارة..." />
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-black text-slate-600">المنطقة التعليمية</label>
                 <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 font-bold outline-none transition-all" value={profile.district || ''} onChange={e => handleChange('district', e.target.value)} placeholder="المنطقة..." />
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-black text-slate-600">اسم المدرسة</label>
                 <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 font-bold outline-none transition-all" value={profile.schoolName || ''} onChange={e => handleChange('schoolName', e.target.value)} />
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-black text-slate-600">الفرع</label>
                 <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 font-bold outline-none transition-all" value={profile.branch || ''} onChange={e => handleChange('branch', e.target.value)} />
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-black text-slate-600">العام الدراسي</label>
                 <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 font-bold outline-none transition-all" value={profile.year || ''} onChange={e => handleChange('year', e.target.value)} />
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-black text-slate-600">الفصل الدراسي</label>
                 <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 font-bold outline-none transition-all" value={profile.term || ''} onChange={e => handleChange('term', e.target.value)} />
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-black text-slate-600">مدير الفرع</label>
                 <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 font-bold outline-none transition-all" value={profile.branchManager || ''} onChange={e => handleChange('branchManager', e.target.value)} />
              </div>
               <div className="space-y-2">
                 <label className="text-sm font-black text-slate-600">المدير العام</label>
                 <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 font-bold outline-none transition-all" value={profile.generalManager || ''} onChange={e => handleChange('generalManager', e.target.value)} />
              </div>
               <div className="space-y-2">
                 <label className="text-sm font-black text-slate-600">المشرف الإداري</label>
                 <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 font-bold outline-none transition-all" value={profile.supervisorName || ''} onChange={e => handleChange('supervisorName', e.target.value)} />
              </div>
          </div>

          {/* Custom Fields */}
          <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-lg text-slate-700">بيانات إضافية</h3>
                  <button onClick={handleAddCustomField} className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition-colors">
                     <Plus size={16}/> إضافة بند جديد
                  </button>
              </div>
              <div className="space-y-3">
                  {profile.customFields?.map(field => (
                     <div key={field.id} className="flex gap-3 items-center animate-in slide-in-from-right-4 fade-in duration-300">
                         <input className="w-1/3 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-400 text-sm font-bold outline-none" placeholder="اسم الحقل (مثال: رقم الهاتف)" value={field.label} onChange={e => updateCustomField(field.id, 'label', e.target.value)} />
                         <input className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-400 text-sm font-bold outline-none" placeholder="القيمة" value={field.value} onChange={e => updateCustomField(field.id, 'value', e.target.value)} />
                         <button onClick={() => removeCustomField(field.id)} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18}/></button>
                     </div>
                  ))}
                  {(!profile.customFields || profile.customFields.length === 0) && (
                      <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          <p className="text-slate-400 text-sm font-bold">لا توجد حقول إضافية.. يمكنك إضافة بنود جديدة حسب الحاجة</p>
                      </div>
                  )}
              </div>
          </div>
       </div>
    </div>
  );
};
