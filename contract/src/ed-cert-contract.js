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

  /**
   * Get current certificate count from storage
   * @returns {bigint}
   */
  const getCertificateCount = () => certificateCount;

  /**
   * Update certificate count in storage
   */
  const incrementCertificateCount = () => {
    certificateCount += 1n;
    return certificateCount;
  };

  /**
   * Store certificate data in VStorage
   * @param {object} data
   */
  const storeCertificateData = async data => {
    try {
      // UNTIL https://github.com/Agoric/agoric-sdk/issues/9066

      const edCertNode = await E(certificateDataRoot).makeChildNode(
        data.certificateId,
      );

      await E(edCertNode).setValue(JSON.stringify(data));

      return 'Certification data published successfully';
    } catch (error) {
      console.error(
        `Error publishing ${JSON.stringify(data)} Certification data:${error}`,
      );
      return harden(
        new Error(
          `Error publishing ${JSON.stringify(data)} Certification data:${error}`,
        ),
      );
    }
  };

  /**
   * Validate certificate data structure
   * @param {object} data
   */
  const validateCertificateData = data => {
    const requiredFields = [
      'certificateId',
      'studentName',
      'courseName',
      'certificateType', // degree, diploma, certificate
    ];
    if (data.photo) {
      if (
        typeof data.photo !== 'string' ||
        !data.photo.startsWith('data:image/')
      ) {
        return false;
      }
    }
    return requiredFields.every(
      field =>
        Object.prototype.hasOwnProperty.call(data, field) &&
        data[field] !== null &&
        data[field] !== undefined,
    );
  };

  const proposalShape = harden({
    exit: M.any(),
    give: M.any(),
    want: M.any(),
  });

  /**
   * Handle publishing of certificate data
   * @param {ZCFSeat} seat
   * @param {object} offerArgs
   */
  const publishHandler = async (seat, offerArgs) => {
    const { certificateData } = offerArgs;

    // Validate data structure
    if (!validateCertificateData(certificateData)) {
      console.error('Invalid certificate data structure');
      return harden(new Error('Invalid certificate data structure'));
    }

    try {
      // Check maxCertificates limit for new certificates
      if (getCertificateCount() >= maxCertificates) {
        console.error('Maximum number of certificates reached');
        return harden(new Error('Maximum number of certificates reached'));
      }

      // Store the certificate data
      await storeCertificateData(certificateData);

      // Update certificate count for new certificates

      incrementCertificateCount();

      seat.exit();
      return 'Certificate data published successfully';
    } catch (error) {
      console.error('Error publishing certificate data:', error);
      return harden(new Error('Failed to publish certificate data'));
    }
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
