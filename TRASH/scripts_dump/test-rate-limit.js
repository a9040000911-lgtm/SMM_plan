async function runTest() {
    console.log("Simulating burst of 7 login requests...");
    let blockedCount = 0;
    for (let i = 1; i <= 7; i++) {
        try {
            const res = await fetch("http://localhost:3000/api/auth/csrf");
            console.log(`Request ${i}: Status ${res.status}`);
            if (res.status === 429) {
                blockedCount++;
                const text = await res.text();
                console.log(`   Response: ${text}`);
            }
        } catch (e) {
            console.error(`Request ${i} failed`, e);
        }
    }

    if (blockedCount > 0) {
        console.log(`\nSUCCESS: Rate limiter blocked ${blockedCount} requests!`);
    } else {
        console.log(`\nWARNING: Rate limiter did NOT block any requests.`);
    }
}

runTest();
