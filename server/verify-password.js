const bcrypt = require('bcrypt');
const data = require('./data.json');

const testPassword = 'admin123';
const storedHash = data.users[0].password;

bcrypt.compare(testPassword, storedHash, (err, result) => {
  if (err) {
    console.log('Error:', err);
  } else {
    console.log(`Password "admin123" matches: ${result}`);
    if (!result) {
      console.log('\nTrying other common passwords...');
      const passwords = ['admin', 'Admin123', 'password', 'church123'];
      passwords.forEach(pwd => {
        bcrypt.compare(pwd, storedHash, (err, res) => {
          if (res) console.log(`✅ Correct password is: "${pwd}"`);
        });
      });
    }
  }
});
