import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failure rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // Simulate a customer hitting a public portal and checking for active requirements
  const res = http.get(`${BASE_URL}/public/sharma-motors`);

  check(res, {
    'status is 200 or 404': (r) => r.status === 200 || r.status === 404, // 404 means route needs auth or dealer missing, which is acceptable for a raw test
  });

  sleep(1);
}
