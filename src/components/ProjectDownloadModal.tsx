import React from 'react';
import { Download, FolderArchive, FileCode2, X, FolderTree } from 'lucide-react';

interface ProjectDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ORGANIZED_TREE = [
  'index.html — نقطة الدخول الرئيسية RTL + خطوط Tajawal',
  'package.json / vite.config.ts — إعدادات Vite + PWA',
  'public/icon.svg & public/*.png — أيقونات التطبيق والهاتف',
  'src/assets/css/main.theme.css — نظام ألوان Midnight Slate وKiwi & Mango',
  'src/data/wilayat.ts — قاعدة بيانات 58 ولاية جزائرية',
  'src/data/quarries.ts — قاعدة 32 محجرة ومصنع إسمنت جزائري',
  'src/utils/gps.locator.ts — تحديد الموقع GPS ومعادلة Haversine',
  'src/utils/calculators.engine.ts — محرك حاسبات الخرسانة، الحديد، البناء، والطرقات',
  'src/components/* — واجهات الخريطة، المصفوفة، والحاسبات الهندسية',
];

export const ProjectDownloadModal: React.FC<ProjectDownloadModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-sm"
    >
      <div className="glass-surface w-full max-w-xl rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff9f1c]/15 text-[#ff9f1c]">
              <FolderArchive className="h-5 w-5" />
            </span>
            <div>
              <h2 id="download-modal-title" className="text-base sm:text-lg font-bold text-white">
                تنزيل حزم ملفات DZ Civil Pro Ultimate
              </h2>
              <p className="text-xs text-slate-400">
                ملفات مضغوطة ومرتبة جاهزة للتحميل المباشر على الهاتف أو الحاسوب
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة التحميل"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Option 1: Production Web Build (dist) */}
          <div className="rounded-2xl border border-[#2ec4b6]/35 bg-[#0f1419]/90 p-4 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-[#2ec4b6]">
                النسخة الجاهزة للرفع المباشر
              </div>
              <h3 className="text-sm font-bold text-white">
                حزمة الموقع المجمّعة (Web Build)
              </h3>
              <p className="text-xs leading-relaxed text-slate-400">
                تحتوي على <span className="font-mono-tabular text-slate-300">index.html</span> و
                <span className="font-mono-tabular text-slate-300">manifest.json</span> و
                <span className="font-mono-tabular text-slate-300">sw.service.worker.js</span>.
                تُرفع مباشرة إلى الاستضافة أو Netlify Drop دون الحاجة إلى Node.js.
              </p>
            </div>
            <a
              href="/downloads/dz-civil-pro-dist.zip"
              download="dz-civil-pro-dist.zip"
              className="btn-kiwi inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>تحميل نسخة الرفع (ZIP)</span>
            </a>
          </div>

          {/* Option 2: Organized Source Code */}
          <div className="rounded-2xl border border-[#ff9f1c]/35 bg-[#0f1419]/90 p-4 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-[#ff9f1c]">
                الكود المصدري المرتّب
              </div>
              <h3 className="text-sm font-bold text-white">
                حزمة التطوير الكاملة (Source)
              </h3>
              <p className="text-xs leading-relaxed text-slate-400">
                تضم كامل المجلدات المنظمة (<span className="font-mono-tabular text-slate-300">src/data</span>،{' '}
                <span className="font-mono-tabular text-slate-300">src/utils</span>،{' '}
                <span className="font-mono-tabular text-slate-300">src/components</span>) جاهزة
                للتعديل أو الرفع إلى GitHub وVercel.
              </p>
            </div>
            <a
              href="/downloads/dz-civil-pro-source.zip"
              download="dz-civil-pro-source.zip"
              className="btn-mango inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm"
            >
              <FileCode2 className="h-4 w-4 shrink-0" />
              <span>تحميل الكود المصدري (ZIP)</span>
            </a>
          </div>
        </div>

        {/* Organized Project File Tree */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0f1419]/70 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <FolderTree className="h-4 w-4 text-[#2ec4b6]" />
            <span>هيكلة الملفات المنظمة داخل الحزمة</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
            {ORGANIZED_TREE.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="text-[#ff9f1c]" aria-hidden="true">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
