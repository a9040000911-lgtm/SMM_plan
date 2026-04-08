async function test() {
    const res = await fetch('http://localhost:3000/api/client/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'host': 'localhost' },
        body: JSON.stringify({ serviceId: 'e2e-srv-1', link: 'https://test', quantity: 500, email: 'test123456789@smmplan.pro' })
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response headers:", [...res.headers.entries()]);
    console.log("Response starts with:", text.substring(0, 1000));
}
test().finally(() => process.exit(0));
