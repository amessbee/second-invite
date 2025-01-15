// @ts-check
import { E, Far, passStyleOf } from '@endo/far';
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
  const recordsDataRoot = await E(privateArgs.storageNode).makeChildNode(
    'TamperProofRecords',
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
    const { certificateData } = offerArgs;
    const currentId = certificateData.certificateId;

    const edCertNode = await E(recordsDataRoot).makeChildNode(
      certificateData.certificateId,
    );

    await E(edCertNode).setValue(certificateData.studentName);

    seat.exit();
    return harden({
      invitationMakers: Far('second invitation maker', {
        makeSecondInvitation: () =>
          zcf.makeInvitation(
            async (seat, offerArgs) => {
              const { certificateData } = offerArgs;

              if (certificateData.certificateId !== currentId) {
                throw new Error('Certificate ID mismatch');
              }

              const edCertNode = await E(recordsDataRoot).makeChildNode(
                certificateData.certificateId,
              );

              await E(edCertNode).setValue(
                JSON.stringify(certificateData.studentName),
              );
              seat.exit();
            },

            'SecondInvite',
          ),
      }),
    });
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
