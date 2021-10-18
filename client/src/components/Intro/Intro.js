import "./Intro.scss";
import { useTranslation } from 'react-i18next';

export default function Intro() {
  const { t } = useTranslation();

  return (
    <div className="usa-prose">
      <p>{t('intro.description.paragraph1')}</p>
      <p>{t('intro.description.paragraph2')}</p>
    </div>
  );
}
