/**
 * @file Test basic data storage using the Med Rec contract.
 */
// @ts-check

/* eslint-disable import/order -- https://github.com/endojs/endo/issues/1235 */
import { test as anyTest } from './prepare-test-env-ava.js';
import { createRequire } from 'module';
import { E } from '@endo/far';
import { makeNodeBundleCache } from '@endo/bundle-source/cache.js';
import { makeZoeKitForTest } from '@agoric/zoe/tools/setup-zoe.js';
import { makeMockChainStorageRoot } from '@agoric/internal/src/storage-test-utils.js';

const myRequire = createRequire(import.meta.url);
const contractPath = myRequire.resolve(`../src/ed-cert-contract.js`);

const test = anyTest;

const makeTestContext = async _t => {
  const { zoeService: zoe } = makeZoeKitForTest();
  const bundleCache = await makeNodeBundleCache('bundles/', {}, s => import(s));
  const bundle = await bundleCache.load(contractPath, 'medRecContract');

  return {
    zoe,
    bundle,
    bundleCache,
    storageNode: makeMockChainStorageRoot().makeChildNode('edCert'),
    board: makeMockChainStorageRoot().makeChildNode('boardAux'),
  };
};

test.before(async t => (t.context = await makeTestContext(t)));

// Test successful certficate data publishing
test('Successfully publish valid certficate data', async t => {
  const { bundle, zoe, storageNode, board } = t.context;

  const terms = {
    maxCertificates: 1000n,
  };

  const installation = await E(zoe).install(bundle);
  const { publicFacet } = await E(zoe).startInstance(
    installation,
    undefined,
    terms,
    { storageNode, board },
  );

  const validEdCert = {
    certificateId: 'P12345',
    name: 'John Doe',
    age: 30,
    gender: 'M',
    bloodType: 'O+',
  };

  const invitation = E(publicFacet).makePublishInvitation();

  const userSeat = await E(zoe).offer(invitation, undefined, undefined, {
    edCert: validEdCert,
  });

  const result = await E(userSeat).getOfferResult();
  t.is(result, 'Certificate data published successfully');
});

// Test invalid certficate data rejection
test('Reject invalid certficate data', async t => {
  const { bundle, zoe, storageNode, board } = t.context;

  const terms = {
    maxCertificates: 1000n,
  };

  const installation = await E(zoe).install(bundle);
  const { publicFacet } = await E(zoe).startInstance(
    installation,
    undefined,
    terms,
    { storageNode, board },
  );

  const invalidEdCert = {
    certificateId: 'P12345',
    name: 'John Doe',
    // Missing required fields: age, gender, bloodType
  };

  const invitation = E(publicFacet).makePublishInvitation();
  const seat = await E(zoe).offer(invitation, undefined, undefined, {
    edCert: invalidEdCert,
  });
  const resultP = await E(seat).getOfferResult();
  t.is(resultP.message, 'Invalid certficate data structure');
});

// Test duplicate certficate ID handling
test('Handle duplicate certficate ID', async t => {
  const { bundle, zoe, storageNode, board } = t.context;

  const terms = {
    maxCertificates: 1000n,
  };

  const installation = await E(zoe).install(bundle);
  const { publicFacet } = await E(zoe).startInstance(
    installation,
    undefined,
    terms,
    { storageNode, board },
  );

  const edCert = {
    certificateId: 'P12345',
    name: 'John Doe',
    age: 30,
    gender: 'M',
    bloodType: 'O+',
  };

  // First submission
  const invitation1 = E(publicFacet).makePublishInvitation();
  await E(zoe).offer(invitation1, undefined, undefined, { edCert });

  // Second submission with same ID
  const invitation2 = E(publicFacet).makePublishInvitation();
  const duplicateData = { ...edCert, name: 'Jane Doe' };

  const userSeat = await E(zoe).offer(invitation2, undefined, undefined, {
    edCert: duplicateData,
  });

  const result = await E(userSeat).getOfferResult();
  t.is(result, 'Certificate data published successfully');
});

// Test maxCertificates limit
test('Enforce maxCertificates limit', async t => {
  const { bundle, zoe, storageNode, board } = t.context;

  const terms = {
    maxCertficates: 1n, // Set limit to 1 certficate
  };

  const installation = await E(zoe).install(bundle);
  const { publicFacet } = await E(zoe).startInstance(
    installation,
    undefined,
    terms,
    { storageNode, board },
  );

  const certificate1Data = {
    certificateId: 'P12345',
    name: 'John Doe',
    age: 30,
    gender: 'M',
    bloodType: 'O+',
  };

  const certificate2Data = {
    certificateId: 'P67890',
    name: 'Jane Doe',
    age: 25,
    gender: 'F',
    bloodType: 'A+',
  };

  // First certficate should succeed
  const invitation1 = E(publicFacet).makePublishInvitation();
  await E(zoe).offer(invitation1, undefined, undefined, {
    edCert: certificate1Data,
  });

  // Second patcertficateient should fail due to maxCertificates limit
  const invitation2 = E(publicFacet).makePublishInvitation();

  const seat = await E(zoe).offer(invitation2, undefined, undefined, {
    edCert: certificate2Data,
  });
  const result = await E(seat).getOfferResult();
  t.is(result.message, 'Maximum number of certificates reached');
});
