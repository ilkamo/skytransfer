export interface Portal {
  domain: string;
  displayName: string;
}

const knownPortals: readonly Portal[] = [
  {
    domain: 'siasky.net',
    displayName: 'siasky.net',
  },
  {
    domain: 'fileportal.org',
    displayName: 'fileportal.org',
  },
  {
    domain: 'skynetfree.net',
    displayName: 'skynetfree.net',
  },
  {
    domain: 'skynetpro.net',
    displayName: 'skynetpro.net',
  },
];

export const getDefaultPortal = (): Portal => {
  return knownPortals[0];
};

export const getCurrentPortal = (): Portal => {
  const portalDomain = window.location.hostname.replace('skytransfer.hns.', '');

  for (let portal of knownPortals) {
    if (portal.domain === portalDomain) {
      return portal;
    }
  }

  return getDefaultPortal();
};

export const getTusUploadEndpoint = (): string => {
  return `https://${getCurrentPortal().domain}/skynet/tus`;
};

export const getEndpointInCurrentPortal = (): string => {
  return `https://${getCurrentPortal().domain}`;
};

export const getPortals = (): readonly Portal[] => knownPortals;
