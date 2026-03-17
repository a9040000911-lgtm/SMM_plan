import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 50 },  // Ramp-up to 50
        { duration: '1m', target: 150 }, // Ramp-up to 150
        { duration: '2m', target: 300 }, // Sustain 300
        { duration: '30s', target: 0 },  // Ramp-down
    ],
    thresholds: {
        http_req_duration: ['p(95)<1500'], // 95% of requests must be below 1.5s
        http_req_failed: ['rate<0.05'],    // Error rate should be less than 5%
    },
};

export default function () {
    const res = http.get('http://89.23.98.202/api/health');
    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 2s': (r) => r.timings.duration < 2000,
    });
    sleep(1);
}
