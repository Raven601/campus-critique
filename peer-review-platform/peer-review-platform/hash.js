const bcrypt = require('bcryptjs');

async function hashPassword(plain) {
  const hashed = await bcrypt.hash(plain, 10);
  console.log(hashed);
}

hashPassword('orquizaians0701');
