import "./Tips.scss";
import { useTranslation } from 'react-i18next';

export default function Tips() {
  const { t } = useTranslation();

  return (
    <div className="usa-prose">
      <p>{t('courtguide.intro')}</p>
      <ul>
        <li>{t('courtguide.item1')}</li>
        <li>{t('courtguide.item2')}</li>
        <li>{t('courtguide.item3')}</li>
        <li>{t('courtguide.item4')}</li>
        <li>{t('courtguide.item5')}</li>
        <li>{t('courtguide.item6')}</li>
      </ul>
      <p>{t('courtguide.if-miss')}</p>
      <p>{t('courtguide.pd-phone')}<br/>
      {t('courtguide.da-phone')}<br/>
      {t('courtguide.clerk-phone')}</p>
    </div>
  );
}
