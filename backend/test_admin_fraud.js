const http = require('http');

const loginData = JSON.stringify({ email: 'srinivaspolepalli10@gmail.com', password: 'adminpassword123' });

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
    const parsed = JSON.parse(body);
    const token = parsed.data?.accessToken;
    console.log('ADMIN LOGIN SUCCESS, TOKEN PRESENT:', !!token);

    if (token) {
      http.get({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/admin/fraud-reports',
        headers: { Authorization: `Bearer ${token}` }
      }, res2 => {
        let body2 = '';
        res2.on('data', d => body2 += d);
        res2.on('end', () => {
          console.log('GET /admin/fraud-reports STATUS:', res2.statusCode);
          console.log('FRAUD REPORTS DATA:', body2);
        });
      });
    }
  });
});

req.on('error', console.error);
req.write(loginData);
req.end();
