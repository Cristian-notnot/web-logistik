// Utilitas kecil untuk membuat hash bcrypt sebuah password.
// Pakai ini saat membuat user admin pertama kali lewat SQL manual.
//
// Cara pakai:
//   node src/utils/hashPassword.js "password_rahasia"
//
// Lalu masukkan hasilnya ke kolom password_hash pada tabel users.

const bcrypt = require('bcrypt');

const plain = process.argv[2];

if (!plain) {
  console.log('Pakai: node src/utils/hashPassword.js "password_kamu"');
  process.exit(1);
}

bcrypt.hash(plain, 10).then((hash) => {
  console.log('\nHash bcrypt untuk password tersebut:\n');
  console.log(hash);
  console.log('\nSalin nilai di atas ke kolom password_hash pada tabel users.\n');
});
