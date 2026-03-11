const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/app/admin/login/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Robust replacement for handleResetPassword
const oldFnStart = "const handleResetPassword = async (e: React.FormEvent) => {\r\n    e.preventDefault();\r\n    setIsLoading(true);\r\n    try {";
const newFn = `  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: resetStep === 1 ? 'request' : 'reset',
          email,
          code: resetCode,
          newPassword
        }),
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { error: text || res.statusText || 'Неизвестная ошибка сервера' };
      }

      if (res.ok) {
        if (resetStep === 1) {
          setResetStep(2);
          alert('Код отправлен на почту');
        } else {
          setIsResetting(false);
          setResetStep(1);
          alert('Пароль успешно изменен. Теперь вы можете войти.');
        }
      } else {
        alert("Ошибка: " + (data.error || 'Доступ запрещен'));
      }
    } catch (err: any) {
      console.error('Reset error:', err);
      alert('Ошибка при сбросе пароля: ' + (err.message || 'Ошибка сети'));
    } finally {
      setIsLoading(false);
    }
  };`;

// Find the function by its header and replace the whole block until its end (next constant or component end)
const pattern = /const handleResetPassword = async \(e: React\.FormEvent\) => \{[\s\S]*?finally \{[\s\S]*?\}[\s\S]*?\};/;
if (pattern.test(content)) {
    content = content.replace(pattern, newFn);
    fs.writeFileSync(filePath, content);
    console.log('✅ Success: Updated login page error handling with regex');
} else {
    console.error('❌ Error: Could not find handleResetPassword pattern');
}
