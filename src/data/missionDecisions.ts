/**
 * Mission 1: Shackleton Rim Survival — 6 decisions × 3 choices.
 *
 * Every choice defines DETERMINISTIC deltas for powerKwh, lifeSupportPct, radiationMsv and
 * sciencePoints. Decision 3 uses a scripted polar shadow, and Decision 5 uses a
 * synthetic particle storm anchored to a published May 2024 GOES observation.
 */
import type { Decision } from '../types';
import {
  LRO_SHADOW,
  SEP_PEAK_FLUX_PFU,
  integrateSepDoseMsv,
  SEP_STORM_DOSE_UNSHIELDED_MSV as D,
  SHIELDING,
  TALL_MAST_SHADOW_OUTPUT_FACTOR,
} from './nasaTelemetry';

const r1 = (x: number) => Math.round(x * 10) / 10;

/** D5 classroom dose estimates use the scripted profile anchored to the GOES peak. */
export const STORM_DOSES = {
  /** First 24 hours in an EVA suit, remaining 24 hours inside the habitat. */
  finishEva: r1(integrateSepDoseMsv(0, 24) * SHIELDING.evaSuit + integrateSepDoseMsv(24, 48) * SHIELDING.habitat),
  habitat: r1(D * SHIELDING.habitat),
  waterWall: r1(D * SHIELDING.waterWall),
  bermBonus: r1(D * (SHIELDING.waterWall - SHIELDING.regolithBerm)),
  berm: r1(D * SHIELDING.regolithBerm),
};

const pct = (f: number) => Math.round(f * 100);

export const MISSION_TITLE = {
  en: 'Mission 1: Shackleton Rim Survival',
  az: '1-ci Missiya: Şeklton Kənarında Sağ Qalma',
};

export const MISSION_DECISIONS: Decision[] = [
  /* ----------------------------------------------------------------- */
  {
    id: 1,
    title: { en: 'Touchdown: Power Architecture', az: 'Eniş: Enerji Arxitekturası' },
    context: {
      en: 'Your lander has touched down on the Shackleton Crater rim. The Sun never rises high here — it skims the horizon at about 1–2°. How you deploy the solar arrays today decides how the outpost survives the shadows ahead.',
      az: 'Eniş modulunuz Şeklton kraterinin kənarına endi. Burada Günəş heç vaxt yüksəyə qalxmır — üfüqün təxminən 1–2° yuxarısında sürüşür. Bu gün günəş panellərini necə quraşdırmağınız qarşıdakı kölgə dövrlərində bazanın necə sağ qalacağını müəyyən edəcək.',
    },
    phase: { startHour: 0, endHour: 24, label: { en: 'Hours 0–24 · Touchdown', az: 'Saat 0–24 · Eniş' } },
    nasaDataTrigger: null,
    choices: [
      {
        id: 'D1-A',
        label: {
          en: 'Raise a 10 m vertical solar mast on the rim crest',
          az: 'Krater kənarının zirvəsində 10 m-lik şaquli günəş dirəyi qurun',
        },
        effects: { powerKwh: -4, radiationMsv: 1.0 },
        solarIncidenceDeg: 10,
        setsFlags: ['tallMast'],
        causeAndEffectExplanation: {
          en: `The mast takes 4 kWh to assemble. During the training shadow, it starts from ${pct(TALL_MAST_SHADOW_OUTPUT_FACTOR)}% of full-light output, compared with ${100 - LRO_SHADOW.arrayOutputDropPct}% for low panels. The model then accounts for its 10° pointing angle.`,
          az: `Dirəyin quraşdırılması 4 kVt·saat tələb edir. Təlim kölgəsində hündür dirək tam işıqdakı hasilatın ${pct(TALL_MAST_SHADOW_OUTPUT_FACTOR)}%-ni, alçaq panellər isə ${100 - LRO_SHADOW.arrayOutputDropPct}%-ni verir. Model sonra 10° yönəlmə bucağını nəzərə alır.`,
        },
        nasaSourceCitation: {
          en: 'Mazarico et al. 2011, Icarus 211 — LRO/LOLA polar illumination increases with height above the surface',
          az: 'Mazarico və b. 2011, Icarus 211 — LRO/LOLA modeli qütblərdə səthdən yüksəldikcə işıqlanmanın artdığını göstərir',
        },
        copilotRecommendation: true,
        riskLevel: 'safe',
        copilotBadge: { en: 'CapCom Recommended (Shadow Resilience)', az: 'CapCom Tövsiyəsi (Kölgəyə Dözümlülük)' },
        copilotTip: {
          en: 'Higher placement can see over some terrain. Check the forecast to weigh that benefit against setup energy.',
          az: 'Hündür panel bəzi maneələrin üstündən işıq ala bilər. Bu faydanı quraşdırma enerjisi ilə müqayisə edin.',
        },
      },
      {
        id: 'D1-B',
        label: {
          en: 'Unfold low deck panels beside the lander',
          az: 'Eniş modulunun yanında alçaq panelləri açın',
        },
        effects: { radiationMsv: 0.3, sciencePoints: 4 },
        solarIncidenceDeg: 0,
        causeAndEffectExplanation: {
          en: 'Point the deck panels straight at the Sun (0° incidence) for the best output while the horizon is clear. Quick setup leaves time for a first sample, but the low panels receive little light in the shadow.',
          az: 'Üfüq açıq ikən maksimum güc üçün panelləri birbaşa Günəşə yönəldin (düşmə bucağı 0°). Sürətli quraşdırma ilk nümunəyə vaxt ayırır, lakin kölgədə alçaq panellərə az işıq düşür.',
        },
        nasaSourceCitation: {
          en: 'Mazarico et al. 2011 (LRO/LOLA); NASA PDS Geosciences Node — LOLA archive',
          az: 'Mazarico və b. 2011 (LRO/LOLA) · NASA PDS Geosciences Node — LOLA arxivi',
        },
        riskLevel: 'moderate',
        copilotTip: {
          en: 'Pointing directly at the Sun helps in daylight. Panel height determines what the ridge blocks.',
          az: 'Günəşə yönəltmək açıq vaxtda kömək edir. Silsilənin qarşısını nə qədər kəsdiyini panelin hündürlüyü müəyyən edir.',
        },
      },
      {
        id: 'D1-C',
        label: {
          en: 'Leave panels 25° off-axis and start science',
          az: 'Panelləri 25° sapma ilə saxlayın və elmi işə başlayın',
        },
        effects: { powerKwh: -8, radiationMsv: 1.5, sciencePoints: 12 },
        solarIncidenceDeg: 25,
        causeAndEffectExplanation: {
          en: 'Heading straight to the science site gives an early science lead (+12) but drains 8 kWh from the battery and adds EVA dose (+1.5 mSv). The outpost enters the coming shadow with a smaller energy buffer.',
          az: 'Birbaşa elmi sahəyə getmək erkən elmi üstünlük (+12) verir, lakin batareyadan 8 kVt·saat sərf edir və EVA dozasını artırır (+1.5 mSv). Baza qarşıdakı kölgəyə daha kiçik enerji ehtiyatı ilə daxil olur.',
        },
        nasaSourceCitation: {
          en: 'NASA BVAD (NASA/TP-2015-218570/REV1) — EVA and power assumptions',
          az: 'NASA BVAD (NASA/TP-2015-218570/REV1) — açıq sahə fəaliyyəti və enerji fərziyyələri',
        },
        riskLevel: 'critical',
        copilotTip: {
          en: 'Critical Hazard: Heavy battery drain (-8 kWh) risks triggering emergency brownouts.',
          az: 'Kritik Təhlükə: Ağır batareya itkisi (-8 kVt·s) qəza kəsilməsi riski yaradır.',
        },
      },
    ],
  },
  /* ----------------------------------------------------------------- */
  {
    id: 2,
    title: { en: 'Habitat Configuration', az: 'Yaşayış Modulunun Konfiqurasiyası' },
    context: {
      en: 'Day 2. The habitat is pressurised. Robots and crew can complete one major setup task before the terrain shadow arrives. Each option protects the mission in a different way.',
      az: '2-ci gün. Yaşayış modulu hermetikləşdirildi. Relyef kölgəsi gəlməzdən əvvəl robotlar və ekipaj yalnız bir böyük quraşdırma işini görə bilər. Hər seçim missiyanı fərqli şəkildə qoruyur.',
    },
    phase: { startHour: 24, endHour: 48, label: { en: 'Hours 24–48 · Setup', az: 'Saat 24–48 · Quraşdırma' } },
    nasaDataTrigger: null,
    choices: [
      {
        id: 'D2-A',
        label: {
          en: 'Pile a regolith berm around the habitat (robotic excavator)',
          az: 'Yaşayış modulunun ətrafına reqolit (Ay torpağı) səddi tökün (robot ekskavator)',
        },
        effects: { powerKwh: -8, radiationMsv: 0.8, sciencePoints: 2 },
        setsFlags: ['regolithBerm'],
        causeAndEffectExplanation: {
          en: `Building with the excavator takes 8 kWh. If you later use the dedicated shelter, the model transmits ${pct(SHIELDING.regolithBerm)}% of the storm dose through the berm. Real transmission depends on the material, thickness and particle energies.`,
          az: `Ekskavatorla sədd qurmaq 8 kVt·saat tələb edir. Sonra xüsusi sığınacağa keçsəniz, model səddən fırtına dozasının ${pct(SHIELDING.regolithBerm)}%-nin keçdiyini qəbul edir. Həqiqi keçiricilik materialdan, qalınlıqdan və zərrəcik enerjisindən asılıdır.`,
        },
        nasaSourceCitation: {
          en: 'Schwadron et al. 2012 (LRO/CRaTER) — lunar radiation environment; regolith transmission factor 0.06 is a game simplification',
          az: 'Schwadron və b. 2012 (LRO/CRaTER) — Ayın radiasiya mühiti. Reqolit üçün 0,06 keçiricilik əmsalı təlim fərziyyəsidir.',
        },
        copilotRecommendation: true,
        riskLevel: 'safe',
        copilotBadge: { en: 'CapCom Recommended (Storm Armor)', az: 'CapCom Tövsiyəsi (Fırtına Zirehi)' },
        copilotTip: {
          en: 'Spend power now to improve shelter protection later. The benefit requires choosing the shelter during the storm.',
          az: 'Sonra daha yaxşı qorunmaq üçün indi enerji ayırın. Fayda fırtına zamanı sığınacağa keçəndə yaranır.',
        },
      },
      {
        id: 'D2-B',
        label: {
          en: 'Start the ISRU oxygen-from-regolith demonstrator',
          az: 'Reqolitdən oksigen alan ISRU (yerli resurslardan istifadə) qurğusunu işə salın',
        },
        effects: { powerKwh: -10, lifeSupportPct: 8, sciencePoints: 10 },
        resourceEffects: { oxygenKg: 3 },
        setsFlags: ['isruOxygen'],
        causeAndEffectExplanation: {
          en: 'The demonstrator uses 10 kWh to release 3 kg of oxygen from regolith in this scenario. Two crew members consume about 1.64 kg of oxygen per day. This option supports breathing reserves at the cost of battery energy and shelter preparation.',
          az: 'Ssenaridə qurğu 10 kVt·saat sərf edərək reqolitdən 3 kq oksigen ayırır. İki nəfərlik ekipaj gündə təxminən 1,64 kq oksigen sərf edir. Bu seçim nəfəs ehtiyatını artırır, lakin enerji və sığınacaq hazırlığı hesabına.',
        },
        nasaSourceCitation: {
          en: 'NASA BVAD (NASA/TP-2015-218570/REV1) — O₂ ≈ 0.82 kg per crew-day',
          az: 'NASA BVAD (NASA/TP-2015-218570/REV1) — ekipaj üzvü başına gündə təxminən 0,82 kq O₂',
        },
        riskLevel: 'moderate',
        copilotTip: {
          en: 'ISRU means using local resources. The 3 kg output is a scenario assumption, while crew demand uses a NASA planning reference.',
          az: 'ISRU yerli resurslardan istifadə deməkdir. 3 kq istehsal ssenari fərziyyəsidir, ekipaj tələbi isə NASA-nın planlama göstəricisinə əsaslanır.',
        },
      },
      {
        id: 'D2-C',
        label: {
          en: 'Start the greenhouse crop trial',
          az: 'İstixanada bitki sınağına başlayın',
        },
        effects: { powerKwh: -3, sciencePoints: 4 },
        setsFlags: ['greenhouse'],
        causeAndEffectExplanation: {
          en: 'Install a tray of greens that grew for 25 days before touchdown. The greenhouse needs five more powered growing days and draws water and electricity. Low battery pauses growth. A successful harvest adds a small food supplement and crop science.',
          az: 'Enişdən əvvəl 25 gün yetişdirilmiş göyərti qabını quraşdırın. İstixanada daha beş gün işıqlandırma lazımdır və sistem su ilə elektrik sərf edir. Batareya zəiflədikdə böyümə dayanır. Məhsul yığımı az miqdarda əlavə qida və elmi xal verir.',
        },
        nasaSourceCitation: {
          en: 'NASA Veggie plant growth system on the ISS. Tray age, resource costs and yields are scenario assumptions.',
          az: 'BKS-də NASA Veggie bitki yetişdirmə sistemi. Bitkilərin yaşı, resurs sərfi və məhsuldarlıq ssenari fərziyyələridir.',
        },
        riskLevel: 'moderate',
        copilotTip: {
          en: 'Greens supplement packed rations. Check whether the outpost can afford the extra water and power through the shadow.',
          az: 'Göyərti qablaşdırılmış ərzağa əlavədir. Kölgə zamanı bazada əlavə su və enerjinin yetərli olub-olmadığını yoxlayın.',
        },
      },
    ],
  },
  /* ----------------------------------------------------------------- */
  {
    id: 3,
    title: { en: '72-Hour Horizon Shadow', az: '72 Saatlıq Üfüq Kölgəsi' },
    context: {
      en: 'In this scenario, a ridge hides most of the Sun for 72 hours. The surface cools and cabin heating takes more energy. What can you switch off or power from another source?',
      az: 'Bu ssenaridə silsilə 72 saat Günəşin böyük hissəsini örtür. Səth soyuyur və kabini qızdırmaq üçün daha çox enerji tələb olunur. Hansı avadanlığı söndürmək və ya başqa mənbədən qidalandırmaq olar?',
    },
    phase: { startHour: 48, endHour: 120, label: { en: 'Hours 48–120 · Shadow', az: 'Saat 48–120 · Kölgə' } },
    nasaDataTrigger: {
      source: 'LRO_SHADOW',
      headline: {
        en: `Scripted ridge shadow · ${LRO_SHADOW.durationHours} h shadow · −${LRO_SHADOW.arrayOutputDropPct} % low-panel output · ${LRO_SHADOW.minSurfaceTempK} K`,
        az: `Ssenari üzrə silsilə kölgəsi · ${LRO_SHADOW.durationHours} saat kölgə · alçaq panellərin gücü −${LRO_SHADOW.arrayOutputDropPct} % · ${LRO_SHADOW.minSurfaceTempK} K`,
      },
      detail: {
        en: `LRO instruments measured terrain and thermal radiation. Researchers modeled polar illumination using the terrain data. The 72-hour shadow and temperature curve here are training assumptions.`,
        az: `LRO cihazları relyefi və istilik şüalanmasını ölçüb. Tədqiqatçılar relyef məlumatları ilə qütb işıqlanmasını modelləşdiriblər. Buradakı 72 saatlıq kölgə və temperatur əyrisi təlim fərziyyələridir.`,
      },
      citationIds: ['LOLA_ILLUM', 'DIVINER_COLDTRAPS', 'DIVINER_GLOBAL', 'PDS_LRO'],
    },
    choices: [
      {
        id: 'D3-A',
        label: {
          en: 'Enter survival mode — shed non-critical loads',
          az: 'Sağ qalma rejiminə keçin — vacib olmayan yükləri söndürün',
        },
        effects: { powerKwh: 14, lifeSupportPct: -6 },
        powerStrategy: 'load-shed',
        causeAndEffectExplanation: {
          en: 'Switching off science instruments and lowering cabin heating saves 14 kWh, but the CO₂ scrubbers and heaters run at minimum (−6 % life support). Science pauses for three days.',
          az: 'Elmi cihazları söndürmək və kabin istiliyini azaltmaq 14 kVt·saat qənaət edir, lakin CO₂ təmizləyiciləri və qızdırıcılar minimum rejimdə işləyir (−6 % həyat təminatı). Elmi iş üç gün dayanır.',
        },
        nasaSourceCitation: {
          en: 'NASA BVAD — CO₂ ≈ 1.04 kg per crew-day scrubbing load; Paige et al. 2010 (LRO/Diviner) — polar temperatures',
          az: 'NASA BVAD — ekipaj üzvü başına gündə təxminən 1,04 kq CO₂ təmizlənir. Paige və b. 2010 (LRO/Diviner) — qütb temperaturları.',
        },
        riskLevel: 'moderate',
        copilotTip: {
          en: 'Conserves 14 kWh, but cold cabin throttles CO2 scrubbers and stresses crew (-6% ECLSS).',
          az: '14 kVt·s qənaət edir, lakin soyuq kabin CO2 filtrlərini zəiflədir (-6% ECLSS).',
        },
      },
      {
        id: 'D3-B',
        label: {
          en: 'Switch on the backup fuel cells',
          az: 'Ehtiyat yanacaq elementlərini işə salın',
        },
        effects: { powerKwh: 18, lifeSupportPct: -1, sciencePoints: 4 },
        powerStrategy: 'backup',
        setsFlags: ['fuelCellsSpent'],
        causeAndEffectExplanation: {
          en: 'Fuel cells turn stored hydrogen and oxygen into 18 kWh of electricity, keeping instruments alive (+4 science). But the reactants are now used up — there is no emergency reserve for the final day.',
          az: 'Yanacaq elementləri saxlanılan hidrogen və oksigeni 18 kVt·saat elektrikə çevirir və cihazları işlək saxlayır (+4 elm). Lakin reagentlər artıq istifadə olunub — son gün üçün qəza ehtiyatı qalmır.',
        },
        nasaSourceCitation: {
          en: 'NASA BVAD — power and consumables assumptions; Mazarico et al. 2011 (LRO/LOLA) — shadow duration',
          az: 'NASA BVAD — enerji və sərf materialları üzrə fərziyyələr. Mazarico və b. 2011 (LRO/LOLA) — kölgə müddəti.',
        },
        copilotRecommendation: true,
        riskLevel: 'safe',
        copilotBadge: { en: 'CapCom Recommended (Zero Brownout)', az: 'CapCom Tövsiyəsi (Sıfır Qəza)' },
        copilotTip: {
          en: 'Backup power reduces the time spent at low battery. It uses the reactants you could otherwise keep for close-out.',
          az: 'Ehtiyat enerji batareyanın zəif qaldığı müddəti azaldır. Bu seçim yekun mərhələ üçün saxlanıla bilən reagentləri sərf edir.', 
        },
      },
      {
        id: 'D3-C',
        label: {
          en: 'Keep full operations — drill at the cold-trap edge',
          az: 'Tam iş rejimini saxlayın — soyuq tələnin kənarında qazma aparın',
        },
        effects: { powerKwh: -6, lifeSupportPct: -2, radiationMsv: 0.8, sciencePoints: 20 },
        causeAndEffectExplanation: {
          en: 'Diviner measured some of the coldest places in the Solar System in nearby permanently shadowed craters — ideal for finding water ice (+20 science). But drilling in the dark costs 6 kWh on top of the shadow drain. If the battery falls below 20 kWh, a brownout will throttle life support.',
          az: 'Diviner yaxınlıqdakı daimi kölgəli kraterlərdə Günəş sisteminin ən soyuq yerlərindən bəzilərini ölçüb — su buzunu tapmaq üçün ideal yer (+20 elm). Lakin qaranlıqda qazma kölgə itkisinə əlavə olaraq 6 kVt·saat sərf edir. Batareya 20 kVt·saatdan aşağı düşərsə, enerji çatışmazlığı həyat təminatını zəiflədəcək.',
        },
        nasaSourceCitation: {
          en: 'Paige et al. 2010, Science 330 — LRO/Diviner south-polar cold traps',
          az: 'Paige və b. 2010, Science 330 — LRO/Diviner məlumatları üzrə cənub qütbünün soyuq tələləri',
        },
        riskLevel: 'critical',
        copilotTip: {
          en: 'Critical Hazard: Drilling in deep shadow drains battery below 20 kWh, triggering brownout.',
          az: 'Kritik Təhlükə: Dərin kölgədə qazma batareyanı 20 kVt·s-dən aşağı salır və qəzanı işə salır.',
        },
      },
    ],
  },
  /* ----------------------------------------------------------------- */
  {
    id: 4,
    title: { en: 'Sunrise: Ice Prospecting', az: 'Gün Çıxışı: Buz Kəşfiyyatı' },
    context: {
      en: 'The Sun clears the ridge again and the arrays recover. The rim is warming from 140 K back towards 200 K. Mission Control asks: what is today’s priority?',
      az: 'Günəş yenidən silsilənin üstünə çıxır və panellər bərpa olunur. Krater kənarı 140 K-dən yenidən 200 K-ə doğru isinir. Missiya İdarəetmə Mərkəzi soruşur: bugünkü prioritet nədir?',
    },
    phase: { startHour: 120, endHour: 144, label: { en: 'Hours 120–144 · Sunrise', az: 'Saat 120–144 · Gün çıxışı' } },
    nasaDataTrigger: null,
    choices: [
      {
        id: 'D4-A',
        label: {
          en: 'Crewed rover traverse to the permanently shadowed crater edge',
          az: 'Daimi kölgəli kraterin kənarına ekipajlı rover səfəri',
        },
        effects: { powerKwh: -14, lifeSupportPct: -3, radiationMsv: 3.5, sciencePoints: 22 },
        resourceEffects: { oxygenKg: -0.8, waterKg: -0.5 },
        iceProcessingKg: 20,
        causeAndEffectExplanation: {
          en: 'A crewed traverse draws 14 kWh, 0.8 kg of suit oxygen and 0.5 kg of water. Process a fictional 20 kg sample using a published Cabeus ice estimate as the exercise input. Only the powered share of the task yields treated water.',
          az: 'Ekipajlı səfər 14 kVt·saat, 0,8 kq oksigen və 0,5 kq su sərf edir. Təlim üçün Kabeus kraterində dərc edilmiş buz payı əsasında uydurma 20 kq nümunəni emal edin. Yalnız enerji ilə təmin edilən iş təmizlənmiş su verir.',
        },
        nasaSourceCitation: {
          en: 'NASA LCROSS, Colaprete et al. 2010 — Cabeus water ice mass fraction; scenario feedstock and treatment efficiency are assumed.',
          az: 'NASA LCROSS, Colaprete və b. 2010 — Kabeusda su buzunun kütlə payı. Nümunə kütləsi və emal səmərəliliyi ssenari fərziyyələridir.',
        },
        copilotRecommendation: true,
        riskLevel: 'safe',
        copilotBadge: { en: 'CapCom Recommended (Max Ice Science)', az: 'CapCom Tövsiyəsi (Maksimum Buz Elmi)' },
        copilotTip: {
          en: 'Sunlight is back! Driving the rover returns the highest science payoff (+22 pts).',
          az: 'Günəş qayıtdı! Roveri sürmək ən yüksək elmi nəticəni gətirir (+22 xal).'
        },
      },
      {
        id: 'D4-B',
        label: {
          en: 'Recharge batteries and service life support',
          az: 'Batareyaları doldurun və həyat təminatı sisteminə xidmət göstərin',
        },
        effects: { powerKwh: 10, lifeSupportPct: 6, sciencePoints: 3 },
        powerStrategy: 'load-shed',
        waterRecoveryBonusPct: 8,
        conditionals: [
          {
            ifFlag: 'isruOxygen',
            effects: { lifeSupportPct: 4 },
            note: {
              en: 'The ISRU kit provides shared service parts for life support',
              az: 'ISRU dəsti həyat təminatı üçün ehtiyat hissələr verir',
            },
          },
        ],
        causeAndEffectExplanation: {
          en: 'Park the rover and idle non-essential equipment, saving up to 6 kWh of load. Service filters and the water processor to restore equipment health. Little field science gets done.',
          az: 'Roveri saxlayın və vacib olmayan cihazları söndürərək 6 kVt·saata qədər yükə qənaət edin. Avadanlığın vəziyyətini yaxşılaşdırmaq üçün filtrlərə və su emalı sisteminə xidmət göstərin. Sahə elmi üçün az vaxt qalır.',
        },
        nasaSourceCitation: {
          en: 'NASA ISS ECLSS — ~98 % water recovery (2023); NASA BVAD',
          az: 'NASA-nın BKS-dəki həyat təminatı sistemi — suyun təxminən 98%-nin bərpası (2023) · NASA BVAD',
        },
        riskLevel: 'safe',
        copilotTip: {
          en: 'Reducing load preserves the battery. Maintenance keeps the water loop working, which slows losses from the tank.',
          az: 'Yükün azaldılması batareyanı qoruyur. Texniki xidmət su dövrəsini işlək saxlayır və çəndəki itkini azaldır.',
        },
      },
      {
        id: 'D4-C',
        label: {
          en: 'Teleoperate a robotic scout from inside the habitat',
          az: 'Yaşayış modulunun içindən robot kəşfiyyatçını uzaqdan idarə edin',
        },
        effects: { powerKwh: -7, sciencePoints: 13 },
        causeAndEffectExplanation: {
          en: 'The robot drives into the cold, dark crater while the crew stays shielded (no extra mSv). It costs 7 kWh and returns less science than a crewed traverse (+13).',
          az: 'Robot soyuq, qaranlıq kraterə daxil olur, ekipaj isə qorunan yerdə qalır (əlavə mSv yoxdur). Bu 7 kVt·saat sərf edir və ekipajlı səfərdən az elmi nəticə verir (+13).',
        },
        nasaSourceCitation: {
          en: 'Williams et al. 2017 (LRO/Diviner); NASA PDS Geosciences Node — LRO archives',
          az: 'Williams və b. 2017 (LRO/Diviner) · NASA PDS Geosciences Node — LRO arxivləri',
        },
        riskLevel: 'safe',
        copilotTip: {
          en: 'Teleoperated robotics: zero crew fatigue or EVA radiation, solid science (+13).',
          az: 'Uzaqdan idarə olunan robot: sıfır yorğunluq və ya radiasiya, yaxşı elm (+13).'
        },
      },
    ],
  },
  /* ----------------------------------------------------------------- */
  {
    id: 5,
    title: { en: 'Solar Storm Alert', az: 'Günəş Fırtınası Xəbərdarlığı' },
    context: {
      en: 'A scripted particle storm is approaching. Its peak is anchored to a May 2024 GOES proton observation near Earth. Decide how much time to spend outside and which shelter to use.',
      az: 'Ssenaridə zərrəcik fırtınası yaxınlaşır. Pik qiymət 2024-cü ilin mayında Yer yaxınlığında GOES peykinin proton ölçməsinə əsaslanır. Açıqda qalma müddətinə və sığınacaq növünə qərar verin.',
    },
    phase: { startHour: 144, endHour: 192, label: { en: 'Hours 144–192 · Solar storm', az: 'Saat 144–192 · Günəş fırtınası' } },
    nasaDataTrigger: {
      source: 'DONKI_SEP',
      headline: {
        en: `Training particle storm · peak ${SEP_PEAK_FLUX_PFU} pfu · ${D} mSv modeled dose without shelter`,
        az: `Təlim zərrəcik fırtınası · pik ${SEP_PEAK_FLUX_PFU} pfu · sığınacaqsız model dozası ${D} mSv`,
      },
      detail: {
        en: 'The GOES instrument measured particle flux near Earth. The time profile, flux-to-dose conversion and shielding factors are classroom assumptions. The forecast shows the scenario dose, including background exposure.',
        az: 'GOES cihazı Yer yaxınlığında zərrəcik axınını ölçüb. Vaxt profili, axının dozaya çevrilməsi və qorunma əmsalları təlim fərziyyələridir. Proqnoza ssenaridəki fon dozası da daxildir.',
      },
      citationIds: ['DONKI', 'GOES_PROTONS', 'NASA_STD_3001'],
    },
    choices: [
      {
        id: 'D5-A',
        label: {
          en: 'Finish the planned EVA before sheltering',
          az: 'Sığınmazdan əvvəl planlaşdırılmış EVA-nı başa çatdırın',
        },
        effects: { powerKwh: -2, sciencePoints: 18 },
        stormProtection: 'finishEva',
        causeAndEffectExplanation: {
          en: `The model groups outside operations into the first storm day, then shelters the crew in the habitat. This can return +18 science with about ${STORM_DOSES.finishEva} mSv of modeled storm dose. Check your cumulative dose against the mission warning.`,
          az: `Model çöldəki işləri fırtınanın ilk gününə toplayır, sonra ekipaj yaşayış moduluna keçir. Bu, təxminən ${STORM_DOSES.finishEva} mSv model fırtına dozası ilə +18 elm xalı verə bilər. Toplam dozanı missiyanın xəbərdarlıq həddi ilə müqayisə edin.`,
        },
        nasaSourceCitation: {
          en: 'NASA CCMC DONKI and NOAA SWPC PRF 2541 — May 10, 2024 GOES event near Earth',
          az: 'NASA CCMC DONKI və NOAA SWPC PRF 2541 — 10 may 2024-cü ildə Yer yaxınlığında GOES müşahidəsi',
        },
        riskLevel: 'critical',
        copilotTip: {
          en: 'Waiting to shelter raises cumulative exposure. The warning depends on earlier decisions as well as the storm.',
          az: 'Sığınmağa gecikmək toplam dozanı artırır. Xəbərdarlıq fırtına ilə yanaşı əvvəlki qərarlardan da asılıdır.',
        },
      },
      {
        id: 'D5-B',
        label: { en: 'Shelter inside the habitat', az: 'Yaşayış modulunun içində sığının' },
        effects: { lifeSupportPct: -2, sciencePoints: 4 },
        stormProtection: 'habitat',
        causeAndEffectExplanation: {
          en: `The habitat walls pass about ${pct(SHIELDING.habitat)} % of the storm dose (≈ ${STORM_DOSES.habitat} mSv). Two days indoors slightly strain the air and water systems (−2 %), and only lab work continues (+4 science).`,
          az: `Yaşayış modulunun divarları fırtına dozasının təxminən ${pct(SHIELDING.habitat)} %-ni keçirir (≈ ${STORM_DOSES.habitat} mSv). İki gün içəridə qalmaq hava və su sistemlərinə bir qədər yük salır (−2 %), yalnız laboratoriya işi davam edir (+4 elm).`,
        },
        nasaSourceCitation: {
          en: 'NOAA SWPC PRF 2541 — May 10, 2024 GOES peak; habitat transmission factor 0.25 is a game simplification',
          az: 'NOAA SWPC PRF 2541 — 10 may 2024-cü il GOES pik ölçməsi. Yaşayış modulu üçün 0,25 keçiricilik əmsalı təlim fərziyyəsidir.',
        },
        riskLevel: 'moderate',
        copilotTip: {
          en: `The habitat offers moderate modeled protection (~${STORM_DOSES.habitat} mSv storm dose).`,
          az: `Yaşayış modulu modeldə orta səviyyəli qorunma verir (~${STORM_DOSES.habitat} mSv fırtına dozası).`,
        },
      },
      {
        id: 'D5-C',
        label: { en: 'Move into a dedicated storm shelter', az: 'Xüsusi fırtına sığınacağına keçin' },
        effects: { powerKwh: -5, lifeSupportPct: -5, sciencePoints: 2 },
        stormProtection: 'shelter',
        conditionals: [
          {
            ifFlag: 'regolithBerm',
            effects: { powerKwh: 5, lifeSupportPct: 5 },
            note: {
              en: `Regolith berm already built: the shelter passes only ${pct(SHIELDING.regolithBerm)} % (−${STORM_DOSES.bermBonus} mSv) and no water tanks need re-plumbing`,
              az: `Reqolit səddi artıq tikilib: sığınacaq yalnız ${pct(SHIELDING.regolithBerm)} % keçirir (−${STORM_DOSES.bermBonus} mSv) və su çənlərini yenidən birləşdirməyə ehtiyac yoxdur`,
            },
          },
        ],
        causeAndEffectExplanation: {
          en: `Without a berm, the crew stacks water containers into an improvised wall (${pct(SHIELDING.waterWall)} % transmission ≈ ${STORM_DOSES.waterWall} mSv), which costs pump power (−5 kWh) and disturbs the water system (−5 %). If you built the regolith berm at Decision 2, the shelter lets through only ${pct(SHIELDING.regolithBerm)} % (≈ ${STORM_DOSES.berm} mSv) at no extra cost.`,
          az: `Sədd olmadıqda ekipaj su qablarından müvəqqəti divar düzəldir (${pct(SHIELDING.waterWall)} % keçiricilik ≈ ${STORM_DOSES.waterWall} mSv), bu da nasos enerjisi (−5 kVt·saat) tələb edir və su sistemini pozur (−5 %). 2-ci qərarda reqolit səddini tikmisinizsə, sığınacaq yalnız ${pct(SHIELDING.regolithBerm)} % (≈ ${STORM_DOSES.berm} mSv) keçirir və əlavə xərc tələb etmir.`,
        },
        nasaSourceCitation: {
          en: 'NOAA SWPC PRF 2541 — May 10, 2024 GOES peak; shielding factors are game simplifications',
          az: 'NOAA SWPC PRF 2541 — 10 may 2024-cü il GOES pik ölçməsi. Qorunma əmsalları təlim fərziyyələridir.',
        },
        copilotRecommendation: true,
        riskLevel: 'safe',
        copilotBadge: { en: 'CapCom Recommended (Safe Bunker)', az: 'CapCom Tövsiyəsi (Təhlükəsiz Sığınacaq)' },
        copilotTip: {
          en: `A prepared berm gives the lowest modeled storm dose (~${STORM_DOSES.berm} mSv). Without it, assembling the water wall costs power.`,
          az: `Hazır sədd modeldə ən az fırtına dozasını verir (~${STORM_DOSES.berm} mSv). Sədd yoxdursa, su divarı qurmaq enerji tələb edir.`,
        },
      },
    ],
  },
  /* ----------------------------------------------------------------- */
  {
    id: 6,
    title: { en: 'Final Day: Mission Close-out', az: 'Son Gün: Missiyanın Yekunlaşdırılması' },
    context: {
      en: 'Day 9. The ascent vehicle is ready. You have one last day of resources. How will you finish Mission 1?',
      az: '9-cu gün. Qalxış aparatı hazırdır. Son bir günlük resursunuz var. 1-ci Missiyanı necə başa çatdıracaqsınız?',
    },
    phase: { startHour: 192, endHour: 216, label: { en: 'Hours 192–216 · Close-out', az: 'Saat 192–216 · Yekun' } },
    nasaDataTrigger: null,
    choices: [
      {
        id: 'D6-A',
        label: {
          en: 'Extended EVA to fill the sample cache',
          az: 'Nümunə konteynerini doldurmaq üçün uzadılmış EVA',
        },
        effects: { powerKwh: -10, lifeSupportPct: -8, radiationMsv: 3.0, sciencePoints: 16 },
        conditionals: [
          {
            ifFlag: 'fuelCellsSpent',
            effects: { lifeSupportPct: -10 },
            note: {
              en: 'No fuel-cell reserve left: consumables must cover the contingency (−10 %)',
              az: 'Yanacaq elementi ehtiyatı qalmayıb: ehtiyat tədbirləri istehlak materiallarından ödənilir (−10 %)',
            },
          },
        ],
        causeAndEffectExplanation: {
          en: 'One more long EVA brings home the best samples (+16 science) but uses suit consumables (−8 %), power (−10 kWh) and dose (+3.0 mSv). If the fuel cells were spent during the shadow, there is no contingency reserve: −10 % more life support.',
          az: 'Daha bir uzun EVA ən yaxşı nümunələri gətirir (+16 elm), lakin skafandr ehtiyatlarını (−8 %), enerjini (−10 kVt·saat) işlədir və doza əlavə edir (+3.0 mSv). Yanacaq elementləri kölgə zamanı işlədilibsə, ehtiyat qalmır: həyat təminatı daha −10 %.',
        },
        nasaSourceCitation: {
          en: 'NASA BVAD — EVA consumables; NASA-STD-3001 Vol. 1 — crew dose management',
          az: 'NASA BVAD — açıq sahə fəaliyyəti üçün sərf materialları. NASA-STD-3001, cild 1 — ekipajın radiasiya dozasının idarə edilməsi.',
        },
        riskLevel: 'moderate',
        copilotTip: {
          en: 'Adds +16 science, but uses remaining power (-10 kWh) and suit consumables (-8%).',
          az: '+16 elm əlavə edir, lakin qalan enerjini (-10 kVt·s) və skafandr ehtiyatlarını (-8%) sərf edir.',
        },
      },
      {
        id: 'D6-B',
        label: { en: 'Nominal close-out and stow', az: 'Standart yekunlaşdırma və yığışdırma' },
        effects: { powerKwh: -4, lifeSupportPct: -2, sciencePoints: 5 },
        causeAndEffectExplanation: {
          en: 'Pack the samples, safe the habitat for the robots and review the data. Low risk, modest science (+5).',
          az: 'Nümunələri qablaşdırın, yaşayış modulunu robotlar üçün təhlükəsiz vəziyyətə gətirin və məlumatları nəzərdən keçirin. Az risk, orta elmi nəticə (+5).',
        },
        nasaSourceCitation: {
          en: 'NASA BVAD — nominal crew-day consumables',
          az: 'NASA BVAD — ekipaj üzvünün gündəlik nominal sərfi',
        },
        copilotRecommendation: true,
        riskLevel: 'safe',
        copilotBadge: { en: 'CapCom Recommended (Nominal Return)', az: 'CapCom Tövsiyəsi (Standart Qayıdış)' },
        copilotTip: {
          en: 'Packing samples and securing the habitat limits the final day’s load.',
          az: 'Nümunələri qablaşdırmaq və bazanı təhlükəsiz vəziyyətə gətirmək son günün yükünü məhdudlaşdırır.',
        },
      },
      {
        id: 'D6-C',
        label: {
          en: 'High-rate downlink of all science data to Earth',
          az: 'Bütün elmi məlumatların Yerə yüksək sürətlə ötürülməsi',
        },
        effects: { powerKwh: -16, sciencePoints: 12 },
        conditionals: [
          {
            ifFlag: 'tallMast',
            effects: { powerKwh: 8 },
            powerStrategy: 'generation',
            note: {
              en: 'Tall mast arrays keep charging during the transmission (+8 kWh)',
              az: 'Hündür dirəkdəki panellər ötürmə zamanı doldurmağa davam edir (+8 kVt·saat)',
            },
          },
        ],
        causeAndEffectExplanation: {
          en: 'Transmitting the full data set (+12 science) runs the high-gain transmitter all day (−16 kWh). A tall solar mast keeps charging during the transmission (+8 kWh back).',
          az: 'Tam məlumat dəstinin ötürülməsi (+12 elm) yüksək güclü ötürücünü bütün gün işlədir (−16 kVt·saat). Hündür günəş dirəyi ötürmə zamanı doldurmağa davam edir (+8 kVt·saat geri qayıdır).',
        },
        nasaSourceCitation: {
          en: 'Mazarico et al. 2011 (LRO/LOLA) — elevated arrays; NASA BVAD power assumptions',
          az: 'Mazarico və b. 2011 (LRO/LOLA) — hündürdə yerləşdirilən panellər. NASA BVAD — enerji fərziyyələri.',
        },
        riskLevel: 'moderate',
        copilotTip: {
          en: 'High-rate laser downlink (+12 science), but uses high transmitter power (-16 kWh).',
          az: 'Yüksək sürətli lazer ötürməsi (+12 elm), lakin güclü ötürücü enerjisi tələb edir (-16 kVt·s).',
        },
      },
    ],
  },
];

export const DECISION_COUNT = MISSION_DECISIONS.length;

export const MISSION_DEMO = {
  baseline: [1, 0, 2, 0, 2, 2],
  branch: [1, 0, 1, 0, 2, 2],
  rewindStep: 3,
};
