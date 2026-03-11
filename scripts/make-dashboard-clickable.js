const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/app/admin/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace Revenue Card
const revenueCardOld = /<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">[\s\S]*?<div className="p-2 bg-blue-50 text-blue-600 rounded-xl">[\s\S]*?<TrendingUp size=\{24\} \/>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Выручка<\/div>[\s\S]*?<div className="text-2xl font-bold text-slate-900">\{formatAmount\(stats\.revenue\)\}₽<\/div>[\s\S]*?<\/div>/;

const revenueCardNew = `        <Link href="/admin/finance" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <TrendingUp size={24} />
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Выручка</div>
          <div className="text-2xl font-bold text-slate-900">{formatAmount(stats.revenue)}₽</div>
        </Link>`;

content = content.replace(revenueCardOld, revenueCardNew);

// Replace Orders Card
const ordersCardOld = /<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">[\s\S]*?<div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">[\s\S]*?<ShoppingCart size=\{24\} \/>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Заказы<\/div>[\s\S]*?<div className="text-2xl font-bold text-slate-900">\{stats\.orderCount\}<\/div>[\s\S]*?<\/div>/;

const ordersCardNew = `        <Link href="/admin/orders" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <ShoppingCart size={24} />
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Заказы</div>
          <div className="text-2xl font-bold text-slate-900">{stats.orderCount}</div>
        </Link>`;

content = content.replace(ordersCardOld, ordersCardNew);

// Replace Clients Card
const clientsCardOld = /<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">[\s\S]*?<div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">[\s\S]*?<Users size=\{24\} \/>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Клиенты<\/div>[\s\S]*?<div className="text-2xl font-bold text-slate-900">\{stats\.userCount \|\| stats\.totalMatchingUsers \|\| stats\.allUsersCount \|\| 0\}<\/div>[\s\S]*?<\/div>/;

const clientsCardNew = `        <Link href="/admin/users" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Клиенты</div>
          <div className="text-2xl font-bold text-slate-900">{stats.userCount || stats.totalMatchingUsers || stats.allUsersCount || 0}</div>
        </Link>`;

content = content.replace(clientsCardOld, clientsCardNew);

// Replace Report Card
const reportCardOld = /<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">[\s\S]*?<div className="p-2 bg-amber-50 text-amber-600 rounded-xl">[\s\S]*?<MessageSquare size=\{24\} \/>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Репорт<\/div>[\s\S]*?<div className="text-2xl font-bold text-slate-900">\{stats\.openTicketsCount \|\| 0\} тикетов<\/div>[\s\S]*?<\/div>/;

const reportCardNew = `        <Link href="/admin/support" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <MessageSquare size={24} />
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Репорт</div>
          <div className="text-2xl font-bold text-slate-900">{stats.openTicketsCount || 0} тикетов</div>
        </Link>`;

content = content.replace(reportCardOld, reportCardNew);

// Optional: System Status items
content = content.replace(
    /<div className="flex items-center justify-between">[\s\S]*?<ShieldAlert size=\{20\} \/>[\s\S]*?Зависшие заказы[\s\S]*?<div className=\{\`px-3 py-1 rounded-lg text-sm font-bold \$\{stats\.stuckOrdersCount > 0 \? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'\}\`\}>\s*\{stats\.stuckOrdersCount \|\| 0\}\s*<\/div>\s*<\/div>/,
    `<Link href="/admin/orders?status=STUCK" className="flex items-center justify-between hover:bg-slate-50 p-2 rounded-xl transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Зависшие заказы</div>
                  <div className="text-[10px] text-slate-500">Требуют внимания</div>
                </div>
              </div>
              <div className={\`px-3 py-1 rounded-lg text-sm font-bold \$\{stats.stuckOrdersCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'\}\`}>
                {stats.stuckOrdersCount || 0}
              </div>
            </Link>`
);

content = content.replace(
    /<div className="flex items-center justify-between">[\s\S]*?<CreditCard size=\{20\} \/>[\s\S]*?Ожидают оплаты[\s\S]*?\{stats\.pendingPaymentsCount \|\| 0\}\s*<\/div>\s*<\/div>/,
    `<Link href="/admin/transactions" className="flex items-center justify-between hover:bg-slate-50 p-2 rounded-xl transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <CreditCard size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Ожидают оплаты</div>
                  <div className="text-[10px] text-slate-500">Транзакции в процессе</div>
                </div>
              </div>
              <div className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-sm font-bold">
                {stats.pendingPaymentsCount || 0}
              </div>
            </Link>`
);

fs.writeFileSync(filePath, content);
console.log('✅ Success: Made dashboard KPI cards and status items clickable');
