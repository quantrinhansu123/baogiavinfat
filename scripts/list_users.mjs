// Script to list employees from Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyB6V5Avjz3wsKCEeLFAeM0aCE3ojo1qd7E',
  authDomain: 'vinfast-web-prod.firebaseapp.com',
  projectId: 'vinfast-web-prod',
  databaseURL: 'https://vinfast-web-prod-default-rtdb.asia-southeast1.firebasedatabase.app',
  storageBucket: 'vinfast-web-prod.firebasestorage.app',
  appId: '1:635234569338:web:89cb121f6268e33600ffc3',
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function listUsers() {
  try {
    const snapshot = await get(ref(database, 'employees'));
    if (snapshot.exists()) {
      const users = snapshot.val();
      console.log('=== DANH SACH EMPLOYEES ===\n');
      Object.entries(users).forEach(([id, user]) => {
        if (user) {
          const email = user.mail || user.Mail || user.email || '(no email)';
          const role = user.quyen || user['Quyền'] || user.role || 'user';
          const name = user.user || user.username || user.TVBH || user.name || '(no name)';
          const hasPass = !!(user.pass || user.password);
          console.log(`ID: ${id}`);
          console.log(`  Name: ${name}`);
          console.log(`  Email: ${email}`);
          console.log(`  Role: ${role}`);
          console.log(`  Has Password: ${hasPass}`);
          console.log('');
        }
      });
    } else {
      console.log('No employees found in database');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

listUsers();
