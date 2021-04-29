
const DEFAULT_DOMAIN = 'https://skytransfer.hns.siasky.net';
const SKYTRANSFER_SUBDOMAIN = 'skytransfer.hns';
const  knownPortals: readonly Portal[] = [
    {
        domain:'siasky.net',
        displayName:'Siasky.net'
    },
    {
        domain: 'skyportal.xyz',
        displayName: 'SkyPortal.xyz'
    },
    /* It does not work 
     {
        domain: 'skydrain.net',
        displayName: 'Skydrain.net'
    }, */
];

export interface Portal {
    domain: string;
    displayName: string;
  }

const currentDomain = (): string => {
    return window.location.hostname.replace(SKYTRANSFER_SUBDOMAIN+'.', '')
};

const isLocalhost = (): boolean => {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return true;
    }

    return false
}

export class Portals {
    static current(): Portal {
        for(let portal of knownPortals) {
            if (portal.domain === currentDomain()) {
                return portal
            }
        }
        
        return {
            domain: currentDomain(),
            displayName: currentDomain().replace(/\b\w/g, x => x.toUpperCase())
        }
    }

    static alternatives(): Portal[] {
        return knownPortals.filter(x => x.domain !== currentDomain())
    }

    static getUploadEndpoint(): string {
        return isLocalhost() ? `${DEFAULT_DOMAIN}/skynet/skyfile` : `${Portals.getEndpoint()}/skynet/skyfile`;
    }

    static getEndpoint(): string {
        return isLocalhost() ? DEFAULT_DOMAIN : Portals.getEndpointInPortal(Portals.current());
    }

    static getEndpointInPortal(portal: Portal): string {
        return `https://${SKYTRANSFER_SUBDOMAIN}.${portal.domain}`;
    }
}