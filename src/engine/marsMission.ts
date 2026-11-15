/**
 * Bonus Mission 2: Mars Jezero Global Dust Storm & 14-Minute Comms Delay (3 Sols / 74 hours).
 *
 * Bridges Lunar South Pole architecture to Mars surface survival as highlighted by the
 * 2026 NASA Space Apps "Build a Junior Astronaut Mission Trainer" challenge:
 * - Atmospheric dust optical depth (tau 0.4 -> 4.2) attenuates solar power by 82% (NASA InSight / Opportunity lessons)
 * - Diurnal -63 °C cold nights require continuous habitat thermal regulation (NASA Perseverance MEDA)
 * - MOXIE solid-oxide electrolysis converts Martian CO2 atmosphere into breathable O2 at heavy power cost
 * - 14-minute one-way light-time radio delay between Mars and Earth forces crew autonomy
 */

import type { Bilingual } from '../types';

export interface MarsChoice {
  id: string;
  label: Bilingual;
  cadetSummary: Bilingual;
  engineerNote: Bilingual;
  powerDeltaKwh: number;
  oxygenDeltaKg: number;
  waterDeltaKg: number;
  scienceDelta: number;
  setsFlag?: 'dustWiperRig' | 'moxieBoost' | 'thermalHibernate';
  conditionalBonus?: {
    ifFlag: 'dustWiperRig' | 'moxieBoost' | 'thermalHibernate';
    powerDeltaKwh?: number;
    oxygenDeltaKg?: number;
    scienceDelta?: number;
    note: Bilingual;
  };
}

export interface MarsSolDecision {
  sol: 1 | 2 | 3;
  title: Bilingual;
  opticalDepthTau: number;
  solarAttenuationPct: number;
  ambientNightTempC: number;
  commsDelayMinutes: number;
  context: Bilingual;
  earthRadioDelayedMsg: Bilingual;
  nasaCitation: string;
  choices: [MarsChoice, MarsChoice, MarsChoice];
}

export const MARS_DECISIONS: MarsSolDecision[] = [
  {
    sol: 1,
    title: {
      en: 'Sol 1 · Regional Dust Front Enters Jezero Crater',
      az: 'Sol 1 · Regional Toz Cəbhəsi Yezero Kraterinə Daxil Olur',
    },
    opticalDepthTau: 1.8,
    solarAttenuationPct: 52,
    ambientNightTempC: -61,
    commsDelayMinutes: 14,
    context: {
      en: 'MEDA wind sensors detect a fast-rising dust wall from Syrtis Major. Sky opacity (tau) just jumped to 1.8, cutting solar charging in half. Any message to Houston takes 14 minutes each way — 28 minutes for an answer!',
      az: 'MEDA külək sensorları Sirtis Mayordan sürətlə qalxan toz divarını qeydə alır. Göyün tutqunluğu (tau) 1,8-ə qalxaraq günəş enerjisini yarıbayarı azaldıb. Hyustona hər mesaj bir istiqamətdə 14 dəqiqə çəkir — cavab üçün 28 dəqiqə lazımdır!',
    },
    earthRadioDelayedMsg: {
      en: '[Received +28m late from Houston CapCom]: "Jezero Base, orbital MARCI imagery confirms the regional storm is going global. Prioritize array tilt or O₂ buffer before tau exceeds 4.0!"',
      az: '[Hyuston CapCom-dan +28 dəq gecikmə ilə alındı]: "Yezero Bazası, orbital MARCI görüntüləri fırtınanın qloballaşdığını təsdiqləyir. Tau 4,0-ı keçməzdən əvvəl panelləri təmizləyin və ya O₂ ehtiyatı toplayın!"',
    },
    nasaCitation: 'NASA Mars 2020 Perseverance MEDA (Rodriguez-Manfredi et al. 2021) & InSight Dust Attenuation',
    choices: [
      {
        id: 'M1-A',
        label: {
          en: 'Rig electrostatic & tilt-wiper struts on the solar wings',
          az: 'Günəş qanadlarında elektrostatik və maili təmizləyici dayaqlar qurun',
        },
        cadetSummary: {
          en: 'Costs battery energy today (−8 kWh), but shakes fine Martian dust off your panels so tomorrow’s blackout is much gentler!',
          az: 'Bu gün enerjidən bir az istifadə edir (−8 kVt·s), amma sabah fırtına pikə çatanda panelləri tozdan qoruyur!',
        },
        engineerNote: {
          en: 'EVA rig reduces dust settling losses during Sol 2 peak tau = 4.2, recovering +14 kWh downstream.',
          az: 'Sol 2-də pik tau = 4,2 zamanı toz çöküntüsünü azaldır və sonradan +14 kVt·s enerji qazandırır.',
        },
        powerDeltaKwh: -8,
        oxygenDeltaKg: -0.6,
        waterDeltaKg: -0.4,
        scienceDelta: 6,
        setsFlag: 'dustWiperRig',
      },
      {
        id: 'M1-B',
        label: {
          en: 'Overdrive MOXIE to crack Martian CO₂ atmosphere into extra O₂',
          az: 'Marsın CO₂ atmosferindən əlavə O₂ almaq üçün MOXIE qurğusunu gücləndirin',
        },
        cadetSummary: {
          en: 'Bakes Mars air at 800 °C to fill your oxygen tanks (+2.4 kg O₂), using heavy battery power (−14 kWh).',
          az: 'Mars havasını 800 °C-də emal edərək oksigen çənlərini doldurur (+2,4 kq O₂), lakin çox enerji işlədir (−14 kVt·s).',
        },
        engineerNote: {
          en: 'Solid-oxide electrolysis (800 °C) banks +2.4 kg O₂ (NASA MOXIE architecture) at −14 kWh battery draw.',
          az: 'Bərk-oksid elektrolizi (800 °C) −14 kVt·s batareya sərfi ilə +2,4 kq O₂ ehtiyatı yaradır.',
        },
        powerDeltaKwh: -14,
        oxygenDeltaKg: 2.4,
        waterDeltaKg: -0.2,
        scienceDelta: 10,
        setsFlag: 'moxieBoost',
      },
      {
        id: 'M1-C',
        label: {
          en: 'Sprint rover to Neretva Vallis delta outcrop before visibility drops',
          az: 'Görünüş itməzdən əvvəl Neretva Vallis deltasına sürətli rover səfəri edin',
        },
        cadetSummary: {
          en: 'Grabs awesome ancient river rocks (+18 Science!), but drains batteries and oxygen right before the dark storm hits.',
          az: 'Qədim çay süxurlarını toplayır (+18 Elm!), lakin qaranlıq fırtınadan əvvəl batareyanı və oksigeni azaldır.',
        },
        engineerNote: {
          en: 'High biosignature science (+18 pts), but −16 kWh and −1.1 kg suit O₂ leave narrow Sol 2 margin.',
          az: 'Yüksək bioimza elmi (+18 xal), lakin −16 kVt·s və −1,1 kq skafandr O₂ sərfi Sol 2 üçün risk yaradır.',
        },
        powerDeltaKwh: -16,
        oxygenDeltaKg: -1.1,
        waterDeltaKg: -0.6,
        scienceDelta: 18,
      },
    ],
  },
  {
    sol: 2,
    title: {
      en: 'Sol 2 · Global Dust Peak (Tau 4.2 · −82% Sunlight)',
      az: 'Sol 2 · Qlobal Toz Piki (Tau 4,2 · −82% Günəş İşığı)',
    },
    opticalDepthTau: 4.2,
    solarAttenuationPct: 82,
    ambientNightTempC: -68,
    commsDelayMinutes: 14,
    context: {
      en: 'Noon looks like rusty twilight! Dust blocks 82% of sunlight (just like the storm that ended NASA’s Opportunity rover). Outside is −68 °C, and habitat heaters are gulping battery reserves.',
      az: 'Günorta paslı alatoranlığa bənzəyir! Toz günəş işığının 82%-ni kəsir (NASA-nın Opportunity roverini dayandıran fırtına kimi). Çöldə −68 °C şaxta var və qızdırıcılar batareyanı sürətlə boşaldır.',
    },
    earthRadioDelayedMsg: {
      en: '[Received +28m late from Houston CapCom]: "Telemetry shows deep voltage sag across Jezero. You cannot wait for Earth commands — execute autonomous load-shedding immediately!"',
      az: '[Hyuston CapCom-dan +28 dəq gecikmə ilə alındı]: "Telemetriya Yezeroda gərginliyin kəskin düşdüyünü göstərir. Yerdən əmr gözləməyin — dərhal avtonom qənaət rejiminə keçin!"',
    },
    nasaCitation: 'NASA Opportunity 2018 Global Dust Storm (tau > 4) & NASA BVAD Crew Thermal Loads',
    choices: [
      {
        id: 'M2-A',
        label: {
          en: 'Autonomous thermal hibernation — heat only the crew sleep core',
          az: 'Avtonom istilik yuxusu — yalnız ekipajın mərkəzi bölməsini qızdırın',
        },
        cadetSummary: {
          en: 'Huddles the crew in a cozy insulated tent inside the hab to save huge heater power (+12 kWh saved)!',
          az: 'Böyük qızdırıcı enerjisinə qənaət etmək üçün ekipajı izolyasiyalı mərkəzi bölməyə toplayır (+12 kVt·s qənaət)!',
        },
        engineerNote: {
          en: 'Cuts lab heater load (+12 kWh net vs baseline). Pairs with Sol 1 dust wiper rig (+14 kWh cleared solar).',
          az: 'Laboratoriya qızdırıcı yükünü azaldır (+12 kVt·s). Sol 1 toz təmizləyicisi ilə əlavə +14 kVt·s verir.',
        },
        powerDeltaKwh: -6,
        oxygenDeltaKg: -0.8,
        waterDeltaKg: -0.4,
        scienceDelta: 4,
        setsFlag: 'thermalHibernate',
        conditionalBonus: {
          ifFlag: 'dustWiperRig',
          powerDeltaKwh: 14,
          scienceDelta: 3,
          note: {
            en: 'Sol 1 tilt-wiper struts shed settled dust (+14 kWh solar trickle recovered)',
            az: 'Sol 1 təmizləyici dayaqları çökən tozu təmizlədi (+14 kVt·s günəş enerjisi bərpa olundu)',
          },
        },
      },
      {
        id: 'M2-B',
        label: {
          en: 'Burn emergency methane-oxygen fuel cell for full lab & atmospheric radar',
          az: 'Tam laboratoriya və atmosfer radarı üçün qəza metan-oksigen yanacaq elementini yandırın',
        },
        cadetSummary: {
          en: 'Keeps the lights warm and radar running (+14 Science), but burns precious breathable oxygen (−1.2 kg O₂)!',
          az: 'İstiliyi və radarı işlək saxlayır (+14 Elm), lakin qiymətli nəfəs oksigenini yandırır (−1,2 kq O₂)!',
        },
        engineerNote: {
          en: 'CH₄/O₂ fuel cell stabilizes bus (+6 kWh) and logs storm profile (+14 pts), consuming 1.2 kg O₂ oxidizer. Safe if MOXIE ran on Sol 1!',
          az: 'CH₄/O₂ yanacaq elementi şini sabitləşdirir (+6 kVt·s) və +14 elm xalı verir, lakin 1,2 kq O₂ sərf edir. Sol 1-də MOXIE işləyibsə təhlükəsizdir!',
        },
        powerDeltaKwh: 6,
        oxygenDeltaKg: -1.8,
        waterDeltaKg: 0.5,
        scienceDelta: 14,
        conditionalBonus: {
          ifFlag: 'moxieBoost',
          oxygenDeltaKg: 0.8,
          scienceDelta: 4,
          note: {
            en: 'Sol 1 MOXIE buffer supplies fuel-cell oxidizer without straining cabin air (+0.8 kg O₂ margin)',
            az: 'Sol 1 MOXIE ehtiyatı kabin havasını azaltmadan yanacaq elementini qidalandırdı (+0,8 kq O₂ marjası)',
          },
        },
      },
      {
        id: 'M2-C',
        label: {
          en: 'Keep full habitat & drill heaters online without shedding loads',
          az: 'Yükləri azaltmadan bütün yaşayış modulu və qazma qızdırıcılarını açıq saxlayın',
        },
        cadetSummary: {
          en: 'Tries to do everything in the dark freezing dust — risks draining your main battery to zero!',
          az: 'Qaranlıq və şaxtalı tozda hər şeyi işlətməyə çalışır — əsas batareyanın sıfırlanması riski var!',
        },
        engineerNote: {
          en: 'Unthrottled −68 °C thermal loss drains −26 kWh under 82% solar attenuation.',
          az: '82% günəş azalması altında −68 °C istilik itkisi batareyadan −26 kVt·s çəkir.',
        },
        powerDeltaKwh: -26,
        oxygenDeltaKg: -0.9,
        waterDeltaKg: -0.5,
        scienceDelta: 11,
      },
    ],
  },
  {
    sol: 3,
    title: {
      en: 'Sol 3 · Clearing Skies & Delayed Orbital Relay Window',
      az: 'Sol 3 · Açılan Səma və Gecikmiş Orbital Ötürmə Pəncərəsi',
    },
    opticalDepthTau: 1.1,
    solarAttenuationPct: 30,
    ambientNightTempC: -58,
    commsDelayMinutes: 14,
    context: {
      en: 'Mars Reconnaissance Orbiter passes overhead for 18 minutes! Because Earth is 14 light-minutes away, you must package your own telemetry and safeguard crew reserves before the pass ends.',
      az: 'Mars Kəşfiyyat Orbiteri 18 dəqiqəlik başınızın üstündən keçir! Yer 14 işıq-dəqiqəsi uzaqda olduğu üçün keçid bitməzdən əvvəl telemetriyanı özünüz paketləməli və ehtiyatları qorumalısınız.',
    },
    earthRadioDelayedMsg: {
      en: '[Received +28m late from Houston CapCom]: "Outstanding autonomy, Jezero Crew! MRO relay locked your storm packet — your dust-power trade-off logs will train future Artemis-to-Mars crews."',
      az: '[Hyuston CapCom-dan +28 dəq gecikmə ilə alındı]: "Möhtəşəm avtonomluq, Yezero Ekipajı! MRO peyki fırtına paketini qəbul etdi — qərarlarınız gələcək Mars ekipajlarını öyrədəcək."',
    },
    nasaCitation: 'NASA Mars Relay Network (MRO Electra UHF) & Deep Space Network Light-Time Protocol',
    choices: [
      {
        id: 'M3-A',
        label: {
          en: 'Balanced UHF burst to MRO + closed-loop life-support recovery',
          az: 'MRO peykinə balanslı UHF ötürməsi + qapalı həyat təminatı bərpası',
        },
        cadetSummary: {
          en: 'Beams your storm discoveries up to the Mars orbiter (+12 Science) while keeping plenty of battery and air!',
          az: 'Kifayət qədər batareya və hava saxlayaraq fırtına kəşflərini Mars peykinə ötürür (+12 Elm)!',
        },
        engineerNote: {
          en: 'Optimal UHF Electra relay (−7 kWh, +12 science) while keeping crew O₂ and battery above safe reserves.',
          az: 'Ekipajın O₂ və batareya ehtiyatını qoruyaraq optimal UHF Electra ötürməsi (−7 kVt·s, +12 elm).',
        },
        powerDeltaKwh: -7,
        oxygenDeltaKg: -0.7,
        waterDeltaKg: -0.3,
        scienceDelta: 12,
        conditionalBonus: {
          ifFlag: 'dustWiperRig',
          powerDeltaKwh: 6,
          scienceDelta: 4,
          note: {
            en: 'Clean solar wings recharge rapidly as tau drops to 1.1 (+6 kWh, +4 science)',
            az: 'Təmiz günəş qanadları tau 1,1-ə düşəndə sürətlə dolur (+6 kVt·s, +4 elm)',
          },
        },
      },
      {
        id: 'M3-B',
        label: {
          en: 'Deploy Ingenuity-class scout rotorcraft into clearing canyon winds',
          az: 'Açılan kanyon küləklərində Ingenuity tipli kəşfiyyat dronunu uçurun',
        },
        cadetSummary: {
          en: 'Flies a Mars helicopter over freshly uncovered dunes (+20 Science!), using extra battery charge (−13 kWh).',
          az: 'Yeni açılmış təpələrin üzərində Mars helikopterini uçurur (+20 Elm!), əlavə enerji sərf edir (−13 kVt·s).',
        },
        engineerNote: {
          en: 'Thin ~0.015 bar CO₂ rotor flight + heaters draw −13 kWh for +20 high-res aerial science.',
          az: 'Nazik ~0,015 bar CO₂ atmosferində uçuş və qızdırıcılar +20 yüksək elmi xal üçün −13 kVt·s sərf edir.',
        },
        powerDeltaKwh: -13,
        oxygenDeltaKg: -0.8,
        waterDeltaKg: -0.4,
        scienceDelta: 20,
      },
      {
        id: 'M3-C',
        label: {
          en: 'Emergency reserve lock — minimum beacon only, recharge all tanks',
          az: 'Qəza ehtiyatı kilidi — yalnız minimum маяk, bütün çənləri doldurun',
        },
        cadetSummary: {
          en: 'Plays it super safe: recharges batteries (+10 kWh) and air (+0.5 kg O₂), sending only a tiny summary.',
          az: 'Maksimum təhlükəsizlik: batareyanı (+10 kVt·s) və havanı (+0,5 kq O₂) bərpa edir, yalnız qısa hesabat göndərir.',
        },
        engineerNote: {
          en: 'Recovers +10 kWh solar margin and +0.5 kg MOXIE O₂ trickle, minimal +4 science.',
          az: '+10 kVt·s günəş ehtiyatı və +0,5 kq MOXIE O₂ bərpa edir, minimum +4 elm.',
        },
        powerDeltaKwh: 10,
        oxygenDeltaKg: 0.5,
        waterDeltaKg: -0.2,
        scienceDelta: 4,
      },
    ],
  },
];

export interface MarsSimStep {
  sol: 1 | 2 | 3;
  choiceId: string;
  powerAfterKwh: number;
  oxygenAfterKg: number;
  waterAfterKg: number;
  scienceAfter: number;
  bonusTriggered: Bilingual | null;
}

export interface MarsSimResult {
  outcome: 'success' | 'degraded' | 'abort';
  abortReason: Bilingual | null;
  powerKwh: number;
  oxygenKg: number;
  waterKg: number;
  sciencePoints: number;
  score: number;
  steps: MarsSimStep[];
}

export const MARS_START = {
  powerKwh: 48,
  oxygenKg: 5.0,
  waterKg: 8.0,
};

export function runMarsSimulation(choiceIndices: number[]): MarsSimResult {
  let power = MARS_START.powerKwh;
  let oxygen = MARS_START.oxygenKg;
  let water = MARS_START.waterKg;
  let science = 0;
  const flags = new Set<'dustWiperRig' | 'moxieBoost' | 'thermalHibernate'>();
  const steps: MarsSimStep[] = [];
  let abortReason: Bilingual | null = null;

  for (let i = 0; i < Math.min(choiceIndices.length, MARS_DECISIONS.length); i++) {
    const decision = MARS_DECISIONS[i];
    const idx = choiceIndices[i] ?? 0;
    const choice = decision.choices[idx] ?? decision.choices[0];

    let pDelta = choice.powerDeltaKwh;
    let oDelta = choice.oxygenDeltaKg;
    const wDelta = choice.waterDeltaKg;
    let sDelta = choice.scienceDelta;
    let bonusTriggered: Bilingual | null = null;

    if (choice.conditionalBonus && flags.has(choice.conditionalBonus.ifFlag)) {
      pDelta += choice.conditionalBonus.powerDeltaKwh ?? 0;
      oDelta += choice.conditionalBonus.oxygenDeltaKg ?? 0;
      sDelta += choice.conditionalBonus.scienceDelta ?? 0;
      bonusTriggered = choice.conditionalBonus.note;
    }

    if (choice.setsFlag) {
      flags.add(choice.setsFlag);
    }

    power = Math.round(Math.min(70, power + pDelta) * 10) / 10;
    oxygen = Math.round(Math.max(0, oxygen + oDelta) * 100) / 100;
    water = Math.round(Math.max(0, water + wDelta) * 100) / 100;
    science += sDelta;

    steps.push({
      sol: decision.sol,
      choiceId: choice.id,
      powerAfterKwh: Math.max(0, power),
      oxygenAfterKg: oxygen,
      waterAfterKg: water,
      scienceAfter: science,
      bonusTriggered,
    });

    if (power <= 0) {
      power = 0;
      abortReason = {
        en: `Sol ${decision.sol}: Battery bus collapsed to 0 kWh during −68 °C Martian dust night.`,
        az: `Sol ${decision.sol}: −68 °C Mars toz gecəsində batareya şini 0 kVt·s-ə düşdü.`,
      };
      break;
    }
    if (oxygen <= 1.2) {
      abortReason = {
        en: `Sol ${decision.sol}: Breathable O₂ fell below the 1.2 kg crew safety floor (${oxygen.toFixed(1)} kg).`,
        az: `Sol ${decision.sol}: Nəfəs O₂ ehtiyatı 1,2 kq təhlükəsizlik həddindən aşağı düşdü (${oxygen.toFixed(1)} kq).`,
      };
      break;
    }
  }

  let outcome: MarsSimResult['outcome'] = 'success';
  if (abortReason) {
    outcome = 'abort';
  } else if (power < 12 || oxygen < 2.2) {
    outcome = 'degraded';
  }

  const score = abortReason
    ? Math.max(10, Math.round(science * 0.8))
    : Math.min(100, Math.round(science * 1.4 + power * 0.65 + oxygen * 4));

  return {
    outcome,
    abortReason,
    powerKwh: Math.max(0, power),
    oxygenKg: oxygen,
    waterKg: water,
    sciencePoints: science,
    score,
    steps,
  };
}
