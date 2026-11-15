/** EN / AZ UI dictionary. Data-layer strings live as Bilingual objects in src/data. */
export const STRINGS = {
  appName: { en: 'Outpost Replay', az: 'Outpost Replay' },
  tagline: { en: 'Junior Astronaut Mission Trainer', az: 'Gənc Astronavt Missiya Trenajoru' },
  missionBriefing: { en: 'Mission Briefing', az: 'Missiya Brifinqi' },
  reset: { en: 'Reset', az: 'Sıfırla' },
  loadDemo: { en: 'Load Demo Preset', az: 'Demo Nümunəni Yüklə' },
  close: { en: 'Close', az: 'Bağla' },
  mute: { en: 'Mute audio', az: 'Səsi söndür' },
  unmute: { en: 'Unmute audio', az: 'Səsi aç' },
  language: { en: 'Language', az: 'Dil' },

  briefingTitle: { en: 'Mission 1 Briefing — Shackleton Rim Survival', az: '1-ci Missiya Brifinqi — Şeklton Kənarında Sağ Qalma' },
  briefingBody1: {
    en: 'You command a 2-person outpost on the rim of Shackleton Crater at the Moon’s south pole for 9 days. The Sun skims the horizon, nearby craters hide water ice in permanent darkness, and the Sun itself can erupt without warning.',
    az: 'Siz 9 gün ərzində Ayın cənub qütbündə, Şeklton krateri kənarındakı 2 nəfərlik bazaya komandanlıq edirsiniz. Günəş üfüq boyunca sürüşür, yaxınlıqdakı kraterlər daimi qaranlıqda su buzunu gizlədir, Günəş isə xəbərdarlıqsız püskürə bilər.',
  },
  briefingBody2: {
    en: 'Make six engineering decisions about power, crew reserves, radiation and science. The shadow is a scenario inspired by lunar research. The simulated storm uses a published May 2024 proton-flux observation as its peak.',
    az: 'Enerji, ekipaj ehtiyatları, radiasiya və elm barədə altı mühəndislik qərarı verin. Kölgə ssenarisi Ay tədqiqatlarından ilhamlanır. Modeldə fırtınanın piki 2024-cü ilin mayında dərc edilmiş proton axını ölçməsinə əsaslanır.',
  },
  briefingBody3: {
    en: 'When the mission ends, click any earlier decision to Rewind & Branch. Run B copies Run A, you change one choice, and the charts show how that single change ripples through the rest of the timeline. The simulation is 100 % deterministic: the same choices always give the same result.',
    az: 'Missiya bitdikdən sonra Geri Sar və Budaqlan üçün istənilən əvvəlki qərara klikləyin. B Gedişi A Gedişini köçürür, siz bir seçimi dəyişirsiniz və qrafiklər bu tək dəyişikliyin zaman xəttinin qalan hissəsinə necə təsir etdiyini göstərir. Simulyasiya 100 % deterministikdir: eyni seçimlər həmişə eyni nəticəni verir.',
  },
  briefingGoal: {
    en: 'Goal: finish with Life Support ≥ 40 %, crew dose < 50 mSv, power above 0 — and as much science as possible.',
    az: 'Məqsəd: Həyat Təminatı ≥ 40 %, ekipaj dozası < 50 mSv, enerji 0-dan yuxarı olmaqla — mümkün qədər çox elmi nəticə ilə missiyanı başa vurmaq.',
  },
  noLogosNote: {
    en: 'Independent educational project. Uses public NASA data; not endorsed by NASA.',
    az: 'Müstəqil təhsil layihəsi. Açıq NASA məlumatlarından istifadə edir; NASA tərəfindən təsdiqlənməyib.',
  },

  // Metrics
  power: { en: 'Power Reserve', az: 'Enerji Ehtiyatı' },
  lifeSupport: { en: 'Life Support', az: 'Həyat Təminatı' },
  radiation: { en: 'Modeled Radiation Dose', az: 'Model Radiasiya Dozası' },
  science: { en: 'Science Progress', az: 'Elmi İrəliləyiş' },
  unitKwh: { en: 'kWh', az: 'kVt·saat' },
  unitPct: { en: '%', az: '%' },
  unitMsv: { en: 'mSv', az: 'mSv' },
  unitPts: { en: 'pts', az: 'xal' },
  doseWarning: { en: '50 mSv mission warning', az: '50 mSv missiya xəbərdarlığı' },

  // Runs
  runA: { en: 'Run A', az: 'A Gedişi' },
  runB: { en: 'Run B', az: 'B Gedişi' },
  baseline: { en: 'Baseline', az: 'Əsas' },
  rewound: { en: 'Rewound', az: 'Geri sarılmış' },

  // Timeline
  timeline: { en: 'Mission Timeline', az: 'Missiya Zaman Xətti' },
  decision: { en: 'Decision', az: 'Qərar' },
  step: { en: 'Step', az: 'Addım' },
  start: { en: 'Start', az: 'Başlanğıc' },
  timelineHintPlaying: { en: 'Finish the mission or reach an abort to unlock Rewind & Branch.', az: 'Geri sarmaq üçün missiyanı başa vurun və ya dayandırılma nöqtəsinə çatın.' },
  timelineHintComplete: {
    en: 'Select an executed phase to rewind and create Run B.',
    az: 'Geri sarmaq və B gedişini yaratmaq üçün keçdiyiniz mərhələni seçin.',
  },
  timelineHintBranch: {
    en: 'Pick an alternative. Later planned choices stay fixed. If Run A stopped early, you’ll choose any newly reached phases yourself.',
    az: 'Başqa variant seçin. Sonrakı planlaşdırılmış qərarlar eyni qalır. A gedişi tez bitibsə, yeni açılan mərhələlərdə qərarı özünüz verəcəksiniz.',
  },
  rewindBranch: { en: 'Rewind & Branch', az: 'Geri Sar və Budaqlan' },
  clearRunB: { en: 'Clear Run B', az: 'B Gedişini Sil' },
  adoptRunB: { en: 'Adopt Run B as Run A', az: 'B Gedişini A Gedişi et' },
  changed: { en: 'changed', az: 'dəyişib' },

  // Decision card
  chooseOne: { en: 'Choose one option', az: 'Bir seçim edin' },
  nasaDataTrigger: { en: 'Scenario event', az: 'Ssenari hadisəsi' },
  causeEffect: { en: 'Cause → Effect', az: 'Səbəb → Nəticə' },
  source: { en: 'Source', az: 'Mənbə' },
  next: { en: 'Next decision', az: 'Növbəti qərar' },
  viewResults: { en: 'View mission results', az: 'Missiya nəticələrinə bax' },
  prev: { en: 'Previous', az: 'Əvvəlki' },
  locked: { en: 'Locked in Run A', az: 'A Gedişində təsdiqlənib' },
  ifEarlier: { en: 'If set earlier', az: 'Əvvəl seçilibsə' },
  active: { en: 'active', az: 'aktiv' },
  inactive: { en: 'not active', az: 'aktiv deyil' },
  stepBreakdown: { en: 'Step ledger (every term applied this step)', az: 'Addım hesabatı (bu addımda tətbiq olunan hər bir termin)' },
  envLabel: { en: 'Environment', az: 'Mühit' },
  choiceLabel: { en: 'Choice', az: 'Seçim' },
  conditionalLabel: { en: 'Earlier decision', az: 'Əvvəlki qərar' },
  ruleLabel: { en: 'Rule', az: 'Qayda' },
  result: { en: 'Result', az: 'Nəticə' },
  youChose: { en: 'Selected', az: 'Seçilib' },

  // Outcome
  outcome: { en: 'Outcome', az: 'Nəticə' },
  'outcome.in-progress': { en: 'In progress', az: 'Davam edir' },
  'outcome.success': { en: 'Mission success', az: 'Missiya uğurludur' },
  'outcome.warning': { en: 'Complete with warnings', az: 'Xəbərdarlıqlarla tamamlandı' },
  'outcome.abort': { en: 'Mission aborted', az: 'Missiya dayandırıldı' },
  score: { en: 'Score', az: 'Xal' },

  // Compare
  compareTitle: { en: 'Rewind & Compare', az: 'Geri Sar və Müqayisə Et' },
  compareSubtitle: { en: 'Run A solid · Run B dashed', az: 'A Gedişi bütöv xətt · B Gedişi qırıq xətt' },
  compareEmpty: {
    en: 'Finish Run A, then click a timeline step to create Run B. Shaded bands: Ridge shadow (D3) and Particle storm (D5).',
    az: 'A Gedişini bitirin, sonra B Gedişini yaratmaq üçün zaman xəttində bir addıma klikləyin. Kölgəli zolaqlar: Silsilə kölgəsi (Q3) və Zərrəcik fırtınası (Q5).',
  },
  shadowBand: { en: 'Ridge shadow', az: 'Silsilə kölgəsi' },
  stormBand: { en: 'Particle storm', az: 'Zərrəcik fırtınası' },
  deltaTitle: { en: 'Why the outcome changed', az: 'Nəticə niyə dəyişdi' },
  deltaSameOutcome: { en: 'What changed between runs', az: 'Gedişlər arasında nə dəyişdi' },
  deltaFinal: { en: 'Final Δ (B − A)', az: 'Yekun Δ (B − A)' },
  noDifference: { en: 'Run B is identical to Run A — pick a different option on any step.', az: 'B Gedişi A Gedişi ilə eynidir — istənilən addımda fərqli seçim edin.' },
  reasonChoice: { en: 'Decision {step}: “{from}” → “{to}”', az: '{step}-ci qərar: “{from}” → “{to}”' },
  reasonRuleAvoided: { en: 'Step {step}: Run B avoided — {rule}', az: '{step}-ci addım: B Gedişi qaçdı — {rule}' },
  reasonRuleTriggered: { en: 'Step {step}: Run B triggered — {rule}', az: '{step}-ci addım: B Gedişində baş verdi — {rule}' },
  reasonCondGained: { en: 'Step {step}: only in Run B — {note}', az: '{step}-ci addım: yalnız B Gedişində — {note}' },
  reasonCondLost: { en: 'Step {step}: only in Run A — {note}', az: '{step}-ci addım: yalnız A Gedişində — {note}' },
  reasonDose: { en: '50 mSv warning crossed: Run A {a} · Run B {b}', az: '50 mSv həddi keçildi: A Gedişi {a} · B Gedişi {b}' },
  never: { en: 'never', az: 'heç vaxt' },
  atStep: { en: 'at step {step}', az: '{step}-ci addımda' },

  // Evidence panel
  evidenceTitle: { en: 'Mission science and assumptions', az: 'Missiyanın elmi əsasları və fərziyyələri' },
  simplified: { en: 'Training assumptions', az: 'Təlim fərziyyələri' },
  equations: { en: 'Model equations', az: 'Model tənlikləri' },
  eclssO2: { en: 'O₂ consumed', az: 'İstehlak olunan O₂' },
  eclssCo2: { en: 'CO₂ produced', az: 'Yaranan CO₂' },
  eclssWater: { en: 'ISS water recovery', az: 'BKS-də suyun bərpası' },
  careerLimit: { en: 'NASA career effective-dose limit', az: 'NASA-nın karyera üzrə effektiv doza həddi' },
  perCrewDay: { en: 'kg / crew-day', az: 'kq / ekipaj-gün' },
  sunVisible: { en: 'Sun visible %', az: 'Görünən Günəş %' },
  surfaceTemp: { en: 'Surface temp (K)', az: 'Səth temperaturu (K)' },
  missionHour: { en: 'Mission hour', az: 'Missiya saatı' },
  protonFlux: { en: 'Proton flux ≥10 MeV (pfu)', az: 'Proton axını ≥10 MeV (pfu)' },
  doseRateSuit: { en: 'EVA suit mSv/h', az: 'Skafandr mSv/saat' },
  doseRateHab: { en: 'Habitat mSv/h', az: 'Yaşayış modulu mSv/saat' },
  citations: { en: 'Citations', az: 'İstinadlar' },
  parameter: { en: 'Parameter', az: 'Parametr' },
  value: { en: 'Value', az: 'Dəyər' },
  why: { en: 'Why / basis', az: 'Niyə / əsas' },
  real: { en: 'REAL', az: 'REAL' },
  game: { en: 'GAME', az: 'OYUN' },

  // Audio controls
  soundOn: { en: 'SFX On', az: 'Səs Açıq' },
  soundMuted: { en: 'Muted', az: 'Səssiz' },

  // 2D Lunar Outpost Viewport
  viewportTitle: {
    en: 'Shackleton Rim 2D Mission Twin · Fictional training site',
    az: 'Şeklton Kənarı 2D Missiya Əkizi · Uydurma təlim məkanı',
  },
  viewportSubtitle: {
    en: 'Click any glowing engineering hotspot on the lunar surface to inspect how NASA science keeps the crew alive.',
    az: 'NASA elminin ekipajı necə sağ saxladığını öyrənmək üçün Ay səthindəki işıqlı mühəndislik nöqtələrinə klikləyin.',
  },
  singleView: { en: 'Single View', az: 'Tək Görünüş' },
  splitCompare: {
    en: 'Split Compare (Run A vs. Run B)',
    az: 'İkili Müqayisə (A və B Gedişi)',
  },
  surfaceTempLabel: { en: 'Surface Temp', az: 'Səth Temperaturu' },
  solarGrazingLabel: { en: '1.5° Grazing Sun', az: '1.5° Üfüqi Günəş' },
  shackletonCraterLabel: {
    en: 'Shackleton Cold Trap (21 km wide · 4.2 km deep · ~90 K)',
    az: 'Şeklton Soyuq Tələsi (21 km en · 4.2 km dərinlik · ~90 K)',
  },
  earthHorizon: { en: 'Earth on Horizon', az: 'Üfüqdə Yer' },
  solarMast10m: { en: '10 m Tall Mast (40% shadow output)', az: '10 m Hündür Dirək (kölgədə 40% güc)' },
  deckPanelsLow: { en: 'Low Deck Panels (15% in shadow)', az: 'Alçaq Panellər (kölgədə 15% güc)' },
  batteryOnlyMode: { en: 'Battery-Only (Arrays Stowed)', az: 'Yalnız Batareya (Panellər Bağlı)' },
  fuelCellActive: { en: 'H₂/O₂ Fuel Cells Active (+18 kWh)', az: 'H₂/O₂ Yanacaq Elementləri Aktiv (+18 kVt·s)' },
  regolithBermBuilt: { en: 'Regolith Berm Shield (6% dose)', az: 'Reqolit Qoruyucu Səddi (6% doza)' },
  waterWallShield: { en: 'Water-Wall Dome Shield (15% dose)', az: 'Su Divarı Qoruyucu Günbəzi (15% doza)' },
  isruPlantActive: { en: 'ISRU O₂ Extractor', az: 'ISRU O₂ Qurğusu' },
  habNominal: { en: 'ECLSS Nominal · Warm Cyan', az: 'ECLSS Normal · İsti Mavi' },
  habBrownout: { en: 'BROWNOUT (<20 kWh) · Heaters Throttled', az: 'ENERJİ ÇATIŞMAZLIĞI (<20 kVt·s) · Qızdırıcı Zəifləyib' },
  habAbort: { en: 'BLACKOUT / ABORT · Emergency Beacons', az: 'TAM KƏSİLMƏ / TƏXİRƏ SALMA · Qəza Siqnalları' },
  crisisShadowBanner: {
    en: 'SCENARIO: 72 HOURS OF RIDGE SHADOW · Reduced solar generation',
    az: 'SSENARİ: 72 SAAT SİLSİLƏ KÖLGƏSİ · Günəş enerjisi istehsalı azalır',
  },
  crisisStormBanner: {
    en: 'SCENARIO: PARTICLE STORM · Choose a shielding strategy',
    az: 'SSENARİ: ZƏRRƏCİK FIRTINASI · Qorunma variantını seçin',
  },
  hotspotPrompt: {
    en: '4 Interactive Hotspots: Click [1] Solar Peak · [2] Habitat Dome · [3] Cold-Trap Rover · [4] Storm Shelter',
    az: '4 İnteraktiv Nöqtə: Klikləyin [1] Günəş Zirvəsi · [2] Yaşayış Günbəzi · [3] Krater Roveri · [4] Fırtına Sığınacağı',
  },
  howItWorksMoon: { en: 'How It Works on the Moon', az: 'Ayda Necə İşləyir' },
  realNasaMeasurement: { en: 'Real NASA Physical Measurement', az: 'Real NASA Fiziki Ölçməsi' },
  whyItMattersSurvival: { en: 'Why It Matters for Astronaut Survival', az: 'Astronavtların Sağ Qalması Üçün Niyə Vacibdir' },

  // Badges & Classroom Tour Bar
  badgesAndTourTitle: {
    en: 'Junior Astronaut Engineering Badges & Classroom Quick-Tour',
    az: 'Gənc Astronavt Mühəndislik Nişanları və Sinif Bələdçisi',
  },
  tourJumpLabel: { en: 'Jump to NASA Crisis / Demo:', az: 'NASA Böhranına / Demoya Keçid:' },
  tourD3Shadow: { en: 'Inspect D3 LRO 72h Shadow (90 K)', az: 'Q3 LRO 72s Kölgəsinə Bax (90 K)' },
  tourD4Rover: { en: 'Inspect D4 Cold-Trap Ice Rover', az: 'Q4 Soyuq Tələ Roverinə Bax' },
  tourD5Storm: { en: 'Inspect D5 training particle storm', az: 'D5 təlim zərrəcik fırtınasına bax' },
  tourSplitDemo: { en: 'Compare Blackout vs. Fuel Cell Save', az: 'Enerji Kəsilməsi və Yanacaq Elementi Müqayisəsi' },
  earnedInRunA: { en: 'Earned in Run A', az: 'A Gedişində Qazanıldı' },
  earnedInRunB: { en: 'Earned in Run B', az: 'B Gedişində Qazanıldı' },
  lockedBadge: { en: 'Not yet unlocked', az: 'Hələ açılmayıb' },

  // What-If Forecast & Hypothesis
  whatIfForecast: { en: 'Simulation Forecast (Before → Projected After)', az: 'Simulyasiya Proqnozu (Əvvəl → Gözlənilən Sonra)' },
  hypothesisTitle: { en: "Commander's Science Hypothesis", az: 'Komandirin Elmi Hipotezi' },
  hypothesisPrompt: { en: 'Will the battery stay at or above 20 kWh throughout this phase?', az: 'Bu mərhələdə batareya bütün vaxt ərzində 20 kVt·saat və ya yuxarıda qalacaq?' },
  hypothesisYes: { en: 'Yes, battery remains safe (≥20 kWh)', az: 'Bəli, batareya təhlükəsiz qalacaq (≥20 kVt·s)' },
  hypothesisNo: { en: 'No, battery will drop under 20 kWh', az: 'Xeyr, batareya 20 kVt·s-dən aşağı düşəcək' },
  hypothesisCorrect: { en: 'Hypothesis Confirmed by Physics!', az: 'Fizika ilə Təsdiqlənmiş Hipotez!' },
  hypothesisIncorrect: { en: 'Physical Outcome Diverged:', az: 'Fiziki Nəticə Fərqləndi:' },
  projectedEnv: { en: 'Phase Environment Physics', az: 'Mərhələ Mühit Fizikası' },
  ruleWarningHazard: { en: 'Flight Rule Hazard Triggered', az: 'Uçuş Qaydası Təhlükəsi Yarandı' },

  // Live NASA Surface Physics HUD
  livePhysicsTitle: { en: 'Live NASA Surface Physics · Shackleton Rim', az: 'Canlı NASA Səth Fizikası · Şeklton Kənarı' },
  lolaSunLabel: { en: 'LOLA Solar Elevation', az: 'LOLA Günəş Bucağı' },
  divinerTempLabel: { en: 'Diviner Temp', az: 'Diviner Temperaturu' },
  donkiFluxLabel: { en: 'DONKI Proton Flux', az: 'DONKI Proton Axını' },
  crewMassBalanceLabel: { en: 'Crew Consumables', az: 'Ekipaj Sərfi' },

  // Quick Guided Onboarding
  guideTitle: { en: 'Mission guide', az: 'Missiya bələdçisi' },
  guideStart: {
    en: 'Keep two astronauts safe for nine days near Shackleton crater. Start at D1, the solar rim.',
    az: 'Şeklton krateri yaxınlığında iki astronavtı doqquz gün təhlükəsiz saxlayın. D1 günəş stansiyasından başlayın.',
  },
  guideAtSolar: {
    en: 'You reached the solar station. Press E to open the console and compare the three options.',
    az: 'Günəş stansiyasına çatdınız. Konsolu açmaq və üç variantı müqayisə etmək üçün E düyməsini basın.',
  },
  guideAfterChoice: {
    en: 'Read your last result, then compare options at the next station.',
    az: 'Son nəticəyə baxın, sonra növbəti stansiyadakı variantları müqayisə edin.',
  },
  guideReplay: {
    en: 'Open Rewind & Compare [R], pick one past decision, and see what changes when you try a different option.',
    az: 'Geri Sar və Müqayisə Et [R] bölməsini aç, əvvəlki qərarlardan birini seç və başqa variantın nəticəsini yoxla.',
  },
  dismissGuide: { en: 'Hide guide', az: 'Bələdçini gizlət' },
  jumpToActive: { en: 'Go to station', az: 'Stansiyaya get' },
  openConsole: { en: 'Open console', az: 'Konsolu aç' },

  // Championship Tools & Modals
  judgeTourButton: { en: 'Guided Demo', az: 'Bələdçili Demo' },
  sensorDeckButton: { en: 'Science & Sources', az: 'Elm və mənbələr' },
  exportCertificateButton: { en: 'Flight Certificate', az: 'Uçuş Sertifikatı' },
  achievementsButton: { en: 'Honors & Badges', az: 'Medallar və Nailiyyətlər' },
  samplesButton: { en: 'Field Samples', az: 'Sahə Nümunələri' },
  rescueBannerTitle: { en: 'Causal Crisis Detected · Mission Rescue Available', az: 'Böhran Aşkarladı · Missiyanı Xilas Etmək Mümkündür' },
  rescueBannerAction: { en: 'Rewind D3 to Fuel Cells & Rescue Mission (+54 pts)', az: 'D3-ü Yanacaq Elementlərinə Dəyiş və Missiyanı Xilas Et (+54 xal)' },
} as const;

export type StringKey = keyof typeof STRINGS;
