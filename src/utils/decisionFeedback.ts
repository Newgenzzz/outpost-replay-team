import type { StepRecord } from '../engine/simulation';
import type { Bilingual } from '../types';

/** Explain recorded results rather than promising an outcome from the option name. */
export function decisionConsequenceFeedback(step: StepRecord): { warn: boolean; text: Bilingual } {
  const number = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);
  if (step.env.lowPowerHours > 0) {
    return {
      warn: true,
      text: {
        en: `Dipped below 20 kWh for ${number(step.env.lowPowerHours)} h — habitat lights dimmed`,
        az: `${number(step.env.lowPowerHours)} saat 20 kVt·s-dən aşağı — yaşayış modulu işıqları zəiflədi`,
      },
    };
  }
  if (step.choiceId === 'D3-B') {
    return {
      warn: false,
      text: {
        en: `Backup fuel cells supplied ${number(step.env.supplementalGenerationKwh)} kWh during this phase`,
        az: `Ehtiyat yanacaq elementləri bu mərhələdə ${number(step.env.supplementalGenerationKwh)} kVt·s enerji verdi`,
      },
    };
  }
  if (step.choiceId === 'D1-A') {
    return {
      warn: false,
      text: {
        en: '10 m tall mast locked · the training model starts shadow output at 40%, before pointing losses',
        az: '10 m şaquli dirək · təlimdə kölgə hasilatı yönəlmə itkilərindən əvvəl 40% götürülür',
      },
    };
  }
  if (step.choiceId === 'D5-C') {
    const berm = step.flagsBefore.includes('regolithBerm');
    return {
      warn: false,
      text: {
        en: `${berm ? 'Regolith-berm' : 'Water-wall'} shelter · ${number(step.delta.radiationMsv)} mSv modeled dose this phase. Shielding is a training assumption.`,
        az: `${berm ? 'Reqolit səddli' : 'Su divarlı'} sığınacaq · bu mərhələdə ${number(step.delta.radiationMsv)} mSv model dozası. Qorunma təlim fərziyyəsidir.`,
      },
    };
  }
  return {
    warn: false,
    text: {
      en: 'Battery reserve stayed at or above the model’s 20 kWh threshold',
      az: 'Batareya ehtiyatı modelin 20 kVt·s həddində və ya yuxarıda qaldı',
    },
  };
}
