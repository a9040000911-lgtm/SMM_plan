const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client', 'index.js');

if (!fs.existsSync(indexPath)) {
    console.error('Prisma Client index.js not found at:', indexPath);
    process.exit(1);
}

let content = fs.readFileSync(indexPath, 'utf8');

const enums = {
    "LedgerEntryType": ["DEPOSIT", "WITHDRAWAL", "REFUND", "REFERRAL_BONUS", "LOYALTY_BONUS", "MANUAL_ADJUSTMENT"],
    "BusinessExpenseType": ["ADVERTISING", "SALARIES", "INFRASTRUCTURE", "SERVICES", "OTHER"],
    "ExpenseCategory": ["SALARY", "MARKETING", "SEO", "ADS", "TAX", "SERVER", "OFFICE", "OTHER"],
    "Role": ["USER", "ADMIN", "RESELLER", "SUPPORT", "SEO"],
    "OrderStatus": ["PENDING", "PROCESSING", "COMPLETED", "PARTIAL", "CANCELED", "AWAITING_PAYMENT", "IN_PROGRESS"],
    "TransactionStatus": ["PENDING", "COMPLETED", "ERROR", "SUCCESS", "FAILED"],
    "TransactionType": ["DEPOSIT", "WITHDRAWAL", "WITHDRAW", "REFUND", "ORDER_PAYMENT", "NEW_ORDER", "ORDER_STATUS_CHANGE"],
    "TicketStatus": ["OPEN", "PENDING", "CLOSED"],
    "MessageSender": ["USER", "STAFF", "SYSTEM", "INTERNAL"],
    "ServiceManagementMode": ["MANUAL", "SMART_IMPORT"],
    "Platform": ["TELEGRAM", "INSTAGRAM", "VK", "TIKTOK", "YOUTUBE", "FACEBOOK", "TWITTER", "OTHER", "DISCORD", "THREADS", "REDDIT", "TWITCH", "KICK", "RUTUBE", "DZEN", "MUSIC", "OK", "LIKEE", "WHATSAPP", "SPOTIFY", "SOUNDCLOUD", "LINKEDIN", "PINTEREST", "SNAPCHAT", "TROVO", "KWAI", "MESSENGER_MAX", "MAX", "GOOGLE", "APPLE", "YANDEX", "STEAM", "RUMBLE", "TUMBLR", "VIMEO", "SHAZAM", "QUORA", "MEDIUM", "WEBSITE", "PERISCOPE", "CLOUDHUB", "AUDIOMACK", "DATPIFF"],
    "Currency": ["RUB", "USD", "EUR", "KZT", "UAH", "TRY", "IDR", "INR", "THB", "VND"],
    "Category": ["SUBSCRIBERS", "LIKES", "VIEWS", "REACTIONS", "REPOSTS", "COMMENTS", "OTHER", "BOOSTS", "POLLS", "STORIES", "BOTS", "REFERRALS", "FRIENDS", "PLAYS", "RECOVER", "PREMIUM", "TRAFFIC", "DISLIKES", "GROUPS", "STREAMS", "WATCH_TIME", "SAVES", "STARS"],
    "BugSeverity": ["MINOR", "MAJOR", "CRITICAL"],
    "BugStatus": ["PENDING", "REVIEWING", "ACCEPTED", "REJECTED", "DUPLICATE"],
    "ReviewStatus": ["PENDING", "APPROVED", "REJECTED"],
    "AchievementType": ["FIRST_BLOOD", "HOT_STREAK", "REFERRAL_KING", "SPEED_DEMON", "BULLSEYE", "PIONEER_LEGEND", "BIG_SPENDER", "LOYAL_CUSTOMER", "EARLY_ADOPTER", "SOCIAL_BUTTERFLY"],
    "ChallengeType": ["TRIPLE_THREAT", "SOCIAL_SHARE", "EARLY_BIRD", "WEEKEND_WARRIOR", "SPENDING_SPREE"],
    "ServiceType": ["REGULAR", "BUNDLE"],
    "ProviderPaymentType": ["TOPUP", "REFUND", "ADJUSTMENT"]
};

const formattedEnums = {};
for (const [name, values] of Object.entries(enums)) {
    formattedEnums[name] = {
        name,
        values: values.map(v => ({ name: v, dbName: null }))
    };
}

const enumString = JSON.stringify(formattedEnums).replace(/"/g, '\\"');
const target = '\\"enums\\":{}';
const replacement = `\\"enums\\":${enumString}`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(indexPath, content);
    console.log('Successfully patched Prisma Client with enums.');
} else if (content.includes('exports.$Enums = {}')) {
    // Handling Prisma 7 style if it matches this pattern
    const prisma7Target = 'exports.$Enums = {}';
    const prisma7Replacement = `exports.$Enums = ${JSON.stringify(enums)}`;
    content = content.replace(prisma7Target, prisma7Replacement);
    fs.writeFileSync(indexPath, content);
    console.log('Successfully patched Prisma 7 Client with enums.');
} else {
    // Check if already patched
    if (content.includes('LedgerEntryType') && content.includes('DEPOSIT')) {
        console.log('Prisma Client is already patched or contains enums.');
    } else {
        console.warn('Could not find enum target in index.js and it does not seem to be patched.');
    }
}
