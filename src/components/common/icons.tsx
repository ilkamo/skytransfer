import ChangePortalSVG from '../../images/change-portal.svg';
import SupportUsSVG from '../../images/support.svg';
import SmileSVG from '../../images/smile.svg';
import HomescreenSVG from '../../images/homescreen.svg';
import SkyTransferSVG from '../../images/skytransfer-logo.svg';

import './icons.css';

import Icon from '@ant-design/icons';

export const ChangePortalIcon = () => {
  const component = () => <ChangePortalSVG />;
  return <Icon component={component} />;
}

export const SupportUsIcon = () => {
  const component = () => <SupportUsSVG />;
  return <Icon className="support" component={component} />;
}

export const SmileIcon = () => {
  const component = () => <SmileSVG />;
  return <Icon className="friends" component={component} />;
}

export const HomescreenIcon = () => {
  const component = () => <HomescreenSVG />;
  return <Icon className="homescreen" component={component} />;
}

export const SkyTransferLogo = () => {
  const component = () => <SkyTransferSVG />;
  return <Icon className="skytransfer-logo" component={component} />;
}
