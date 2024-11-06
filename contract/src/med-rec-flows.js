/**
 * @import {ZoeTools} from '@agoric/orchestration/src/utils/zoe-tools.js';
 * @import {Orchestrator} from '@agoric/orchestration';
 */

/**
 * Publishes patient data to storage
 *
 * @param {Orchestrator} orch
 * @param {{
 *   storePatientData: (patientId: string, data: object) => Promise<void>,
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
    validatePatientData,
    patientExists,
    getPatientCount,
    storePatientData,
    incrementPatientCount,
    maxPatients,
  } = ctx;


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
