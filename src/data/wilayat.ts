export interface Wilaya {
  code: string;
  arName: string;
  frName: string;
  lat: number;
  lng: number;
  region: string;
}

export const ALGERIAN_WILAYAT: Wilaya[] = [
  { code: '01', arName: 'أدرار', frName: 'Adrar', lat: 27.8742, lng: -0.2939, region: 'الجنوب الكبير' },
  { code: '02', arName: 'الشلف', frName: 'Chlef', lat: 36.1653, lng: 1.3345, region: 'شمال وسط' },
  { code: '03', arName: 'الأغواط', frName: 'Laghouat', lat: 33.8, lng: 2.8651, region: 'الهضاب العليا' },
  { code: '04', arName: 'أم البواقي', frName: 'Oum El Bouaghi', lat: 35.8754, lng: 7.1135, region: 'الشرق' },
  { code: '05', arName: 'باتنة', frName: 'Batna', lat: 35.5559, lng: 6.1741, region: 'الشرق' },
  { code: '06', arName: 'بجاية', frName: 'Béjaïa', lat: 36.7511, lng: 5.0567, region: 'شمال وسط' },
  { code: '07', arName: 'بسكرة', frName: 'Biskra', lat: 34.8481, lng: 5.7248, region: 'الزيبان' },
  { code: '08', arName: 'بشار', frName: 'Béchar', lat: 31.6167, lng: -2.2167, region: 'الجنوب الغربي' },
  { code: '09', arName: 'البليدة', frName: 'Blida', lat: 36.47, lng: 2.83, region: 'شمال وسط' },
  { code: '10', arName: 'البويرة', frName: 'Bouira', lat: 36.3749, lng: 3.902, region: 'شمال وسط' },
  { code: '11', arName: 'تمنراست', frName: 'Tamanrasset', lat: 22.785, lng: 5.5228, region: 'الجنوب الكبير' },
  { code: '12', arName: 'تبسة', frName: 'Tébessa', lat: 35.4042, lng: 8.1242, region: 'الشرق' },
  { code: '13', arName: 'تلمسان', frName: 'Tlemcen', lat: 34.8783, lng: -1.315, region: 'الغرب' },
  { code: '14', arName: 'تيارت', frName: 'Tiaret', lat: 35.371, lng: 1.317, region: 'الهضاب العليا' },
  { code: '15', arName: 'تيزي وزو', frName: 'Tizi Ouzou', lat: 36.7118, lng: 4.0459, region: 'شمال وسط' },
  { code: '16', arName: 'الجزائر', frName: 'Alger', lat: 36.7538, lng: 3.0588, region: 'شمال وسط' },
  { code: '17', arName: 'الجلفة', frName: 'Djelfa', lat: 34.6728, lng: 3.263, region: 'الهضاب العليا' },
  { code: '18', arName: 'جيجل', frName: 'Jijel', lat: 36.8205, lng: 5.7667, region: 'الشرق' },
  { code: '19', arName: 'سطيف', frName: 'Sétif', lat: 36.1911, lng: 5.4137, region: 'الشرق' },
  { code: '20', arName: 'سعيدة', frName: 'Saïda', lat: 34.8303, lng: 0.1517, region: 'الغرب' },
  { code: '21', arName: 'سكيكدة', frName: 'Skikda', lat: 36.8762, lng: 6.9092, region: 'الشرق' },
  { code: '22', arName: 'سيدي بلعباس', frName: 'Sidi Bel Abbès', lat: 35.1899, lng: -0.6308, region: 'الغرب' },
  { code: '23', arName: 'عنابة', frName: 'Annaba', lat: 36.9, lng: 7.7667, region: 'الشرق' },
  { code: '24', arName: 'قالمة', frName: 'Guelma', lat: 36.4621, lng: 7.4261, region: 'الشرق' },
  { code: '25', arName: 'قسنطينة', frName: 'Constantine', lat: 36.365, lng: 6.6147, region: 'الشرق' },
  { code: '26', arName: 'المدية', frName: 'Médéa', lat: 36.2642, lng: 2.7539, region: 'شمال وسط' },
  { code: '27', arName: 'مستغانم', frName: 'Mostaganem', lat: 35.9312, lng: 0.0892, region: 'الغرب' },
  { code: '28', arName: 'المسيلة', frName: "M'Sila", lat: 35.7058, lng: 4.5419, region: 'الهضاب العليا' },
  { code: '29', arName: 'معسكر', frName: 'Mascara', lat: 35.3966, lng: 0.1403, region: 'الغرب' },
  { code: '30', arName: 'ورقلة', frName: 'Ouargla', lat: 31.9493, lng: 5.325, region: 'الجنوب الشرقي' },
  { code: '31', arName: 'وهران', frName: 'Oran', lat: 35.6969, lng: -0.6331, region: 'الغرب' },
  { code: '32', arName: 'البيض', frName: 'El Bayadh', lat: 33.6832, lng: 1.0193, region: 'الهضاب العليا' },
  { code: '33', arName: 'إليزي', frName: 'Illizi', lat: 26.505, lng: 8.4823, region: 'الجنوب الكبير' },
  { code: '34', arName: 'برج بوعريريج', frName: 'Bordj Bou Arréridj', lat: 36.0732, lng: 4.7611, region: 'الشرق' },
  { code: '35', arName: 'بومرداس', frName: 'Boumerdès', lat: 36.7664, lng: 3.4772, region: 'شمال وسط' },
  { code: '36', arName: 'الطارف', frName: 'El Tarf', lat: 36.7672, lng: 8.3138, region: 'الشرق' },
  { code: '37', arName: 'تندوف', frName: 'Tindouf', lat: 27.6711, lng: -8.1474, region: 'الجنوب الغربي' },
  { code: '38', arName: 'تيسمسيلت', frName: 'Tissemsilt', lat: 35.6072, lng: 1.8108, region: 'الهضاب العليا' },
  { code: '39', arName: 'الوادي', frName: 'El Oued', lat: 33.3683, lng: 6.8674, region: 'الجنوب الشرقي' },
  { code: '40', arName: 'خنشلة', frName: 'Khenchela', lat: 35.4358, lng: 7.1433, region: 'الشرق' },
  { code: '41', arName: 'سوق أهراس', frName: 'Souk Ahras', lat: 36.2864, lng: 7.9511, region: 'الشرق' },
  { code: '42', arName: 'تيبازة', frName: 'Tipaza', lat: 36.5897, lng: 2.4475, region: 'شمال وسط' },
  { code: '43', arName: 'ميلة', frName: 'Mila', lat: 36.4503, lng: 6.2644, region: 'الشرق' },
  { code: '44', arName: 'عين الدفلى', frName: 'Aïn Defla', lat: 36.264, lng: 1.9679, region: 'شمال وسط' },
  { code: '45', arName: 'النعامة', frName: 'Naâma', lat: 33.2667, lng: -0.3167, region: 'الهضاب العليا' },
  { code: '46', arName: 'عين تموشنت', frName: 'Aïn Témouchent', lat: 35.2975, lng: -1.1404, region: 'الغرب' },
  { code: '47', arName: 'غرداية', frName: 'Ghardaïa', lat: 32.4909, lng: 3.6735, region: 'الجنوب' },
  { code: '48', arName: 'غليزان', frName: 'Relizane', lat: 35.7373, lng: 0.556, region: 'الغرب' },
  { code: '49', arName: 'تيميمون', frName: 'Timimoun', lat: 29.2639, lng: 0.231, region: 'الجنوب الكبير' },
  { code: '50', arName: 'برج باجي مختار', frName: 'Bordj Badji Mokhtar', lat: 21.3279, lng: 0.9554, region: 'الجنوب الكبير' },
  { code: '51', arName: 'أولاد جلال', frName: 'Ouled Djellal', lat: 34.4167, lng: 5.0667, region: 'الزيبان' },
  { code: '52', arName: 'بني عباس', frName: 'Béni Abbès', lat: 30.1322, lng: -2.1667, region: 'الجنوب الغربي' },
  { code: '53', arName: 'عين صالح', frName: 'In Salah', lat: 27.1935, lng: 2.4607, region: 'الجنوب الكبير' },
  { code: '54', arName: 'عين قزام', frName: 'In Guezzam', lat: 19.5667, lng: 5.7667, region: 'الجنوب الكبير' },
  { code: '55', arName: 'تقرت', frName: 'Touggourt', lat: 33.1053, lng: 6.058, region: 'الجنوب الشرقي' },
  { code: '56', arName: 'جانت', frName: 'Djanet', lat: 24.5542, lng: 9.4847, region: 'الجنوب الكبير' },
  { code: '57', arName: 'المغير', frName: "El M'Ghair", lat: 33.95, lng: 5.9242, region: 'الجنوب الشرقي' },
  { code: '58', arName: 'المنيعة', frName: 'El Meniaa', lat: 30.5792, lng: 2.8792, region: 'الجنوب' },
];

export function findWilayaByCode(code: string): Wilaya | undefined {
  return ALGERIAN_WILAYAT.find((w) => w.code === code);
}
