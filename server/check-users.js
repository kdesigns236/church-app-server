const data = require('./data.json');
console.log('Users in database:');
console.log(JSON.stringify(data.users, null, 2));
