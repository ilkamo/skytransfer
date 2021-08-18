import { ReactComponent as ChangePortalSVG } from '../../images/change-portal.svg';
import { ReactComponent as SupportUsSVG } from '../../images/support.svg';
import { ReactComponent as SmileSVG } from '../../images/smile.svg';
import { ReactComponent as HomescreenSVG } from '../../images/homescreen.svg';

import './icons.css';

import Icon from '@ant-design/icons';

export const ChangePortalIcon = () => <Icon component={ChangePortalSVG} />;
export const SupportUsIcon = () => (
  <Icon className="support" component={SupportUsSVG} />
);
export const SmileIcon = () => (
  <Icon className="friends" component={SmileSVG} />
);
export const HomescreenIcon = () => (
  <Icon className="homescreen" component={HomescreenSVG} />
);
