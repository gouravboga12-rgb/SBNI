const http = require('http');

const loginData = JSON.stringify({ email: 'srinivaspolepalli10@gmail.com', password: 'Srinivas@10' });

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('LOGIN STATUS:', res.statusCode);
    console.log('LOGIN BODY:', body);
    const parsed = JSON.parse(body);
    const token = parsed.data?.accessToken;
    console.log('ADMIN LOGIN SUCCESS, TOKEN PRESENT:', !!token);

    if (token) {
      const endpoints = [
        '/api/v1/admin/dashboard-stats',
        '/api/v1/admin/vendors',
        '/api/v1/admin/lenders',
        '/api/v1/admin/payments',
        '/api/v1/admin/fraud-reports',
      ];

      endpoints.forEach(ep => {
        http.get({
          hostname: 'localhost',
          port: 5000,
          path: ep,
          headers: { Authorization: `Bearer ${token}` }
        }, res2 => {
          let body2 = '';
          res2.on('data', d => body2 += d);
          res2.on('end', () => {
            console.log(`\n=== GET ${ep} (Status: ${res2.statusCode}) ===`);
            console.log(body2);
          });
        });
      });
    }
  });
});

req.on('error', console.error);
req.write(loginData);
req.end();
