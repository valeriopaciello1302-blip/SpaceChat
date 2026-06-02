import prisma from '../src/lib/prisma.js';
import bcrypt from 'bcrypt';

const main = async () => {
  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: {
      email: 'admin@test.it'
    },
    update: {},
    create: {
      email: 'admin@test.it',
      password: hashedPassword,
      nome: 'Admin',
      cognome: 'Sistema',
      username: 'admin',
      ruolo: 'ADMIN'
    }
  });

  console.log('Admin creato:', admin.email);
};

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });