// @ts-check
import { E, Far } from '@endo/far';
import { M } from '@endo/patterns';
import '@agoric/zoe/exported.js';
/**
 * @typedef {{
 * maxCertificates: bigint;
 * }} CertificateTerms
 */

export const meta = {
  customTermsShape: M.splitRecord({
    maxCertificates: M.bigint(),
  }),
};

/**
 * @param {ZCF<CertificateTerms>} zcf
 */
export const start = async (zcf, privateArgs) => {
  const { maxCertificates } = zcf.getTerms();
  let certificateCount = 0n;

  // Create storage node for certificate data
  const certificateDataRoot = await E(privateArgs.storageNode).makeChildNode(
    'certificates',
  );

  const proposalShape = harden({
    exit: M.any(),
    give: M.any(),
    want: M.any(),
  });

  /**
   * Handle publishing of certificate data
   * @param {ZCFSeat} seat
   * @param {object} offerArgs
   * @returns {Promise<object>} myObject
   */
  const publishHandler = async (seat, offerArgs) => {
    const myObject = {
      name: "Alice",
      age: 30,
      isStudent: false
    };

      seat.exit();      
      return myObject;
  };

  const makePublishInvitation = () =>
    zcf.makeInvitation(
      publishHandler,
      'publish certificate data',
      undefined,
      proposalShape,
    );

  return harden({
    publicFacet: Far('Certificate Data Public Facet', {
      makePublishInvitation,
    }),
  });
};

harden(start);
