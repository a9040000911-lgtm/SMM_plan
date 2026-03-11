const { analyzeLink } = require('../src/utils/link-analyzer/index');

const testLinks = [
    'https://t.me/durov',
    'https://vk.com/wall-12345?q=t.me',
    't.me/s/channel',
    'instagram.com/p/12345',
    'https://www.youtube.com/watch?v=123',
    'not-a-social-network.com'
];

testLinks.forEach(link => {
    const result = analyzeLink(link);
    console.log(`Link: ${link} -> Platform: ${result?.platform}, Object: ${result?.objectType}`);
});
