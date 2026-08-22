require('dotenv').config();
const { generateAccessToken } = require('./dist/utils/jwt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findUnique({ where: { email: 'bogagourav69@gmail.com' } });
  console.log('USER:', user.id, user.email, user.role);

  const token = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  const res = await fetch('http://localhost:5000/api/v1/vendors/my-leads', {
    headers: { Authorization: `Bearer ${token}` }
  });

  const json = await res.json();
  console.log('MY LEADS API RESPONSE:', JSON.stringify(json, null, 2));
}

test().finally(() => prisma.$disconnect());
