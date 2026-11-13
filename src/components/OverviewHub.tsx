import React from 'react';
import {
  Box,
  Layers,
  Grid2X2,
  Route,
  MapPin,
  ArrowLeftRight,
  ClipboardList,
  ArrowUpLeft,
  BookOpen,
} from 'lucide-react';
import type { AppTab } from './Header';
import {
  ALGERIAN_ENGINEERING_STANDARDS,
  formatDzd,
} from '../utils/calculators.engine';
import { ALGERIAN_QUARRIES } from '../data/quarries';
import heroImage from '../assets/images/kiwi_civil_hero_1794579038140.jpg';

export type StructuralToolFocus = 'concrete' | 'rebar' | 'masonry' | 'converter';

interface OverviewHubProps {
  onNavigateTab: (tab: AppTab) => void;
  onOpenStructuralTool: (tool: StructuralToolFocus) => void;
  savedCount: number;
  totalEstimatedDzd: number;
}

export const OverviewHub: React.FC<OverviewHubProps> = ({
  onNavigateTab,
  onOpenStructuralTool,
  savedCount,
  totalEstimatedDzd,
}) => {
  const workspaceTools: {
    id: string;
    title: string;
    subtitle: string;
    detail: string;
    icon: React.ReactNode;
    accent: 'kiwi' | 'amber';
    onClick: () => void;
  }[] = [
    {
      id: 'tool-concrete',
      title: 'حاسبة الخرسانة والخلطة',
      subtitle: 'بلاطات · أعمدة · أساسات',
      detail: 'أدخل الأبعاد بالمتر أو السنتيمتر أو الملم مع مخطط 3D وتقدير التكلفة بالدينار.',
      icon: <Box className="h-5 w-5" />,
      accent: 'kiwi',
      onClick: () => onOpenStructuralTool('concrete'),
    },
    {
      id: 'tool-rebar',
      title: 'حديد التسليح والأطوال',
      subtitle: 'T6 إلى T32 · قضبان 12م',
      detail: 'حساب الوزن بالكغ والقنطار والطن مع رسم المقطع العرضي ومخطط التقطيع.',
      icon: <Layers className="h-5 w-5" />,
      accent: 'amber',
      onClick: () => onOpenStructuralTool('rebar'),
    },
    {
      id: 'tool-masonry',
      title: 'البناء والآجر والمونة',
      subtitle: '8/12/16 ثقوب · بلوك 15/20',
      detail: 'رسم تفاعلي للجدار مع خصم الأبواب والنوافذ وحساب الرمل والإسمنت.',
      icon: <Grid2X2 className="h-5 w-5" />,
      accent: 'kiwi',
      onClick: () => onOpenStructuralTool('masonry'),
    },
    {
      id: 'tool-roads',
      title: 'تصميم الطرقات والحفر والردم',
      subtitle: 'معايير B40 · Profil en Long',
      detail: 'تحليل الميول بين نقطتين، مثلث الانحدار، والمقطع الطولي والجانبي للأتربة.',
      icon: <Route className="h-5 w-5" />,
      accent: 'amber',
      onClick: () => onNavigateTab('roads'),
    },
    {
      id: 'tool-quarries',
      title: 'خريطة المحاجر ومصانع الإسمنت',
      subtitle: `58 ولاية · ${ALGERIAN_QUARRIES.length} موقعاً`,
      detail: 'التقاط الموقع عبر GPS وحساب أقرب محجرة رمل أو حصى أو إسمنت بـ Haversine.',
      icon: <MapPin className="h-5 w-5" />,
      accent: 'kiwi',
      onClick: () => onNavigateTab('quarries'),
    },
    {
      id: 'tool-converter',
      title: 'محول الوحدات الهندسية الشامل',
      subtitle: 'م · سم · ملم · قنطار · MPa',
      detail: 'تحويل لحظي للأطوال والمساحات والأحجام والأوزان وإجهاد الخرسانة fc28.',
      icon: <ArrowLeftRight className="h-5 w-5" />,
      accent: 'amber',
      onClick: () => onOpenStructuralTool('converter'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* 2-Column Stretched Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 glass-surface rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#a3e635] font-semibold">
              <span>المنصة الجزائرية للهندسة المدنية</span>
              <span aria-hidden="true" className="text-[#6b7f70]">·</span>
              <span className="text-[#a3b8a8]">تعمل دون اتصال بالإنترنت</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight text-white [text-wrap:balance]">
              حاسبات ميدانية دقيقة بأي وحدة قياس، مدعومة برسومات هندسية وخريطة 58 ولاية
            </h1>

            <p className="text-sm sm:text-base leading-relaxed text-[#a3b8a8] max-w-2xl">
              صُممت لتسهيل عمل المهندس المدني والمقاول في الورشة: أدخل القياسات بالمتر أو السنتيمتر أو المليمتر مباشرة، شاهد المخططات الهندسية الحية، قدّر التكاليف بالدينار، وحدد أقرب محجرة لمشروعك.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenStructuralTool('concrete')}
              className="btn-kiwi inline-flex min-h-[46px] items-center gap-2 rounded-xl px-5 py-2.5 text-sm cursor-pointer"
            >
              <Box className="h-4 w-4" />
              <span>ابدأ الحساب الآن</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('quarries')}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-[#84cc16]/30 bg-[#1a261e] px-5 py-2.5 text-sm font-bold text-[#d9f99d] hover:border-[#84cc16]/60 transition-colors cursor-pointer"
            >
              <MapPin className="h-4 w-4 text-[#a3e635]" />
              <span>خريطة المحاجر والـ GPS</span>
            </button>
          </div>
        </div>

        {/* Hero Visual Panel */}
        <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-[320px] overflow-hidden rounded-2xl border border-[#84cc16]/25 bg-[#090e0b]">
          <img
            src={heroImage}
            alt="نموذج هندسي ثلاثي الأبعاد لجسر خرساني ومسار طريق بخطوط تخطيط خضراء"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b110d] via-[#0b110d]/35 to-transparent" />
          <div className="absolute bottom-4 right-4 left-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[#a3e635]">رسومات هندسية تفاعلية</div>
              <div className="text-sm font-bold text-white">معاينة فورية للمقاطع والكميات</div>
            </div>
            <span className="font-mono-tabular text-xs font-bold text-[#fbbf24] whitespace-nowrap shrink-0" dir="ltr">
              CBA 93 · RPA · B40
            </span>
          </div>
        </div>
      </section>

      {/* Full-Width 4-Column Quantitative Strip */}
      <section aria-label="ملخص قدرات المنصة" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="glass-surface rounded-2xl p-4">
          <div className="text-xs text-[#a3b8a8]">التغطية الجغرافية</div>
          <div className="mt-1 font-mono-tabular text-2xl font-extrabold text-[#a3e635]">58</div>
          <div className="text-xs text-[#c5d6c9]">ولاية جزائرية رسمية</div>
        </div>
        <div className="glass-surface rounded-2xl p-4">
          <div className="text-xs text-[#a3b8a8]">قاعدة بيانات المواد</div>
          <div className="mt-1 font-mono-tabular text-2xl font-extrabold text-[#f59e0b]">
            {ALGERIAN_QUARRIES.length}
          </div>
          <div className="text-xs text-[#c5d6c9]">محجرة ومصنع إسمنت ورمل</div>
        </div>
        <div className="glass-surface rounded-2xl p-4">
          <div className="text-xs text-[#a3b8a8]">المرونة القياسية</div>
          <div className="mt-1 font-mono-tabular text-2xl font-extrabold text-white">7+</div>
          <div className="text-xs text-[#c5d6c9]">وحدات (م · سم · ملم · قدم · قنطار)</div>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('boq')}
          className="glass-surface rounded-2xl p-4 text-right hover:border-[#84cc16]/45 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#a3b8a8]">
            <span>كشف الكميات المحفوظ</span>
            <ClipboardList className="h-4 w-4 text-[#a3e635]" />
          </div>
          <div className="mt-1 font-mono-tabular text-2xl font-extrabold text-[#a3e635]">
            {savedCount} <span className="text-xs font-normal text-[#a3b8a8]">بند</span>
          </div>
          <div className="font-mono-tabular text-xs text-[#fbbf24]">
            {totalEstimatedDzd > 0 ? formatDzd(totalEstimatedDzd) : 'اضغط لفتح الكشف'}
          </div>
        </button>
      </section>

      {/* Structured 6-Tool Workspace Grid */}
      <section aria-labelledby="workspace-tools-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="workspace-tools-heading" className="text-xl font-bold text-white">
              مساحة العمل الهندسية
            </h2>
            <p className="text-xs text-[#a3b8a8]">
              اختر الأداة المطلوبة للانتقال مباشرة إلى الحاسبة والرسومات التوضيحية الخاصة بها
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaceTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={tool.onClick}
              className="group glass-surface rounded-2xl p-5 text-right transition-all hover:border-[#84cc16]/50 hover:bg-[#17231b] cursor-pointer flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      tool.accent === 'kiwi'
                        ? 'bg-[#84cc16]/15 text-[#a3e635]'
                        : 'bg-[#f59e0b]/15 text-[#fbbf24]'
                    }`}
                  >
                    {tool.icon}
                  </span>
                  <ArrowUpLeft className="h-4 w-4 text-[#6b7f70] group-hover:text-[#a3e635] transition-colors" />
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-[#a3e635]">{tool.subtitle}</div>
                  <h3 className="mt-0.5 text-base font-bold text-white">{tool.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#a3b8a8]">{tool.detail}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Algerian Civil Engineering Quick Standards Reference */}
      <section aria-labelledby="dz-standards-heading" className="glass-surface rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#84cc16]/15 text-[#a3e635]">
            <BookOpen className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 id="dz-standards-heading" className="text-base sm:text-lg font-bold text-white">
              المرجع السريع للمعايير الهندسية الجزائرية (RPA / CBA 93 / B40)
            </h2>
            <p className="text-xs text-[#a3b8a8]">
              قيم مرجعية سريعة للمهندس في الموقع دون الحاجة للبحث في الكتيبات
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {ALGERIAN_ENGINEERING_STANDARDS.map((std) => (
            <div key={std.id} className="rounded-xl border border-white/[0.08] bg-[#0b110d]/85 p-4 space-y-1.5">
              <div className="text-[11px] font-mono-tabular font-semibold text-[#fbbf24]" dir="ltr">
                {std.code}
              </div>
              <div className="text-xs font-bold text-white">{std.title}</div>
              <div className="font-mono-tabular text-base font-extrabold text-[#a3e635]">{std.value}</div>
              <p className="text-[11px] leading-relaxed text-[#a3b8a8]">{std.note}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
