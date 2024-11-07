import { heapVowE as E } from '@agoric/vow/vat.js';
/**
 * @import {ZoeTools} from '@agoric/orchestration/src/utils/zoe-tools.js';
 * @import {Orchestrator} from '@agoric/orchestration';
 * @import {Vow} from '@agoric/vow';
 */

/**
 * Publishes patient data to storage
 *
 * @param {Orchestrator} orch
 * @param {{
 *   vowTools: any,
 *   patientDataRoot: any,
 *   maxPatients: bigint
 * }} ctx
 * @param {ZCFSeat} seat
 * @param {{ medRec: object }} offerArgs
 */
export const publishMedRec = async (orch, ctx, seat, offerArgs) => {
  const { medRec } = offerArgs;

  const { patientDataRoot, vowTools } = ctx;

  // Validate data structure
  const requiredFields = ['patientId', 'name', 'age', 'gender', 'bloodType'];
  if (medRec.photo) {
    if (
      typeof medRec.photo !== 'string' ||
      !medRec.photo.startsWith('data:image/')
    ) {
      return harden(new Error('Invalid patient photo data structure'));
    }
  }
  if (
    !requiredFields.every(
      field =>
        Object.prototype.hasOwnProperty.call(medRec, field) &&
        medRec[field] !== null &&
        medRec[field] !== undefined,
    )
  ) {
    return harden(
      new Error('Invalid patient data structure - missing required fields'),
    );
  }

  // Check if patient already exists
//   try {
//     const patientNode = await E(patientDataRoot).makeChildNode(patientId);
//     const existingData = await E(patientNode).getValue();
//     const isNewPatient = existingData == null || existingData == undefined;
//   } catch {
//     return harden(
//       new Error('Error: Trying to access VStorage patient data root'),
//     );
//   }

  try {
    // UNTIL https://github.com/Agoric/agoric-sdk/issues/9066
    const patientNode = E(patientDataRoot).makeChildNode(medRec.patientId);
    /** @type {(msg: string) => Vow<void>} */
    // vowTools.watch(E(patientNode).setValue(JSON.stringify(medRec)));
    await E(patientNode).setValue(JSON.stringify(medRec));

    seat.exit();
    return 'Patient data published successfully';
  } catch (error) {
    console.error('Error publishing patient data:', error);
    return harden(new Error('Failed to publish patient data'));
  }
};
harden(publishMedRec);
