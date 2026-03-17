import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 100 },  // Ramp-up to 100
        { duration: '1m', target: 500 },  // Ramp-up to 500
        { duration: '2m', target: 1000 }, // Push to 1000
        { duration: '1m', target: 1000 }, // Sustain 1000
        { duration: '30s', target: 0 },   // Ramp-down
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests must be below 2s
        http_req_failed: ['rate<0.10'],    // Allow up to 10% failure at extreme peak
    },
};

export default function () {
    const res = http.get('http://89.23.98.202/api/health');
    check(res, {
        'status is 200': (r) => r.status === 200,
    });
    sleep(1);
}
