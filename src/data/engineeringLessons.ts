import type { Bilingual } from '../types';

/** Short explanations of the modeled trade-offs, in mission order. */
export const ENGINEERING_LESSONS: readonly Bilingual[] = [
  {
    en: 'Pointing panels at the Sun improves their output. Higher panels can also clear some terrain shadows.',
    az: 'Panelləri Günəşə yönəltmək hasilatı artırır. Hündür panellər relyefin yaratdığı bəzi kölgələrdən də yayına bilir.',
  },
  {
    en: 'Each habitat upgrade meets a different need. Crops use power and water before they provide food.',
    az: 'Yaşayış modulundakı hər təkmilləşdirmə fərqli ehtiyacı qarşılayır. Bitkilər qida verməzdən əvvəl enerji və su sərf edir.',
  },
  {
    en: 'When sunlight drops, protecting battery reserves helps keep the water recycler working.',
    az: 'Günəş işığı azaldıqda batareya ehtiyatını qorumaq suyun təkrar emalını işlək saxlayır.',
  },
  {
    en: 'The extractor recovers less water when it receives less power.',
    az: 'Emal qurğusuna daha az enerji veriləndə o, daha az su çıxarır.',
  },
  {
    en: 'Shelter material and time spent outside both affect the modeled radiation dose.',
    az: 'Sığınacağın materialı və açıq sahədə qalma müddəti modeldə radiasiya dozasına təsir edir.',
  },
  {
    en: 'Extra fieldwork can cost power and supplies the crew needs to finish the mission.',
    az: 'Əlavə sahə işi ekipajın missiyanı bitirmək üçün lazım olan enerjini və ehtiyatları sərf edə bilər.',
  },
];
