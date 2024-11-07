// @ts-check
import { heapVowE as E } from '@agoric/vow/vat.js';
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
 * @import {Vow} from '@agoric/vow';
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

/** @type {ContractMeta} */
export const meta = {
  privateArgsShape: M.and(
    OrchestrationPowersShape,
    M.splitRecord({
      marshaller: M.remotable('marshaller'),
    }),
  ),
  customTermsShape: {
    chainDetails: M.recordOf(M.string(), ChainInfoShape),
  },
};
harden(meta);
const trace = makeTracer('MedRecContract');

/**
 * @typedef {{
 *   chainDetails: Record<string, CosmosChainInfo>
 * }} MedRecTerms
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
  { orchestrateAll, zoeTools, chainHub, vowTools },
) => {
  trace('med-rec start contract');

  // const { maxPatients } = zcf.getTerms();
  const maxPatients = 100n;

  // Create storage node for patient data
  const patientDataRoot = await E(privateArgs.storageNode).makeChildNode(
    'patients',
  );

  // Context for flows
  const ctx = {
    vowTools: vowTools,
    patientDataRoot: patientDataRoot,
    maxPatients: maxPatients,
  };  

  const { publishMedRec } = orchestrateAll(flows, ctx);

  const publicFacet = zone.exo(
    'MedRec Public Facet',
    M.interface('MedRec PF', {
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

/** @typedef {typeof start} MedRecSF */
