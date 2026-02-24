/**
 * Generate Apple Sign In Secret Key (JWT) for Supabase
 * 
 * Usage:
 * 1. Make sure you have the .p8 key file downloaded from Apple Developer Console
 * 2. Install dependencies: npm install jsonwebtoken
 * 3. Run: node scripts/generate-apple-secret.js
 * 
 * Or use online tool: https://appleid.apple.com/account/manage
 */

import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your Apple Developer credentials
const TEAM_ID = 'UTRAXDH5KQ';
const KEY_ID = 'L67JSG4XKB';
const SERVICE_ID = 'com.propella.app.web'; // Your Service ID

// Path to your .p8 key file
const PRIVATE_KEY_PATH = 'C:\\Users\\User\\Downloads\\AuthKey_L67JSG4XKB.p8';

try {
  // Read the private key file
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error('❌ Error: Private key file not found!');
    console.log(`\nPlease download your .p8 key file from Apple Developer Console and save it as:`);
    console.log(`  ${PRIVATE_KEY_PATH}`);
    console.log(`\nOr update the PRIVATE_KEY_PATH in this script to point to your key file.`);
    process.exit(1);
  }

  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

  // Generate JWT token (valid for 6 months)
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    {
      iss: TEAM_ID,
      iat: now,
      exp: now + 15777000, // 6 months in seconds (15777000 = 182.5 days)
      aud: 'https://appleid.apple.com',
      sub: SERVICE_ID
    },
    privateKey,
    {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: KEY_ID
      }
    }
  );

  console.log('✅ Apple Sign In Secret Key generated successfully!\n');
  console.log('📋 Copy this token and paste it into Supabase:\n');
  console.log('─'.repeat(80));
  console.log(token);
  console.log('─'.repeat(80));
  console.log('\n⚠️  Important:');
  console.log('   - This token expires in 6 months');
  console.log('   - Save this token securely');
  console.log('   - Set a reminder to regenerate before expiration');
  console.log('\n📝 Next steps:');
  console.log('   1. Go to Supabase Dashboard → Authentication → Providers → Apple');
  console.log('   2. Paste the token above into the "Secret Key" field');
  console.log('   3. Make sure Service ID is set to: ' + SERVICE_ID);
  console.log('   4. Click Save\n');

} catch (error) {
  console.error('❌ Error generating secret key:', error.message);
  if (error.message.includes('PEM')) {
    console.log('\n💡 Tip: Make sure your .p8 file is in the correct format.');
    console.log('   It should start with: -----BEGIN PRIVATE KEY-----');
  }
  process.exit(1);
}
