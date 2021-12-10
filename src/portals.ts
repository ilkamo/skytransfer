export interface Portal {
  domain: string;
  displayName: string;
}

const knownPortals: readonly Portal[] = [
  {
    domain: 'siasky.net', // https://github.com/SkynetLabs/skynet-js/issues/89
    displayName: 'Siasky.net'
  },
  {
    domain: 'skyportal.xyz',
    displayName: 'SkyPortal.xyz'
  },
  {
    domain: 'skydrain.net',
    displayName: 'Skydrain.net'
  },
  {
    domain: 'siasky.dev',
    displayName: 'Siasky.dev'
  },
];

const LOCAL_STORAGE_KEY = 'CHOSEN_PORTAL_DOMAIN_V2';

export const getDefaultPortal = (): Portal => {
  return knownPortals[0];
};

export const getCurrentPortal = (): Portal => {
  const portalDomain = localStorage.getItem(LOCAL_STORAGE_KEY);

  for (let portal of knownPortals) {
    if (portal.domain === portalDomain) {
      return portal
    }
  }

  return getDefaultPortal();
};

export const getUploadEndpoint = (): string => {
  return `https://${getCurrentPortal().domain}/skynet/skyfile`;
}

export const getTusUploadEndpoint = (): string => {
  return `https://${getCurrentPortal().domain}/skynet/tus`;
}

export const getEndpointInCurrentPortal = (): string => {
  return `https://${getCurrentPortal().domain}`;
}

export const getEndpointInDefaultPortal = (): string => {
  return `https://${getDefaultPortal().domain}`;
}

export const setPortalWithDomain = (domain: string) => {
  const portal = knownPortals.find(x => x.domain === domain);
  if (portal !== undefined) {
    localStorage.setItem(LOCAL_STORAGE_KEY, portal.domain);
  }
}

export const getMySkyDomain = (): string => {
  let mySkyPortal = '';
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    mySkyPortal = `https://${getDefaultPortal().domain}`;
  }

  return mySkyPortal;
}

export const getPortals = (): readonly Portal[] => knownPortals;