import * as i18next from 'i18next';
import { en, ja } from './stringResources';
import { getConfigRoot } from './configUtil';

// Workaround; https://github.com/i18next/i18next/issues/1271
const i18Next: i18next.i18n = i18next as any as i18next.i18n;

let lng = 'en';

try {
  lng = getConfigRoot().language;
} catch (ex) {
  console.log(ex.message);
}

i18Next.init({
  lng,
  fallbackLng: 'en',
  resources: {
    en: {
      translation: en
    },
    ja: {
      translation: ja
    }
  }
});

export default function translateTaggedTemplate(strings: TemplateStringsArray, ...keys: string[]): string {
  return i18Next.t(strings.raw[0]);
}
