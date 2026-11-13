import React, { useMemo, useState } from 'react';
import { BookOpen, Search, ShieldCheck, Layers, Route, Ruler } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';

interface ExtendedStandardEntry {
  id: string;
  category: 'concrete' | 'seismic' | 'roads';
  code: string;
  title: string;
  valueDisplay: React.ReactNode;
  valueText: string;
  note: React.ReactNode;
  noteText: string;
  fieldChecklist: React.ReactNode[];
}

const REFERENCE_CATALOG: ExtendedStandardEntry[] = [
  {
    id: 'cover',
    category: 'seismic',
    code: 'CBA 93 / RPA',
    title: 'التغطية الخرسانية الدنيا (Enrobage)',
    valueDisplay: (
      <span>
        <bdi dir="ltr">2.5 – 5.0</bdi> سم
      </span>
    ),
    valueText: '2.5 – 5.0 سم',
    note: (
      <span>
        <bdi dir="ltr">2.5</bdi> سم للعناصر الداخلية، <bdi dir="ltr">3</bdi> سم للواجهات، و<bdi dir="ltr">5</bdi> سم للأساسات الملامسة للتربة مباشرة.
      </span>
    ),
    noteText: '2.5 سم للعناصر الداخلية، 3 سم للواجهات، و5 سم للأساسات الملامسة للتربة.',
    fieldChecklist: [
      <span>استخدم كراسي الفصل (<bdi dir="ltr">Cales à béton</bdi>) قبل صب العناصر الإنشائية.</span>,
      <span>تجنب ملامسة قضبان التسليح للتربة مباشرة في الأساسات (<bdi dir="ltr">5 سم</bdi> صافية).</span>,
    ],
  },
  {
    id: 'lap',
    category: 'seismic',
    code: 'RPA 99 / 2024',
    title: 'طول التراكب والتوصيل (Recouvrement)',
    valueDisplay: (
      <span>
        <bdi dir="ltr">40Ø – 50Ø</bdi>
      </span>
    ),
    valueText: '40Ø – 50Ø',
    note: (
      <span>
        <bdi dir="ltr">40</bdi> مرة القطر في المناطق العادية و<bdi dir="ltr">50Ø</bdi> في المناطق الزلزالية (<bdi dir="ltr">Zone IIb & III</bdi>).
      </span>
    ),
    noteText: '40 مرة القطر في المناطق العادية و50Ø في المناطق الزلزالية.',
    fieldChecklist: [
      <span>تجنب تجميع كافة وصلات التراكب في مقطع واحد (توزيع تبادلي).</span>,
      <span>تحقق من ربط نهايات التوصيل بأسلاك الربط المقاومة قبل الصب.</span>,
    ],
  },
  {
    id: 'fc28',
    category: 'concrete',
    code: 'B25 / CPJ 42.5',
    title: 'مقاومة الخرسانة المسلحة (fc28)',
    valueDisplay: (
      <span>
        <bdi dir="ltr">25 MPa</bdi> (<bdi dir="ltr">255 kg/cm²</bdi>)
      </span>
    ),
    valueText: '25 MPa (255 kg/cm²)',
    note: (
      <span>
        عيار <bdi dir="ltr">350 kg/m³</bdi> القياسي يحقق مقاومة <bdi dir="ltr">25 MPa</bdi> عند <bdi dir="ltr">28</bdi> يوماً مع نسبة ماء/إسمنت <bdi dir="ltr">E/C ≈ 0.50</bdi>.
      </span>
    ),
    noteText: 'عيار 350 كغ/م³ القياسي يحقق مقاومة 25 ميغاباسكال عند 28 يوماً.',
    fieldChecklist: [
      <span>استخدم إسمنت <bdi dir="ltr">CPJ 42.5</bdi> مع ركام نظيف ومغسول خالٍ من الطين.</span>,
      <span>الالتزام بمعالجة الخرسانة بالماء (<bdi dir="ltr">Cure</bdi>) لمدة لا تقل عن <bdi dir="ltr">7</bdi> أيام.</span>,
    ],
  },
  {
    id: 'b40',
    category: 'roads',
    code: 'B40 الطرقات',
    title: 'حدود الميول الطولية للطرق (B40)',
    valueDisplay: (
      <span>
        <bdi dir="ltr">0.5% – 7.0%</bdi>
      </span>
    ),
    valueText: '0.5% – 7.0%',
    note: (
      <span>
        أدنى ميل <bdi dir="ltr">0.5%</bdi> لتصريف المياه، مثالي <bdi dir="ltr">≤ 5%</bdi> للطرق الوطنية، وأقصى <bdi dir="ltr">10%</bdi> للمسالك الجبلية الوعرة.
      </span>
    ),
    noteText: 'أدنى ميل 0.5% لتصريف المياه، مثالي ≤5% للطرق الوطنية.',
    fieldChecklist: [
      <span>تأمين ميل عرضي (<bdi dir="ltr">Dévers</bdi>) لا يقل عن <bdi dir="ltr">2.5%</bdi> لتصريف مياه الأمطار.</span>,
      <span>مراعاة منحنيات الربط الرأسية (<bdi dir="ltr">Raccordement parabolique</bdi>) عند تغير الميل.</span>,
    ],
  },
  {
    id: 'mix_ratios',
    category: 'concrete',
    code: 'CPJ 42.5 / DOSAGE',
    title: 'معايرة خلطات الخرسانة الميدانية (1 م³)',
    valueDisplay: (
      <span>
        <bdi dir="ltr">350 kg</bdi> إسمنت · <bdi dir="ltr">400 L</bdi> رمل · <bdi dir="ltr">800 L</bdi> حصى
      </span>
    ),
    valueText: '350 كغ إسمنت · 400 لتر رمل · 800 لتر حصى',
    note: (
      <span>
        نسب الخلط الحجمية القياسية في الورشات الجزائرية لتحقيق توازن القوام وسهولة التشغيل (<bdi dir="ltr">Ouvrabilité</bdi>).
      </span>
    ),
    noteText: 'نسب الخلط الحجمية القياسية في الورشات الجزائرية.',
    fieldChecklist: [
      <span>خرسانة النظافة (<bdi dir="ltr">Béton de propreté</bdi>): عيار <bdi dir="ltr">150–250 kg/m³</bdi> بسمك <bdi dir="ltr">5–10 cm</bdi>.</span>,
      <span>الأعمدة والجدران المسلحة: عيار <bdi dir="ltr">350</bdi> إلى <bdi dir="ltr">400 kg/m³</bdi> مع هزاز ميكانيكي (<bdi dir="ltr">Vibreur</bdi>).</span>,
    ],
  },
  {
    id: 'seismic_zones',
    category: 'seismic',
    code: 'RPA 99 / 2024',
    title: 'المقاطع الدنيا للأعمدة في المناطق الزلزالية',
    valueDisplay: (
      <span>
        <bdi dir="ltr">25×25 cm</bdi> (المنطقة I) · <bdi dir="ltr">30×30 cm</bdi> (المنطقة IIa/IIb/III)
      </span>
    ),
    valueText: '25×25 سم (المنطقة I) · 30×30 سم (المنطقة IIa/IIb/III)',
    note: (
      <span>
        الأبعاد الدنيا المطلوبة وفق قواعد التصميم المقاوم للزلازل في الجزائر (<bdi dir="ltr">RPA</bdi>) لتجنب الانبعاج.
      </span>
    ),
    noteText: 'الأبعاد الدنيا المطلوبة وفق قواعد التصميم المقاوم للزلازل في الجزائر.',
    fieldChecklist: [
      <span>أدنى تسليح طولي للأعمدة: <bdi dir="ltr">0.7%</bdi> إلى <bdi dir="ltr">0.9%</bdi> من المقطع حسب المنطقة الزلزالية.</span>,
      <span>تضييق تباعد الأساور (<bdi dir="ltr">Cadres</bdi>) في منطقة العقد بمقدار <bdi dir="ltr">≤ 10 cm</bdi> أو <bdi dir="ltr">h/4</bdi>.</span>,
    ],
  },
  {
    id: 'earthworks_swell',
    category: 'roads',
    code: 'CTT / B40',
    title: 'معاملات الانتفاش والدمك للأتربة (Foisonnement)',
    valueDisplay: (
      <span>
        <bdi dir="ltr">1.15 – 1.35</bdi> حسب نوع التربة
      </span>
    ),
    valueText: '1.15 – 1.35 حسب نوع التربة',
    note: (
      <span>
        تُعتمد لتقدير حجم النقل بالشاحنات (<bdi dir="ltr">15 m³</bdi>) بعد الحفر مقارنة بالحجم المدموك بالموقع.
      </span>
    ),
    noteText: 'تُعتمد لتقدير حجم النقل بالشاحنات بعد الحفر مقارنة بالحجم المدموك.',
    fieldChecklist: [
      <span>التربة الرملية والحصوية: انتفاش <bdi dir="ltr">~ 1.10 – 1.15</bdi>.</span>,
      <span>الطين المتماسك والصخور المفككة: انتفاش من <bdi dir="ltr">1.25</bdi> إلى <bdi dir="ltr">1.35</bdi>.</span>,
    ],
  },
];

type RefFilter = 'all' | 'concrete' | 'seismic' | 'roads';

export const EngineeringReferencePanel: React.FC = () => {
  const [filter, setFilter] = useState<RefFilter>('all');
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REFERENCE_CATALOG.filter((item) => {
      if (filter !== 'all' && item.category !== filter) return false;
      if (!q) return true;
      return `${item.code} ${item.title} ${item.valueText} ${item.noteText}`.toLowerCase().includes(q);
    });
  }, [filter, query]);

  const filterTabs: { id: RefFilter; label: string }[] = [
    { id: 'all', label: 'الكل' },
    { id: 'concrete', label: 'الخرسانة والمواد' },
    { id: 'seismic', label: 'الزلازل RPA/CBA93' },
    { id: 'roads', label: 'الطرقات B40' },
  ];

  const getCategoryIcon = (cat: ExtendedStandardEntry['category']) => {
    if (cat === 'concrete') return <Layers className="h-4 w-4 text-[#84cc16]" />;
    if (cat === 'seismic') return <ShieldCheck className="h-4 w-4 text-[#f59e0b]" />;
    return <Route className="h-4 w-4 text-[#84cc16]" />;
  };

  return (
    <section aria-labelledby="eng-ref-heading" className="console-panel overflow-hidden">
      <div className="topographic-scale" aria-hidden="true" />
      <div className="p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[#84cc16]/25 bg-[#070b09] text-[#84cc16]">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <h1 id="eng-ref-heading" className="text-lg sm:text-xl font-bold text-[#f4f7f2]">
                المرجع الهندسي السريع (<bdi dir="ltr">RPA / CBA 93 / B40</bdi>)
              </h1>
              <p className="text-xs text-[#b7c9bc]">
                مواصفات ومعايير الورشات الجزائرية مرتبة في قوائم قابلة للطي لسرعة المراجعة الميدانية
              </p>
            </div>
          </div>
        </div>

        {/* Clean Search + Category Filter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
          <div className="lg:col-span-5 relative">
            <label htmlFor="ref-search" className="sr-only">
              ابحث في المعايير الهندسية
            </label>
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b7c9bc]" />
            <input
              id="ref-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن: تغطية، تراكب، fc28، ميل..."
              className="w-full min-h-[46px] rounded-[14px] border border-white/[0.09] bg-[#070b09] pr-10 pl-4 py-2 text-sm text-[#f4f7f2] placeholder:text-[#728879] outline-none focus:border-[#84cc16]"
            />
          </div>

          <div
            className="lg:col-span-7 flex flex-wrap gap-2"
            role="tablist"
            aria-label="تصنيف المعايير الهندسية"
          >
            {filterTabs.map((t) => {
              const active = filter === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(t.id)}
                  className={`min-h-[44px] rounded-[12px] px-4 py-2 text-xs font-bold transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#84cc16] text-[#060a05]'
                      : 'border border-white/[0.08] bg-[#070b09] text-[#b7c9bc] hover:text-[#f4f7f2]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Reference Accordions */}
        {filteredItems.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-white/10 bg-[#070b09] p-8 text-center space-y-2">
            <Ruler className="mx-auto h-7 w-7 text-[#728879]" />
            <div className="text-sm font-semibold text-[#f4f7f2]">
              لا توجد معايير مطابقة لبحثك
            </div>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilter('all');
              }}
              className="mt-2 inline-flex min-h-[44px] items-center rounded-[12px] border border-white/10 bg-[#0f1612] px-4 py-2 text-xs font-bold text-[#84cc16] cursor-pointer"
            >
              عرض جميع المعايير
            </button>
          </div>
        ) : (
          <div data-testid="engineering-reference-list" className="space-y-3">
            {filteredItems.map((item, idx) => (
              <CollapsibleSection
                key={item.id}
                title={item.title}
                subtitle={`${item.code} · ${item.valueText}`}
                badge={item.code}
                icon={getCategoryIcon(item.category)}
                defaultOpen={idx < 2}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-[#84cc16]/20 bg-[#0f1612] px-4 py-3">
                    <span className="text-xs text-[#b7c9bc]">القيمة المعتمدة في المرجع:</span>
                    <strong className="font-mono-tabular text-sm sm:text-base font-extrabold text-[#84cc16]">
                      {item.valueDisplay}
                    </strong>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-[#d4e2d7]">{item.note}</p>
                  <ul className="space-y-1.5 border-t border-white/[0.08] pt-3 text-xs text-[#b7c9bc]">
                    {item.fieldChecklist.map((tip, tipIdx) => (
                      <li key={tipIdx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f59e0b]" aria-hidden="true" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CollapsibleSection>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
