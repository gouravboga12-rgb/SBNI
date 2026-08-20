async function testAdmin() {
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'srinivaspolepalli10@gmail.com', password: 'Srinivas@10' }),
  });
  const loginData = await loginRes.json() as any;
  console.log('LOGIN DATA:', JSON.stringify(loginData, null, 2));

  const token = loginData.data?.accessToken;
  if (!token) return;

  const vendorRes = await fetch('http://localhost:5000/api/v1/admin/vendors', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const vendorData = await vendorRes.json();
  console.log('ADMIN VENDORS RES:', JSON.stringify(vendorData, null, 2));

  const lenderRes = await fetch('http://localhost:5000/api/v1/admin/lenders', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const lenderData = await lenderRes.json();
  console.log('ADMIN LENDERS RES:', JSON.stringify(lenderData, null, 2));
}

testAdmin().catch(console.error);
