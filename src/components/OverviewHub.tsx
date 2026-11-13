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
      {/* 2-Column Stretched Field Console Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 console-panel overflow-hidden flex flex-col justify-between">
          <div className="topographic-scale" aria-hidden="true" />
          <div className="p-6 sm:p-8 flex flex-col justify-between gap-6 flex-1">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#84cc16]">
                <span>المنصة الجزائرية للهندسة المدنية</span>
                <span aria-hidden="true" className="text-[#728879]">·</span>
                <span className="text-[#b7c9bc]">تعمل دون اتصال بالإنترنت</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight text-[#f4f7f2] [text-wrap:balance]">
                حاسبات ميدانية دقيقة بأي وحدة قياس، مدعومة برسومات هندسية وخريطة 58 ولاية
              </h1>

              <p className="text-sm sm:text-base leading-relaxed text-[#b7c9bc] max-w-2xl">
                صُممت لتسهيل عمل المهندس المدني والمقاول في الورشة: أدخل القياسات بالمتر أو السنتيمتر أو المليمتر مباشرة، شاهد المخططات الهندسية الحية، قدّر التكاليف بالدينار، وحدد أقرب محجرة لمشروعك.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenStructuralTool('concrete')}
                className="btn-kiwi inline-flex min-h-[46px] items-center gap-2 px-5 py-2.5 text-sm cursor-pointer"
              >
                <Box className="h-4 w-4 shrink-0" />
                <span>ابدأ الحساب الآن</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('quarries')}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-[12px] border border-white/[0.12] bg-[#141d18] px-5 py-2.5 text-sm font-bold text-[#f4f7f2] hover:border-[#84cc16]/50 hover:text-[#a3e635] transition-colors duration-200 cursor-pointer"
              >
                <MapPin className="h-4 w-4 text-[#84cc16] shrink-0" />
                <span>خريطة المحاجر والـ GPS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hero Blueprint Media Frame */}
        <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-[320px] overflow-hidden rounded-[14px] border border-[#84cc16]/25 bg-[#070b09]">
          <img
            src={heroImage}
            alt="نموذج هندسي ثلاثي الأبعاد لجسر خرساني ومسار طريق بخطوط تخطيط خضراء"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080c0a] via-[#080c0a]/35 to-transparent" />
          <div className="absolute bottom-4 right-4 left-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[#84cc16]">رسومات هندسية تفاعلية</div>
              <div className="text-sm font-bold text-[#f4f7f2]">معاينة فورية للمقاطع والكميات</div>
            </div>
            <span className="font-mono-tabular text-xs font-bold text-[#f59e0b] whitespace-nowrap shrink-0" dir="ltr">
              CBA 93 · RPA · B40
            </span>
          </div>
        </div>
      </section>

      {/* Unified 4-Column Telemetry Capability Strip */}
      <section aria-label="ملخص قدرات المنصة" className="telemetry-strip">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.08]">
          <div className="telemetry-cell p-4 sm:p-5">
            <div className="text-xs text-[#b7c9bc]">التغطية الجغرافية</div>
            <div className="mt-1.5 font-mono-tabular text-2xl sm:text-3xl font-extrabold text-[#84cc16]">58</div>
            <div className="mt-0.5 text-xs text-[#b7c9bc]">ولاية جزائرية رسمية</div>
          </div>
          <div className="telemetry-cell p-4 sm:p-5">
            <div className="text-xs text-[#b7c9bc]">قاعدة بيانات المواد</div>
            <div className="mt-1.5 font-mono-tabular text-2xl sm:text-3xl font-extrabold text-[#f59e0b]">
              {ALGERIAN_QUARRIES.length}
            </div>
            <div className="mt-0.5 text-xs text-[#b7c9bc]">محجرة ومصنع إسمنت ورمل</div>
          </div>
          <div className="telemetry-cell p-4 sm:p-5">
            <div className="text-xs text-[#b7c9bc]">المرونة القياسية</div>
            <div className="mt-1.5 font-mono-tabular text-2xl sm:text-3xl font-extrabold text-[#f4f7f2]">7+</div>
            <div className="mt-0.5 text-xs text-[#b7c9bc]">وحدات (م · سم · ملم · قدم · قنطار)</div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('boq')}
            className="telemetry-cell p-4 sm:p-5 text-right hover:bg-[#141d18] transition-colors duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-[#b7c9bc]">
              <span>كشف الكميات المحفوظ</span>
              <ClipboardList className="h-4 w-4 text-[#84cc16]" />
            </div>
            <div className="mt-1.5 font-mono-tabular text-2xl sm:text-3xl font-extrabold text-[#84cc16]">
              {savedCount} <span className="text-xs font-normal text-[#b7c9bc]">بند</span>
            </div>
            <div className="mt-0.5 font-mono-tabular text-xs font-semibold text-[#f59e0b]">
              {totalEstimatedDzd > 0 ? formatDzd(totalEstimatedDzd) : 'اضغط لفتح الكشف'}
            </div>
          </button>
        </div>
      </section>

      {/* Structured 6-Tool Engineering Console Grid */}
      <section aria-labelledby="workspace-tools-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div>
            <h2 id="workspace-tools-heading" className="text-xl font-bold text-[#f4f7f2]">
              مساحة العمل الهندسية
            </h2>
            <p className="text-xs text-[#b7c9bc]">
              اختر الأداة المطلوبة للانتقال مباشرة إلى الحاسبة والرسومات التوضيحية الخاصة بها
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaceTools.map((tool, index) => (
            <button
              key={tool.id}
              type="button"
              onClick={tool.onClick}
              className="group console-panel p-5 text-right transition-all duration-200 hover:border-[#84cc16]/55 cursor-pointer flex flex-col justify-between gap-4 min-h-[144px]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-[12px] border ${
                        tool.accent === 'kiwi'
                          ? 'border-[#84cc16]/25 bg-[#84cc16]/12 text-[#84cc16]'
                          : 'border-[#f59e0b]/25 bg-[#f59e0b]/12 text-[#f59e0b]'
                      }`}
                    >
                      {tool.icon}
                    </span>
                    <span className="font-mono-tabular text-xs font-bold text-[#728879]">
                      {String(index + 1).padStart(2, '0')}.
                    </span>
                  </div>
                  <ArrowUpLeft className="h-4 w-4 text-[#728879] group-hover:text-[#84cc16] transition-colors duration-200" />
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-[#84cc16]">{tool.subtitle}</div>
                  <h3 className="mt-0.5 text-base font-bold text-[#f4f7f2]">{tool.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#b7c9bc]">{tool.detail}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Algerian Civil Engineering Technical Specification Plate */}
      <section aria-labelledby="dz-standards-heading" className="console-panel overflow-hidden">
        <div className="topographic-scale" aria-hidden="true" />
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#84cc16]/25 bg-[#84cc16]/12 text-[#84cc16]">
            <BookOpen className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 id="dz-standards-heading" className="text-base sm:text-lg font-bold text-[#f4f7f2]">
              المرجع السريع للمعايير الهندسية الجزائرية (RPA / CBA 93 / B40)
            </h2>
            <p className="text-xs text-[#b7c9bc]">
              قيم مرجعية سريعة للمهندس في الموقع دون الحاجة للبحث في الكتيبات
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.08]">
          {ALGERIAN_ENGINEERING_STANDARDS.map((std) => (
            <div key={std.id} className="telemetry-cell p-5 space-y-1.5">
              <div className="text-[11px] font-mono-tabular font-bold text-[#f59e0b]" dir="ltr">
                {std.code}
              </div>
              <div className="text-xs font-bold text-[#f4f7f2]">{std.title}</div>
              <div className="font-mono-tabular text-base font-extrabold text-[#84cc16]">{std.value}</div>
              <p className="text-[11px] leading-relaxed text-[#b7c9bc]">{std.note}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
