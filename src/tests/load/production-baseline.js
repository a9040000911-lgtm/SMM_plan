import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 }, // Ramp-up to 20 users
    { duration: '3m', target: 20 }, // Stay at 20 users
    { duration: '1m', target: 0 },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
};

export default function () {
  const BASE_URL = 'http://89.23.98.202';
  
  // 1. Homepage
  const resHome = http.get(`${BASE_URL}/`);
  check(resHome, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage contains title': (r) => r.body.includes('Smmplan'),
  });

  sleep(1);

  // 2. Health Check
  const resHealth = http.get(`${BASE_URL}/api/health`);
  check(resHealth, {
    'health status is 200': (r) => r.status === 200,
    'db is connected': (r) => r.json().services.database === 'Connected',
  });

  sleep(2);
}
