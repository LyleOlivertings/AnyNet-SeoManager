import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import bcrypt from 'bcryptjs'; // Changed to bcryptjs for better compatibility
import User from '../models/User'; // Ensure this points to your User model

const rl = readline.createInterface({ input, output });

async function createAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('❌ MONGODB_URI not found in .env.local');
    }

    console.log('\n🔐 --- ANYNET ADMIN GENERATOR ---');
    
    const name = await rl.question('Name: ');
    const email = await rl.question('Email: ');
    const password = await rl.question('Password: ');
    const position = await rl.question('Position (e.g. Lead Dev): ');

    if (password.length < 6) throw new Error('Password must be 6+ chars.');

    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGODB_URI);

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) throw new Error(`User ${email} already exists.`);

    const hashedPassword = await bcrypt.hash(password, 12);

    const adminUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      position: position || 'Owner',
    });

    await adminUser.save();

    console.log('\n✅ SUCCESS! Admin created.');
    console.log(`👤 User: ${adminUser.email}`);
    console.log(`🔑 Role: ${adminUser.role}`);

  } catch (error) {
    console.error('\n❌ ERROR:', error instanceof Error ? error.message : String(error));
  } finally {
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

createAdmin();