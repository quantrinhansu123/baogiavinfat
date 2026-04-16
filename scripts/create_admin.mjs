import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push } from 'firebase/database';
import bcrypt from 'bcryptjs';

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

const password = 'admin123';
const hashedPassword = bcrypt.hashSync(password, 10);

const newAdmin = {
  user: 'admin',
  mail: 'admin@vinfast.com',
  quyen: 'admin',
  pass: hashedPassword,
  TVBH: 'Admin',
  name: 'Admin',
  phongBan: 'Quản trị',
};

async function createAdmin() {
  try {
    const result = await push(ref(database, 'employees'), newAdmin);
    console.log('Tao admin thanh cong!');
    console.log('ID:', result.key);
    console.log('Email: admin@vinfast.com');
    console.log('Password: admin123');
  } catch (err) {
    console.error('Loi:', err.message);
  }
  process.exit(0);
}

createAdmin();
