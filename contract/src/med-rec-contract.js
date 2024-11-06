// @ts-check
import { E, Far } from '@endo/far';
import { M } from '@endo/patterns';
import '@agoric/zoe/exported.js';
import { makeTracer } from '@agoric/internal';
import { withOrchestration } from '@agoric/orchestration/src/utils/start-helper.js';
import { ChainInfoShape } from '@agoric/orchestration/src/typeGuards.js';
import {
  InvitationShape,
  EmptyProposalShape,
} from '@agoric/zoe/src/typeGuards.js';
import * as flows from './med-rec-flows.js';

/**
 * @import {Marshaller} from '@agoric/internal/src/lib-chainStorage.js';
 * @import {CosmosChainInfo} from '@agoric/orchestration';
 * @import {OrchestrationPowers, OrchestrationTools} from '@agoric/orchestration/src/utils/start-helper.js';
 * @import {Zone} from '@agoric/zone';
 */

/// <reference types="@agoric/vats/src/core/types-ambient"/>
/// <reference types="@agoric/zoe/src/contractFacet/types-ambient"/>

const OrchestrationPowersShape = M.splitRecord({
  localchain: M.remotable('localchain'),
  orchestrationService: M.remotable('orchestrationService'),
  storageNode: M.remotable('storageNode'),
  timerService: M.remotable('timerService'),
  agoricNames: M.remotable('agoricNames'),
});


/**
 * @typedef {{
 * maxPatients: bigint;
 * }} PatientTerms
 */


/** @type {ContractMeta} */
export const meta = {
  privateArgsShape: M.and(
    OrchestrationPowersShape,
    M.splitRecord({
      marshaller: M.remotable('marshaller'),
    }),
  ),
  customTermsShape: {
    maxPatients: M.bigint(),
  },
};
harden(meta);
const trace = makeTracer('MedRecContract');

/**
 * @typedef {{
*   chainDetails: Record<string, CosmosChainInfo>
* }} OrcaTerms
*
* @param {ZCF} zcf
* @param {OrchestrationPowers & {
*   marshaller: Marshaller;
* }} privateArgs
* @param {Zone} zone
* @param {OrchestrationTools} tools
*/
const contract = async (
 zcf,
 privateArgs,
 zone,
 { orchestrateAll, zoeTools, chainHub },
) => {
 trace('orca start contract');

  const { maxPatients } = zcf.getTerms();
  let patientCount = 0n;

  // Create storage node for patient data
  const patientDataRoot = await E(privateArgs.storageNode).makeChildNode(
    'patients',
  );

  /**
   * Get current patient count from storage
   * @returns {bigint}
   */
  const getPatientCount = () => patientCount;

  /**
   * Update patient count in storage
   */
  const incrementPatientCount = () => {
    patientCount += 1n;
    return patientCount;
  };

  /**
   * Store patient data in VStorage
   * @param {string} patientId
   * @param {object} data
   */
  const storePatientData = async (patientId, data) => {
    const patientNode = await E(patientDataRoot).makeChildNode(patientId);
    await E(patientNode).setValue(JSON.stringify(data));
  };

  /**
   * Check if patient already exists
   * @param {string} patientId
   * @returns {Promise<boolean>}
   */
  const patientExists = async patientId => {
    try {
      const patientNode = await E(patientDataRoot).makeChildNode(patientId);
      const existingData = await E(patientNode).getValue();
      return existingData !== null && existingData !== undefined;
    } catch {
      return false;
    }
  };

  /**
   * Validate patient data structure
   * @param {object} data
   */
  const validatePatientData = data => {
    const requiredFields = ['patientId', 'name', 'age', 'gender', 'bloodType'];
    if (data.photo) {
      if (typeof data.photo !== 'string' || !data.photo.startsWith('data:image/')) {
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

  // Context for flows
  const ctx = {
    validatePatientData: validatePatientData,
    patientExists: patientExists,
    getPatientCount: getPatientCount  ,
    storePatientData: storePatientData,
    incrementPatientCount: incrementPatientCount,
    maxPatients: maxPatients,
  };

  // @ts-expect-error XXX ZCFSeat not Passable
  const orchestrated = orchestrateAll(flows, ctx);
  const { publishMedRec } = orchestrated;

  const publicFacet = zone.exo(
    'Orca Public Facet',
    M.interface('Orca PF', {
      makePublishInvitation: M.callWhen().returns(InvitationShape),
    }),
    {
      makePublishInvitation() {
        return zcf.makeInvitation(
          publishMedRec,
          'Publish Patient Data',
          undefined,
          EmptyProposalShape,
        );
      },
    },
  );

  return { publicFacet };
};

export const start = withOrchestration(contract);
harden(start);

/** @typedef {typeof start} MedRecContractStart */