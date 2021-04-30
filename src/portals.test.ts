import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Portal, getDefaultPortal, getCurrentPortal, setPortalWithDomain, getAlternativePortals, getUploadEndpoint, getEndpoint } from './portals';

describe('Portals', () => {
    describe('getCurrentPortal()', () => {
        test('returns default portal when localstorage empty', () => {
            const result = getCurrentPortal();
            const expected: Portal = {
                domain: 'skytransfer.hns.siasky.net',
                displayName: 'Siasky.net'
            }


            expect(result).toEqual(expected);
        });

        test('returns returns correct portal based on localstorage', () => {
            setPortalWithDomain( 'skydrain.net');
            const expected: Portal = {
                domain: 'skydrain.net',
                displayName: 'Skydrain.net'
            }

            const result = getCurrentPortal();


            expect(result).toEqual(expected);
        });
    });

    describe('getAlternativePortals()', () => {
        test('returns correct values', () => {
            setPortalWithDomain('skydrain.net');
            const expected: Portal[] = [
                {
                    domain: 'skytransfer.hns.siasky.net',
                    displayName: 'Siasky.net'
                },
                {
                    domain: 'skytransfer.hns.skyportal.xyz',
                    displayName: 'SkyPortal.xyz'
                },
            ];
            const result = getAlternativePortals();


            expect(result).toEqual(expected);
        });
    });

    describe('getUploadEndpoint()', () => {
        test('returns endpoint based on current portal', () => {
            setPortalWithDomain('skytransfer.hns.skyportal.xyz');
            const expected = 'https://skytransfer.hns.skyportal.xyz/skynet/skyfile';
            const result = getUploadEndpoint();

            expect(result).toEqual(expected);
        });
    });

    describe('getEndpoint()', () => {
        test('returns endpoint based on default portal', () => {
            setPortalWithDomain('skytransfer.hns.skyportal.xyz');
            const expected = 'https://skytransfer.hns.siasky.net';
            const result = getEndpoint();

            expect(result).toEqual(expected);
        });
    });
});
