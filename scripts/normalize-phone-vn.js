/**
 * Migration script: normalize all phone numbers to Vietnam format (+84...)
 * Updates customers and contracts in Firebase so every soDienThoai/phone is stored as +84...
 *
 * Usage: node scripts/normalize-phone-vn.js
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update } from 'firebase/database';
import { normalizePhoneToVn } from '../src/utils/validation.js';

// Firebase web config (matches src/firebase/config.js / other scripts)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyB_vAEz_pxfNWKtrgUbt4sgoj0CfaGQSas",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "vinfast-d5bd8.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "vinfast-d5bd8",
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || "https://vinfast-d5bd8-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "vinfast-d5bd8.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "629544926555",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:629544926555:web:edcbfc14cc02dc6b832e7e",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BWFGVBRLR5",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function normalizeCustomers() {
  console.log('🔍 Checking customers collection (soDienThoai)...\n');

  const customersRef = ref(database, 'customers');
  const snapshot = await get(customersRef);

  if (!snapshot.exists()) {
    console.log('   No customers found.\n');
    return { updates: {}, total: 0, fixed: 0 };
  }

  const updates = {};
  let fixCount = 0;
  let total = 0;

  snapshot.forEach((child) => {
    total++;
    const key = child.key;
    const data = child.val();
    const raw = data.soDienThoai;
    if (raw == null || String(raw).trim() === '') return;

    const normalized = normalizePhoneToVn(raw);
    if (normalized && normalized !== raw) {
      updates[`customers/${key}/soDienThoai`] = normalized;
      console.log(`  ✓ customers/${key}: "${raw}" → "${normalized}"`);
      fixCount++;
    }
  });

  return { updates, total, fixed: fixCount };
}

async function normalizeContracts() {
  console.log('🔍 Checking contracts collection (phone / soDienThoai / Số Điện Thoại)...\n');

  const contractsRef = ref(database, 'contracts');
  const snapshot = await get(contractsRef);

  if (!snapshot.exists()) {
    console.log('   No contracts found.\n');
    return { updates: {}, total: 0, fixed: 0 };
  }

  const updates = {};
  let fixCount = 0;
  let total = 0;

  snapshot.forEach((child) => {
    total++;
    const key = child.key;
    const data = child.val();

    const phoneRaw = data.phone ?? data.soDienThoai ?? data['Số Điện Thoại'];
    if (phoneRaw == null || String(phoneRaw).trim() === '') return;

    const normalized = normalizePhoneToVn(phoneRaw);
    if (!normalized) return;

    if (data.phone !== undefined && data.phone !== normalized) {
      updates[`contracts/${key}/phone`] = normalized;
      console.log(`  ✓ contracts/${key}/phone: "${data.phone}" → "${normalized}"`);
      fixCount++;
    }
    if (data.soDienThoai !== undefined && data.soDienThoai !== normalized) {
      updates[`contracts/${key}/soDienThoai`] = normalized;
      console.log(`  ✓ contracts/${key}/soDienThoai: "${data.soDienThoai}" → "${normalized}"`);
      fixCount++;
    }
    if (data['Số Điện Thoại'] !== undefined && data['Số Điện Thoại'] !== normalized) {
      updates[`contracts/${key}/Số Điện Thoại`] = normalized;
      console.log(`  ✓ contracts/${key}/Số Điện Thoại: "${data['Số Điện Thoại']}" → "${normalized}"`);
      fixCount++;
    }
  });

  return { updates, total, fixed: fixCount };
}

async function normalizeExportedContracts() {
  console.log('🔍 Checking exportedContracts collection...\n');

  const refExported = ref(database, 'exportedContracts');
  const snapshot = await get(refExported);

  if (!snapshot.exists()) {
    console.log('   No exported contracts found.\n');
    return { updates: {}, total: 0, fixed: 0 };
  }

  const updates = {};
  let fixCount = 0;
  let total = 0;

  snapshot.forEach((child) => {
    total++;
    const key = child.key;
    const data = child.val();

    const phoneRaw = data.phone ?? data.soDienThoai ?? data['Số Điện Thoại'];
    if (phoneRaw == null || String(phoneRaw).trim() === '') return;

    const normalized = normalizePhoneToVn(phoneRaw);
    if (!normalized) return;

    if (data.phone !== undefined && data.phone !== normalized) {
      updates[`exportedContracts/${key}/phone`] = normalized;
      console.log(`  ✓ exportedContracts/${key}/phone: "${data.phone}" → "${normalized}"`);
      fixCount++;
    }
    if (data.soDienThoai !== undefined && data.soDienThoai !== normalized) {
      updates[`exportedContracts/${key}/soDienThoai`] = normalized;
      console.log(`  ✓ exportedContracts/${key}/soDienThoai: "${data.soDienThoai}" → "${normalized}"`);
      fixCount++;
    }
    if (data['Số Điện Thoại'] !== undefined && data['Số Điện Thoại'] !== normalized) {
      updates[`exportedContracts/${key}/Số Điện Thoại`] = normalized;
      console.log(`  ✓ exportedContracts/${key}/Số Điện Thoại: "${data['Số Điện Thoại']}" → "${normalized}"`);
      fixCount++;
    }
  });

  return { updates, total, fixed: fixCount };
}

async function main() {
  console.log('========================================');
  console.log('  Normalize phone to VN (+84)');
  console.log('========================================\n');

  try {
    const [customersResult, contractsResult, exportedResult] = await Promise.all([
      normalizeCustomers(),
      normalizeContracts(),
      normalizeExportedContracts(),
    ]);

    const allUpdates = {
      ...customersResult.updates,
      ...contractsResult.updates,
      ...exportedResult.updates,
    };

    const totalUpdates = Object.keys(allUpdates).length;

    if (totalUpdates > 0) {
      console.log('\n📝 Summary:');
      console.log(`   - Customers: ${customersResult.total} checked, ${customersResult.fixed} updated`);
      console.log(`   - Contracts: ${contractsResult.total} checked, ${contractsResult.fixed} fields updated`);
      console.log(`   - Exported:  ${exportedResult.total} checked, ${exportedResult.fixed} fields updated`);
      console.log(`   - Total updates: ${totalUpdates}\n`);

      console.log('💾 Applying updates to Firebase...');
      await update(ref(database), allUpdates);
      console.log('✅ All phone numbers normalized to +84.\n');
    } else {
      console.log('\n✅ All phone numbers are already in +84 format. Nothing to update.\n');
    }

    console.log('========================================');
    console.log('  Done');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
