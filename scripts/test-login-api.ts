import fetch from 'node-fetch';

async function testLogin() {
    console.log('Testing Phase 1: Email and Password');
    const res1 = await fetch('http://localhost:3000/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'email',
            email: 'art@artmspektr.ru',
            password: '12345678'
        })
    });

    const data1 = await res1.json();
    console.log('Phase 1 status:', res1.status);
    console.log('Phase 1 response:', data1);

    if (res1.status !== 200 || !data1.requires2fa) {
        console.error('Phase 1 failed. Aborting.');
        return;
    }

    console.log('\nTesting Phase 2: 2FA Code (Master Key)');
    const res2 = await fetch('http://localhost:3000/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: '2fa_verify',
            email: 'art@artmspektr.ru',
            code: '777777'
        })
    });

    const data2 = await res2.json();
    console.log('Phase 2 status:', res2.status);
    console.log('Phase 2 response:', data2);

    const cookies = res2.headers.raw()['set-cookie'];
    console.log('Set-Cookie header:', cookies ? 'Present (Session Created!)' : 'Missing');

    if (res2.status === 200 && data2.success) {
        console.log('\nSUCCESS! Admin API Login is fully functional.');
    } else {
        console.error('\nFAILED! Phase 2 did not succeed.');
    }
}

testLogin();
