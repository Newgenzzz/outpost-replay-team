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
    cadetTitle: { en: 'Day 1: Catching Sideways Sunlight!', az: '1-ci Gün: Üfüqdəki Günəş İşığını Tutun!' },
    context: {
      en: 'Your lander has touched down on the Shackleton Crater rim. The Sun never rises high here — it skims the horizon at about 1–2°. How you deploy the solar arrays today decides how the outpost survives the shadows ahead.',
      az: 'Eniş modulunuz Şeklton kraterinin kənarına endi. Burada Günəş heç vaxt yüksəyə qalxmır — üfüqün təxminən 1–2° yuxarısında sürüşür. Bu gün günəş panellərini necə quraşdırmağınız qarşıdakı kölgə dövrlərində bazanın necə sağ qalacağını müəyyən edəcək.',
    },
    cadetContext: {
      en: 'Touchdown at the Moon’s South Pole! Up here, the Sun skims sideways along mountain peaks like a flashlight on the floor. Soon a giant crater ridge will block the light for 3 days — how will you set up your solar wings today?',
      az: 'Ayın Cənub Qütbünə endiniz! Burada Günəş döşəmədəki fənər kimi dağ zirvələri boyunca üfüqi hərəkət edir. Tezliklə nəhəng krater silsiləsi 3 gün işığı kəsəcək — bu gün günəş qanadlarını necə quracaqsınız?',
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
        cadetLabel: {
          en: 'Build a tall 10 m solar tower to peek over shadows',
          az: 'Kölgələrin üstündən baxan 10 m-lik hündür günəş qülləsi qurun',
        },
        cadetSummary: {
          en: 'Uses a bit of battery now, but stands tall like a giraffe to catch sunlight even when low ridges cast shadows later!',
          az: 'İndi bir az batareya aparır, amma sonradan kölgə düşəndə də hündürdən günəş işığını tutur!',
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
        cadetLabel: {
          en: 'Open quick low solar wings right next to the lander',
          az: 'Eniş modulunun yanında sürətli alçaq günəş qanadlarını açın',
        },
        cadetSummary: {
          en: 'Super fast setup with time to grab a Moon rock (+4 Science), but mountain shadows will block these low wings later!',
          az: 'Çox sürətli qurulur və ilk Ay daşını toplamağa vaxt qalır (+4 Elm), amma sonradan dağ kölgəsi alçaq panelləri örtəcək!',
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
        cadetLabel: {
          en: 'Skip careful aiming and rush out for Moon rocks!',
          az: 'Dəqiq yönəltməni ötürün və dərhal Ay daşları toplamağa qaçın!',
        },
        cadetSummary: {
          en: 'Big early discovery (+12 Science!), but crooked panels charge poorly and drain your battery before the dark hits.',
          az: ' Böyük erkən kəşf (+12 Elm!), amma əyri panellər zəif enerji yığır və qaranlıqdan əvvəl batareyanı azaldır.',
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
    cadetTitle: { en: 'Day 2: Armor, Air, or Space Salad?', az: '2-ci Gün: Zireh, Hava, yoxsa Kosmik Salat?' },
    context: {
      en: 'Day 2. The habitat is pressurised. Robots and crew can complete one major setup task before the terrain shadow arrives. Each option protects the mission in a different way.',
      az: '2-ci gün. Yaşayış modulu hermetikləşdirildi. Relyef kölgəsi gəlməzdən əvvəl robotlar və ekipaj yalnız bir böyük quraşdırma işini görə bilər. Hər seçim missiyanı fərqli şəkildə qoruyur.',
    },
    cadetContext: {
      en: 'Your Moon home has air and warmth! You have time to build ONE big upgrade before the 3-day mountain shadow arrives: Moon-dirt armor against space storms, a rock-to-oxygen machine, or a mini space garden.',
      az: 'Ay eviniz hazırdır! 3 günlük dağ kölgəsindən əvvəl YALNIZ BİR böyük yeniləmə qura bilərsiniz: kosmik fırtınaya qarşı Ay-torpağı qalxanı, daşdan oksigen çıxaran maşın və ya mini kosmik bağça.',
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
        cadetLabel: {
          en: 'Scoop thick Moon-dirt walls around your shelter (Storm Armor)',
          az: 'Sığınacağın ətrafına qalın Ay torpağı divarı yığın (Fırtına Zirehi)',
        },
        cadetSummary: {
          en: 'Robot digger piles Moon soil over the bunker — uses an assumed 6% storm-dose transmission in this training model.',
          az: 'Robot ekskavator sığınacağın üstünə Ay torpağı yığır — təlim modelində fırtına dozasının 6%-ni keçirən fərz edilmiş qalxandır.',
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
        cadetLabel: {
          en: 'Bake Moon rocks to make extra breathing oxygen (+3 kg O₂)',
          az: 'Əlavə nəfəs oksigeni (+3 kq O₂) almaq üçün Ay daşlarını qızdırın',
        },
        cadetSummary: {
          en: 'Extracts real breathing air right out of Moon dust (+10 Science & +8% Life Support), using extra battery power.',
          az: 'Ay tozundan nəfəs havası çıxarır (+10 Elm və +8% Həyat Təminatı), lakin əlavə batareya enerjisi sərf edir.',
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
        cadetLabel: {
          en: 'Turn on purple grow-lights for fresh space greens',
          az: 'Təzə kosmik göyərti üçün bənövşəyi bitki işıqlarını yandırın',
        },
        cadetSummary: {
          en: 'Grows tasty greens in 5 days if the power never cuts out — sips water and electricity every hour.',
          az: 'İşıq kəsilməsə 5 günə təzə göyərti yetişdirir — hər saat azca su və elektrik işlədir.',
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
    cadetTitle: { en: 'Days 3–5: Frozen 3-Day Mountain Shadow!', az: '3–5-ci Günlər: Şaxtalı 3 Günlük Dağ Kölgəsi!' },
    context: {
      en: 'In this scenario, a ridge hides most of the Sun for 72 hours. The surface cools and cabin heating takes more energy. What can you switch off or power from another source?',
      az: 'Bu ssenaridə silsilə 72 saat Günəşin böyük hissəsini örtür. Səth soyuyur və kabini qızdırmaq üçün daha çox enerji tələb olunur. Hansı avadanlığı söndürmək və ya başqa mənbədən qidalandırmaq olar?',
    },
    cadetContext: {
      en: 'Brrr! A giant mountain ridge just blocked the Sun for 72 hours! Outside drops to −183 °C, and your heaters are gulping battery power. How do you keep the lights and warm air running?',
      az: 'Brrr! Nəhəng dağ silsiləsi 72 saatlığa Günəşi örtdü! Çöldə şaxta −183 °C-yə düşür və qızdırıcılar batareyanı sürətlə içir. İşığı və isti havanı necə qoruyacaqsınız?',
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
        cadetLabel: {
          en: 'Cozy sleep-bag mode — turn off lab gadgets to save battery',
          az: 'Qənaət rejimi — batareyanı qorumaq üçün laboratoriya cihazlarını söndürün',
        },
        cadetSummary: {
          en: 'Saves lots of battery (+14 kWh), though the chilly cabin makes air scrubbers work slower (−6% Life Support).',
          az: 'Çoxlu batareya qoruyur (+14 kVt·s), amma sərin kabin hava təmizləyicilərini bir az zəiflədir (−6% Həyat Təminatı).',
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
        cadetLabel: {
          en: 'Fire up the backup hydrogen-oxygen power cells',
          az: 'Ehtiyat hidrogen-oksigen enerji elementlərini işə salın',
        },
        cadetSummary: {
          en: 'Keeps the base warm and bright (+18 kWh & +4 Science!), but uses up your one-time backup tank before Day 9.',
          az: 'Bazanı isti və işıqlı saxlayır (+18 kVt·s və +4 Elm!), lakin birdəfəlik ehtiyat çənini son günə qədər bitirir.',
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
        cadetLabel: {
          en: 'Drill for ancient ice in the dark anyway (+20 Science!)',
          az: 'Qaranlığa baxmayaraq qədim buz üçün qazma aparın (+20 Elm!)',
        },
        cadetSummary: {
          en: 'Huge discovery (+20 Science!), but heavy drilling in the dark can drain batteries and trigger a dangerous brownout!',
          az: 'Nəhəng kəşf (+20 Elm!), amma qaranlıqda ağır qazma batareyanı boşaldıb təhlükəli enerji kəsilməsi yarada bilər!',
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
    cadetTitle: { en: 'Day 6: Sunlight Returns — Hunt for Moon Ice!', az: '6-cı Gün: Günəş Qayıtdı — Ay Buzu Axtarışı!' },
    context: {
      en: 'The Sun clears the ridge again and the arrays recover. The rim is warming from 140 K back towards 200 K. Mission Control asks: what is today’s priority?',
      az: 'Günəş yenidən silsilənin üstünə çıxır və panellər bərpa olunur. Krater kənarı 140 K-dən yenidən 200 K-ə doğru isinir. Missiya İdarəetmə Mərkəzi soruşur: bugünkü prioritet nədir?',
    },
    cadetContext: {
      en: 'Sunlight returns! In our fictional training site, a nearby cold trap contains icy soil. Real lunar ice research informs this exercise, but no ice measurement for this outpost is loaded. Drive the rover, repair the base, or send a robot?',
      az: 'Günəş işığı qayıdır! Uydurma təlim məkanımızdakı yaxın soyuq tələdə buzlu qrunt var. Məşq real Ay buzu tədqiqatına əsaslanır, lakin bu baza üçün buz ölçməsi yüklənməyib. Maşını sürəcəksiniz, bazanı təmir edəcəksiniz, yoxsa robot göndərəcəksiniz?',
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
        cadetLabel: {
          en: 'Drive the rover to process the training site’s icy soil!',
          az: 'Təlim məkanının buzlu qruntunu emal etmək üçün maşını sürün!',
        },
        cadetSummary: {
          en: 'Awesome adventure (+22 Science + fresh melted drinking water!), using rover battery and suit air.',
          az: 'Möhtəşəm macəra (+22 Elm + təzə əridilmiş içməli su!), rover batareyası və skafandr havası sərf edir.',
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
        cadetLabel: {
          en: 'Stay home to recharge batteries & tune up water recyclers',
          az: 'Batareyaları doldurmaq və su filtrlərini təmir etmək üçün bazada qalın',
        },
        cadetSummary: {
          en: 'Sheds up to 6 kWh of non-essential load and services air/water equipment. Check the forecast for net reserves; the O₂ kit adds repair parts.',
          az: 'Vacib olmayan yükü 6 kVt·saata qədər azaldır və hava/su avadanlığına xidmət edir. Xalis ehtiyatlara proqnozda baxın; O₂ dəsti təmir hissələri verir.',
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
        cadetLabel: {
          en: 'Drive a remote-control mini-robot into the dark crater',
          az: 'Qaranlıq kraterə uzaqdan idarə olunan mini-robot göndərin',
        },
        cadetSummary: {
          en: 'Safe and smart! Crew avoids additional EVA exposure; modeled background radiation remains while the robot beams back +13 Science.',
          az: 'Ekipaj əlavə EVA dozasından yayınır; model fon radiasiyası qalır, robot isə +13 Elm xalı göndərir.',
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
          en: 'Teleoperated robotics: no additional EVA exposure, solid science (+13).',
          az: 'Uzaqdan idarə olunan robot: əlavə EVA dozası yoxdur, yaxşı elm (+13).'
        },
      },
    ],
  },
  /* ----------------------------------------------------------------- */
  {
    id: 5,
    title: { en: 'Solar Storm Alert', az: 'Günəş Fırtınası Xəbərdarlığı' },
    cadetTitle: { en: 'Days 7–8: Red Alert — Solar Storm Incoming!', az: '7–8-ci Günlər: Qırmızı Həyəcan — Günəş Fırtınası Gəlir!' },
    context: {
      en: 'A scripted particle storm is approaching. The default 207 pfu peak borrows a NOAA GOES observation near Earth; other peaks are training inputs. Decide how much time to spend outside and which shelter to use.',
      az: 'Ssenaridə zərrəcik fırtınası yaxınlaşır. Standart 207 pfu pik NOAA GOES-in Yer yaxınlığındakı ölçməsindən götürülüb; digər piklər təlim girişləridir. Açıqda qalma müddətinə və sığınacaq növünə qərar verin.',
    },
    cadetContext: {
      en: 'RED ALERT! The Sun just blasted an invisible wave of fast space particles toward the Moon (a fictional scenario; the default peak borrows a NOAA GOES measurement near Earth). Unlike Earth, the Moon has no air shield. Where will your astronauts hide?',
      az: 'QIRMIZI HƏYƏCAN! Günəş indicə Aya doğru sürətli kosmik zərrəciklər dalğası püskürdü (uydurma ssenari; standart pik Yer yaxınlığındakı NOAA GOES ölçməsinə əsaslanır). Yerdən fərqli olaraq Ayın qoruyucu atmosferi yoxdur. Harada gizlənəcəksiniz?',
    },
    phase: { startHour: 144, endHour: 192, label: { en: 'Hours 144–192 · Solar storm', az: 'Saat 144–192 · Günəş fırtınası' } },
    nasaDataTrigger: {
      source: 'DONKI_SEP',
      headline: {
        en: `Training particle storm · see the active forecast for peak and dose`,
        az: `Təlim zərrəcik fırtınası · pik və doza üçün cari proqnoza baxın`,
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
        cadetLabel: {
          en: 'Stay outside in spacesuits first to finish collecting rocks',
          az: 'Daş toplamağı bitirmək üçün əvvəlcə skafandrla çöldə qalın',
        },
        cadetSummary: {
          en: 'DANGER! Spacesuits barely block storm rays — huge radiation spike even though you score +18 Science!',
          az: 'TƏHLÜKƏ! Skafandr fırtına şüalarını zəif saxlayır — +18 Elm qazansanız da radiasiya kəskin artır!',
        },
        effects: { powerKwh: -2, sciencePoints: 18 },
        stormProtection: 'finishEva',
        causeAndEffectExplanation: {
          en: `The model groups outside operations into the first storm day, then shelters the crew in the habitat. This can return +18 science; modeled dose depends on the selected peak and preparation. See the active forecast. Check your cumulative dose against the mission warning.`,
          az: `Model çöldəki işləri fırtınanın ilk gününə toplayır, sonra ekipaj yaşayış moduluna keçir. Bu, +18 elm xalı verə bilər; model dozası seçilmiş pikdən və hazırlıqdan asılıdır. Cari proqnoza baxın. Toplam dozanı missiyanın xəbərdarlıq həddi ilə müqayisə edin.`,
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
        cadetLabel: { en: 'Go inside the regular Moon habitat rooms', az: 'Adi yaşayış modulunun otaqlarına keçin' },
        cadetSummary: {
          en: 'Assumes 25% storm-dose transmission while you work indoors. Check the forecast for this scenario’s dose; this is not a real shielding prediction.',
          az: 'Daxili işlər üçün fırtına dozasının 25%-nin keçdiyi fərz edilir. Ssenarinin dozasına proqnozda baxın; bu, real qorunma proqnozu deyil.',
        },
        effects: { lifeSupportPct: -2, sciencePoints: 4 },
        stormProtection: 'habitat',
        causeAndEffectExplanation: {
          en: `The model assumes ${pct(SHIELDING.habitat)} % storm-dose transmission in the habitat. Absolute dose depends on the scenario peak and preparation. Two days indoors slightly strain the air and water systems (−2 %), and only lab work continues (+4 science).`,
          az: `Model yaşayış modulunda fırtına dozasının ${pct(SHIELDING.habitat)} %-nin keçdiyini fərz edir. Doza ssenari pikindən və hazırlıqdan asılıdır. İki gün içəridə qalmaq hava və su sistemlərinə bir qədər yük salır (−2 %), yalnız laboratoriya işi davam edir (+4 elm).`,
        },
        nasaSourceCitation: {
          en: 'NOAA SWPC PRF 2541 — May 10, 2024 GOES peak; habitat transmission factor 0.25 is a game simplification',
          az: 'NOAA SWPC PRF 2541 — 10 may 2024-cü il GOES pik ölçməsi. Yaşayış modulu üçün 0,25 keçiricilik əmsalı təlim fərziyyəsidir.',
        },
        riskLevel: 'moderate',
        copilotTip: {
          en: `The habitat uses an assumed 25% transmission. See the forecast for the resulting classroom dose.`,
          az: `Modul üçün 25% keçiricilik fərz edilir. Təlim dozasına proqnozda baxın.`,
        },
      },
      {
        id: 'D5-C',
        label: { en: 'Move into a dedicated storm shelter', az: 'Xüsusi fırtına sığınacağına keçin' },
        cadetLabel: { en: 'Huddle inside the deep Storm Bunker!', az: 'Dərin Fırtına Sığınacağına keçin!' },
        cadetSummary: {
          en: 'Best shield! The model assumes 6% transmission if you built Day 2 Moon-dirt armor — otherwise stacks water bags using pump power.',
          az: 'Ən güclü qalxan! Model 2-ci gündə qurulan Ay-torpağı zirehi üçün 6% keçiricilik fərz edir — yoxsa su çənlərindən divar qurur.',
        },
        effects: { powerKwh: -5, lifeSupportPct: -5, sciencePoints: 2 },
        stormProtection: 'shelter',
        conditionals: [
          {
            ifFlag: 'regolithBerm',
            effects: { powerKwh: 5, lifeSupportPct: 5 },
            note: {
              en: `Regolith berm already built: the shelter passes only ${pct(SHIELDING.regolithBerm)} % and no water tanks need re-plumbing`,
              az: `Reqolit səddi artıq tikilib: sığınacaq yalnız ${pct(SHIELDING.regolithBerm)} % keçirir və su çənlərini yenidən birləşdirməyə ehtiyac yoxdur`,
            },
          },
        ],
        causeAndEffectExplanation: {
          en: `Without a berm, the crew stacks water containers into an improvised wall (${pct(SHIELDING.waterWall)} % assumed transmission), which costs pump power (−5 kWh) and disturbs the water system (−5 %). If you built the regolith berm at Decision 2, the shelter lets through only ${pct(SHIELDING.regolithBerm)} % at no extra cost.`,
          az: `Sədd olmadıqda ekipaj su qablarından müvəqqəti divar düzəldir (${pct(SHIELDING.waterWall)} % fərz edilən keçiricilik), bu da nasos enerjisi (−5 kVt·saat) tələb edir və su sistemini pozur (−5 %). 2-ci qərarda reqolit səddini tikmisinizsə, sığınacaq yalnız ${pct(SHIELDING.regolithBerm)} % keçirir və əlavə xərc tələb etmir.`,
        },
        nasaSourceCitation: {
          en: 'NOAA SWPC PRF 2541 — May 10, 2024 GOES peak; shielding factors are game simplifications',
          az: 'NOAA SWPC PRF 2541 — 10 may 2024-cü il GOES pik ölçməsi. Qorunma əmsalları təlim fərziyyələridir.',
        },
        copilotRecommendation: true,
        riskLevel: 'safe',
        copilotBadge: { en: 'CapCom Recommended (Modeled Shelter)', az: 'CapCom Tövsiyəsi (Model Sığınacağı)' },
        copilotTip: {
          en: `A prepared berm gives the lowest modeled storm dose (assumed 6% transmission). Without it, assembling the water wall costs power.`,
          az: `Hazır sədd modeldə ən az fırtına dozasını verir (fərz edilən 6% keçiricilik). Sədd yoxdursa, su divarı qurmaq enerji tələb edir.`,
        },
      },
    ],
  },
  /* ----------------------------------------------------------------- */
  {
    id: 6,
    title: { en: 'Final Day: Mission Close-out', az: 'Son Gün: Missiyanın Yekunlaşdırılması' },
    cadetTitle: { en: 'Day 9: Liftoff Countdown — One Last Mission!', az: '9-cu Gün: Uçuşa Geri Sayım — Son Tapşırıq!' },
    context: {
      en: 'Day 9. The ascent vehicle is ready. You have one last day of resources. How will you finish Mission 1?',
      az: '9-cu gün. Qalxış aparatı hazırdır. Son bir günlük resursunuz var. 1-ci Missiyanı necə başa çatdıracaqsınız?',
    },
    cadetContext: {
      en: 'Day 9! Your rocket home to Earth is fueled and ready. You have 24 hours left on the Moon — will you go on one last Moonwalk, pack up safely, or beam giant science files to Earth?',
      az: '9-cu Gün! Yerə qayıdacaq raketiniz hazırdır. Ayda son 24 saatınız qalıb — son dəfə gəzintiyə çıxacaqsınız, təhlükəsiz yığışacaqsınız, yoxsa Yerə nəhəng elm faylları ötürəcəksiniz?',
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
        cadetLabel: {
          en: 'One last big Moonwalk to fill the rock trunk (+16 Science)',
          az: 'Daş sandığını doldurmaq üçün son böyük Ay gəzintisi (+16 Elm)',
        },
        cadetSummary: {
          en: 'Brings home awesome Moon rocks, but watch out if you already burned your backup fuel cells during the shadow!',
          az: 'Möhtəşəm Ay daşları gətirir, amma kölgədə ehtiyat yanacaq elementlərini artıq bitirmisinizsə diqqətli olun!',
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
        cadetLabel: { en: 'Pack rock boxes safely & tidy the base for robots', az: 'Daş qutularını təhlükəsiz qablaşdırın və bazanı hazırlayın' },
        cadetSummary: {
          en: 'Steady, safe astronaut teamwork (+5 Science) that protects low batteries and air reserves for liftoff!',
          az: 'Uçuş üçün az qalan batareya və hava ehtiyatını qoruyan təhlükəsiz astronavt işi (+5 Elm)!',
        },
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
        cadetLabel: {
          en: 'Beam giant HD science videos to Earth with the big dish!',
          az: 'Böyük antena ilə Yerə HD elmi məlumatları ötürün!',
        },
        cadetSummary: {
          en: 'Scores +12 Science! Uses big dish power (−16 kWh), unless your Day 1 tall solar tower recharges +8 kWh back!',
          az: '+12 Elm qazandırır! Antena çox enerji çəkir (−16 kVt·s), amma 1-ci gündəki hündür qüllə +8 kVt·s geri qaytarır!',
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
