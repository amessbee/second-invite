// import { heapVowE as E } from '@agoric/vow/vat.js';
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
 *   storePatientData: (patientId: string, data: object) => Promise<Vow<any>>,
 *   patientExists: (patientId: string) => Promise<boolean>, 
 *   getPatientCount: () => bigint,
 *   incrementPatientCount: () => bigint,
 *   maxPatients: bigint,
 *   validatePatientData: (data: object) => boolean
 * }} ctx
 * @param {ZCFSeat} seat
 * @param {{ medRec: object }} offerArgs
 */
export const publishMedRec = async (orch, ctx, seat, offerArgs) => {
  const { medRec } = offerArgs;

  const {
    storePatientData,
    patientExists,
    getPatientCount,
    incrementPatientCount,
    maxPatients,
    validatePatientData,
  } = ctx;

  return storePatientData(medRec.patientId, medRec);
  // Maybe instead of exposing these functiosn in ctx, we should just pass storageNode in as arguments? And
  // then use it here using heapVowE(node).setValue(JSON.stringify(medRec))
//   return storePatientData(medRec.patientId, medRec);

  // Validate data structure
  if (!validatePatientData(medRec)) {
    console.error('Invalid patient data structure');
    return harden(new Error('Invalid patient data structure'));
  }

  try {
    // Check if adding a new patient (not updating existing)
    const isNewPatient = !(await patientExists(medRec.patientId));

    // Check maxPatients limit for new patients
    if (isNewPatient && (await getPatientCount()) >= maxPatients) {
      console.error('Maximum number of patients reached');
      return harden(new Error('Maximum number of patients reached'));
    }

    // Store the patient data
    await storePatientData(medRec.patientId, medRec);

    // Update patient count for new patients
    if (isNewPatient) {
      await incrementPatientCount();
    }

    seat.exit();
    return 'Patient data published successfully';
  } catch (error) {
    console.error('Error publishing patient data:', error);
    return harden(new Error('Failed to publish patient data'));
  }
};
harden(publishMedRec);
