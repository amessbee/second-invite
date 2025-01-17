// @ts-check
import { E } from '@endo/far';

console.warn('start proposal module evaluating');

/**
 * Core eval script to start contract
 *
 * @param {BootstrapPowers} permittedPowers
 */
export const startEdCertContract = async permittedPowers => {
  console.error('startEdCertContract()...');
  const {
    consume: { board, chainStorage, startUpgradable, zoe },
    brand: {
      consume: { IST: istBrandP },
      // @ts-expect-error dynamic extension to promise space
      produce: brandProducers,
    },
    issuer: {
      consume: { IST: istIssuerP },
      // @ts-expect-error dynamic extension to promise space
      produce: issueProducers,
    },
    installation: {
      consume: { secondInvite: edCertInstallationP },
    },
    instance: {
      // @ts-expect-error dynamic extension to promise space
      produce: { secondInvite: produceInstance },
    },
  } = permittedPowers;

  // print all the powers
  console.log(
    '**************************************************',
    permittedPowers,
  );

  const storageNode = await E(chainStorage).makeChildNode('secondInvite');
  const istIssuer = await istIssuerP;

  const terms = { maxCertificates: 100n };

  // agoricNames gets updated each time; the promise space only once XXXXXXX
  const installation = await edCertInstallationP;

  const { instance } = await E(startUpgradable)({
    installation,
    issuerKeywordRecord: { Price: istIssuer },
    label: 'secondInvite',
    terms,
    privateArgs: {
      storageNode,
      board,
    },
  });
  console.log('CoreEval script: started contract', instance);
  const { brands, issuers } = await E(zoe).getTerms(instance);

  console.log('CoreEval script: share via agoricNames:', {
    brands,
    issuers,
  });

  produceInstance.reset();
  produceInstance.resolve(instance);
  console.log('secondInvite (re)started');
};

/** @type { import("@agoric/vats/src/core/lib-boot").BootstrapManifest } */
const edCertManifest = {
  [startEdCertContract.name]: {
    consume: {
      agoricNames: true,
      board: true, // to publish boardAux info for NFT brand
      chainStorage: true, // to publish boardAux info for NFT brand
      startUpgradable: true, // to start contract and save adminFacet
      zoe: true, // to get contract terms, including issuer/brand
    },
    installation: { consume: { secondInvite: true } },
    issuer: {
      consume: { IST: true },
      produce: { IST: true },
    },
    brand: {
      consume: { IST: true },
      produce: { IST: true },
    },
    instance: { produce: { secondInvite: true } },
  },
};
harden(edCertManifest);

export const getManifestForEdCert = ({ restoreRef }, { edCertRef }) => {
  return harden({
    manifest: edCertManifest,
    installations: {
      secondInvite: restoreRef(edCertRef),
    },
  });
};
