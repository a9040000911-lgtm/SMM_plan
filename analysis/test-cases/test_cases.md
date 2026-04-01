# Сгенерированные тест-кейсы

**Дата генерации:** 2026-03-25 22:46
**Всего тест-кейсов:** 276

## Роль: USER

| ID | Название | Тип | Приоритет | Модуль |
|---|---|---|---|---|
| TC-0001 | [USER] Авторизация: register - Happy Path | happy_path | P1 | auth |
| TC-0002 | [USER] Авторизация: register - Существующий email | error_path | P1 | auth |
| TC-0003 | [USER] Авторизация: register - Слабый пароль | error_path | P2 | auth |
| TC-0004 | [USER] Авторизация: register - Edge: Пробелы в email | edge_case | P3 | auth |
| TC-0005 | [USER] Авторизация: register - Edge: Unicode в email | edge_case | P3 | auth |
| TC-0006 | [USER] Авторизация: login - Happy Path | happy_path | P1 | auth |
| TC-0007 | [USER] Авторизация: login - Неверный пароль | error_path | P1 | auth |
| TC-0008 | [USER] Авторизация: login - Несуществующий email | error_path | P1 | auth |
| TC-0009 | [USER] Авторизация: login - Заблокированный аккаунт | error_path | P1 | auth |
| TC-0010 | [USER] Авторизация: login - Edge: Пустые данные | edge_case | P3 | auth |
| TC-0011 | [USER] Авторизация: logout - Happy Path | happy_path | P1 | auth |
| TC-0012 | [USER] Авторизация: logout - Edge: Пустые данные | edge_case | P3 | auth |
| TC-0013 | [USER] Авторизация: reset_password - Happy Path | happy_path | P1 | auth |
| TC-0014 | [USER] Авторизация: reset_password - Edge: Пустые данные | edge_case | P3 | auth |
| TC-0057 | [USER] Заказы: create - Happy Path | happy_path | P1 | orders |
| TC-0058 | [USER] Заказы: create - Недостаточно средств | error_path | P0 | orders |
| TC-0059 | [USER] Заказы: create - Невалидная ссылка | error_path | P1 | orders |
| TC-0060 | [USER] Заказы: create - Приватный профиль | error_path | P2 | orders |
| TC-0061 | [USER] Заказы: create - Превышен лимит | error_path | P3 | orders |
| TC-0062 | [USER] Заказы: create - Edge: Минимальное количество | edge_case | P3 | orders |
| TC-0063 | [USER] Заказы: create - Edge: Максимальное количество | edge_case | P3 | orders |
| TC-0064 | [USER] Заказы: create - Edge: Граничное (min-1) | edge_case | P3 | orders |
| TC-0065 | [USER] Заказы: create - Edge: Unicode в ссылке | edge_case | P3 | orders |
| TC-0066 | [USER] Заказы: cancel - Happy Path | happy_path | P1 | orders |
| TC-0067 | [USER] Заказы: cancel - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0068 | [USER] Заказы: repeat - Happy Path | happy_path | P1 | orders |
| TC-0069 | [USER] Заказы: repeat - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0070 | [USER] Заказы: list - Happy Path | happy_path | P1 | orders |
| TC-0071 | [USER] Заказы: list - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0072 | [USER] Заказы: view - Happy Path | happy_path | P1 | orders |
| TC-0073 | [USER] Заказы: view - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0125 | [USER] Финансы: deposit - Happy Path | happy_path | P1 | finance |
| TC-0126 | [USER] Финансы: deposit - Платёж отклонён | error_path | P1 | finance |
| TC-0127 | [USER] Финансы: deposit - Сумма ниже минимума | error_path | P2 | finance |
| TC-0128 | [USER] Финансы: deposit - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0129 | [USER] Финансы: withdraw - Happy Path | happy_path | P1 | finance |
| TC-0130 | [USER] Финансы: withdraw - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0131 | [USER] Финансы: history - Happy Path | happy_path | P1 | finance |
| TC-0132 | [USER] Финансы: history - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0133 | [USER] Финансы: convert - Happy Path | happy_path | P1 | finance |
| TC-0134 | [USER] Финансы: convert - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0165 | [USER] Услуги: list - Happy Path | happy_path | P1 | services |
| TC-0166 | [USER] Услуги: list - Edge: Пустые данные | edge_case | P3 | services |
| TC-0167 | [USER] Услуги: view - Happy Path | happy_path | P1 | services |
| TC-0168 | [USER] Услуги: view - Edge: Пустые данные | edge_case | P3 | services |
| TC-0169 | [USER] Услуги: create - Happy Path | happy_path | P1 | services |
| TC-0170 | [USER] Услуги: create - Edge: Пустые данные | edge_case | P3 | services |
| TC-0171 | [USER] Услуги: update - Happy Path | happy_path | P1 | services |
| TC-0172 | [USER] Услуги: update - Edge: Пустые данные | edge_case | P3 | services |
| TC-0173 | [USER] Услуги: delete - Happy Path | happy_path | P1 | services |
| TC-0174 | [USER] Услуги: delete - Edge: Пустые данные | edge_case | P3 | services |
| TC-0205 | [USER] Лояльность: referral_link - Happy Path | happy_path | P1 | loyalty |
| TC-0206 | [USER] Лояльность: referral_link - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0207 | [USER] Лояльность: referrals - Happy Path | happy_path | P1 | loyalty |
| TC-0208 | [USER] Лояльность: referrals - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0209 | [USER] Лояльность: achievements - Happy Path | happy_path | P1 | loyalty |
| TC-0210 | [USER] Лояльность: achievements - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0211 | [USER] Лояльность: bonus - Happy Path | happy_path | P1 | loyalty |
| TC-0212 | [USER] Лояльность: bonus - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0237 | [USER] Админ-панель: users - Happy Path | happy_path | P1 | admin |
| TC-0238 | [USER] Админ-панель: users - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0239 | [USER] Админ-панель: orders - Happy Path | happy_path | P1 | admin |
| TC-0240 | [USER] Админ-панель: orders - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0241 | [USER] Админ-панель: services - Happy Path | happy_path | P1 | admin |
| TC-0242 | [USER] Админ-панель: services - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0243 | [USER] Админ-панель: finance - Happy Path | happy_path | P1 | admin |
| TC-0244 | [USER] Админ-панель: finance - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0245 | [USER] Админ-панель: settings - Happy Path | happy_path | P1 | admin |
| TC-0246 | [USER] Админ-панель: settings - Edge: Пустые данные | edge_case | P3 | admin |

## Роль: ADMIN

| ID | Название | Тип | Приоритет | Модуль |
|---|---|---|---|---|
| TC-0015 | [ADMIN] Авторизация: register - Happy Path | happy_path | P1 | auth |
| TC-0016 | [ADMIN] Авторизация: register - Существующий email | error_path | P1 | auth |
| TC-0017 | [ADMIN] Авторизация: register - Слабый пароль | error_path | P2 | auth |
| TC-0018 | [ADMIN] Авторизация: register - Edge: Пробелы в email | edge_case | P3 | auth |
| TC-0019 | [ADMIN] Авторизация: register - Edge: Unicode в email | edge_case | P3 | auth |
| TC-0020 | [ADMIN] Авторизация: login - Happy Path | happy_path | P1 | auth |
| TC-0021 | [ADMIN] Авторизация: login - Неверный пароль | error_path | P1 | auth |
| TC-0022 | [ADMIN] Авторизация: login - Несуществующий email | error_path | P1 | auth |
| TC-0023 | [ADMIN] Авторизация: login - Заблокированный аккаунт | error_path | P1 | auth |
| TC-0024 | [ADMIN] Авторизация: login - Edge: Пустые данные | edge_case | P3 | auth |
| TC-0025 | [ADMIN] Авторизация: logout - Happy Path | happy_path | P1 | auth |
| TC-0026 | [ADMIN] Авторизация: logout - Edge: Пустые данные | edge_case | P3 | auth |
| TC-0027 | [ADMIN] Авторизация: reset_password - Happy Path | happy_path | P1 | auth |
| TC-0028 | [ADMIN] Авторизация: reset_password - Edge: Пустые данные | edge_case | P3 | auth |
| TC-0074 | [ADMIN] Заказы: create - Happy Path | happy_path | P1 | orders |
| TC-0075 | [ADMIN] Заказы: create - Недостаточно средств | error_path | P0 | orders |
| TC-0076 | [ADMIN] Заказы: create - Невалидная ссылка | error_path | P1 | orders |
| TC-0077 | [ADMIN] Заказы: create - Приватный профиль | error_path | P2 | orders |
| TC-0078 | [ADMIN] Заказы: create - Превышен лимит | error_path | P3 | orders |
| TC-0079 | [ADMIN] Заказы: create - Edge: Минимальное количество | edge_case | P3 | orders |
| TC-0080 | [ADMIN] Заказы: create - Edge: Максимальное количество | edge_case | P3 | orders |
| TC-0081 | [ADMIN] Заказы: create - Edge: Граничное (min-1) | edge_case | P3 | orders |
| TC-0082 | [ADMIN] Заказы: create - Edge: Unicode в ссылке | edge_case | P3 | orders |
| TC-0083 | [ADMIN] Заказы: cancel - Happy Path | happy_path | P1 | orders |
| TC-0084 | [ADMIN] Заказы: cancel - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0085 | [ADMIN] Заказы: repeat - Happy Path | happy_path | P1 | orders |
| TC-0086 | [ADMIN] Заказы: repeat - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0087 | [ADMIN] Заказы: list - Happy Path | happy_path | P1 | orders |
| TC-0088 | [ADMIN] Заказы: list - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0089 | [ADMIN] Заказы: view - Happy Path | happy_path | P1 | orders |
| TC-0090 | [ADMIN] Заказы: view - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0135 | [ADMIN] Финансы: deposit - Happy Path | happy_path | P1 | finance |
| TC-0136 | [ADMIN] Финансы: deposit - Платёж отклонён | error_path | P1 | finance |
| TC-0137 | [ADMIN] Финансы: deposit - Сумма ниже минимума | error_path | P2 | finance |
| TC-0138 | [ADMIN] Финансы: deposit - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0139 | [ADMIN] Финансы: withdraw - Happy Path | happy_path | P1 | finance |
| TC-0140 | [ADMIN] Финансы: withdraw - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0141 | [ADMIN] Финансы: history - Happy Path | happy_path | P1 | finance |
| TC-0142 | [ADMIN] Финансы: history - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0143 | [ADMIN] Финансы: convert - Happy Path | happy_path | P1 | finance |
| TC-0144 | [ADMIN] Финансы: convert - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0175 | [ADMIN] Услуги: list - Happy Path | happy_path | P1 | services |
| TC-0176 | [ADMIN] Услуги: list - Edge: Пустые данные | edge_case | P3 | services |
| TC-0177 | [ADMIN] Услуги: view - Happy Path | happy_path | P1 | services |
| TC-0178 | [ADMIN] Услуги: view - Edge: Пустые данные | edge_case | P3 | services |
| TC-0179 | [ADMIN] Услуги: create - Happy Path | happy_path | P1 | services |
| TC-0180 | [ADMIN] Услуги: create - Edge: Пустые данные | edge_case | P3 | services |
| TC-0181 | [ADMIN] Услуги: update - Happy Path | happy_path | P1 | services |
| TC-0182 | [ADMIN] Услуги: update - Edge: Пустые данные | edge_case | P3 | services |
| TC-0183 | [ADMIN] Услуги: delete - Happy Path | happy_path | P1 | services |
| TC-0184 | [ADMIN] Услуги: delete - Edge: Пустые данные | edge_case | P3 | services |
| TC-0213 | [ADMIN] Лояльность: referral_link - Happy Path | happy_path | P1 | loyalty |
| TC-0214 | [ADMIN] Лояльность: referral_link - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0215 | [ADMIN] Лояльность: referrals - Happy Path | happy_path | P1 | loyalty |
| TC-0216 | [ADMIN] Лояльность: referrals - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0217 | [ADMIN] Лояльность: achievements - Happy Path | happy_path | P1 | loyalty |
| TC-0218 | [ADMIN] Лояльность: achievements - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0219 | [ADMIN] Лояльность: bonus - Happy Path | happy_path | P1 | loyalty |
| TC-0220 | [ADMIN] Лояльность: bonus - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0247 | [ADMIN] Админ-панель: users - Happy Path | happy_path | P1 | admin |
| TC-0248 | [ADMIN] Админ-панель: users - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0249 | [ADMIN] Админ-панель: orders - Happy Path | happy_path | P1 | admin |
| TC-0250 | [ADMIN] Админ-панель: orders - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0251 | [ADMIN] Админ-панель: services - Happy Path | happy_path | P1 | admin |
| TC-0252 | [ADMIN] Админ-панель: services - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0253 | [ADMIN] Админ-панель: finance - Happy Path | happy_path | P1 | admin |
| TC-0254 | [ADMIN] Админ-панель: finance - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0255 | [ADMIN] Админ-панель: settings - Happy Path | happy_path | P1 | admin |
| TC-0256 | [ADMIN] Админ-панель: settings - Edge: Пустые данные | edge_case | P3 | admin |

## Роль: SUPERADMIN

| ID | Название | Тип | Приоритет | Модуль |
|---|---|---|---|---|
| TC-0029 | [SUPERADMIN] Авторизация: register - Happy Path | happy_path | P1 | auth |
| TC-0030 | [SUPERADMIN] Авторизация: register - Существующий email | error_path | P1 | auth |
| TC-0031 | [SUPERADMIN] Авторизация: register - Слабый пароль | error_path | P2 | auth |
| TC-0032 | [SUPERADMIN] Авторизация: register - Edge: Пробелы в email | edge_case | P3 | auth |
| TC-0033 | [SUPERADMIN] Авторизация: register - Edge: Unicode в email | edge_case | P3 | auth |
| TC-0034 | [SUPERADMIN] Авторизация: login - Happy Path | happy_path | P1 | auth |
| TC-0035 | [SUPERADMIN] Авторизация: login - Неверный пароль | error_path | P1 | auth |
| TC-0036 | [SUPERADMIN] Авторизация: login - Несуществующий email | error_path | P1 | auth |
| TC-0037 | [SUPERADMIN] Авторизация: login - Заблокированный аккаунт | error_path | P1 | auth |
| TC-0038 | [SUPERADMIN] Авторизация: login - Edge: Пустые данные | edge_case | P3 | auth |
| TC-0039 | [SUPERADMIN] Авторизация: logout - Happy Path | happy_path | P1 | auth |
| TC-0040 | [SUPERADMIN] Авторизация: logout - Edge: Пустые данные | edge_case | P3 | auth |
| TC-0041 | [SUPERADMIN] Авторизация: reset_password - Happy Path | happy_path | P1 | auth |
| TC-0042 | [SUPERADMIN] Авторизация: reset_password - Edge: Пустые данные | edge_case | P3 | auth |
| TC-0091 | [SUPERADMIN] Заказы: create - Happy Path | happy_path | P1 | orders |
| TC-0092 | [SUPERADMIN] Заказы: create - Недостаточно средств | error_path | P0 | orders |
| TC-0093 | [SUPERADMIN] Заказы: create - Невалидная ссылка | error_path | P1 | orders |
| TC-0094 | [SUPERADMIN] Заказы: create - Приватный профиль | error_path | P2 | orders |
| TC-0095 | [SUPERADMIN] Заказы: create - Превышен лимит | error_path | P3 | orders |
| TC-0096 | [SUPERADMIN] Заказы: create - Edge: Минимальное количество | edge_case | P3 | orders |
| TC-0097 | [SUPERADMIN] Заказы: create - Edge: Максимальное количество | edge_case | P3 | orders |
| TC-0098 | [SUPERADMIN] Заказы: create - Edge: Граничное (min-1) | edge_case | P3 | orders |
| TC-0099 | [SUPERADMIN] Заказы: create - Edge: Unicode в ссылке | edge_case | P3 | orders |
| TC-0100 | [SUPERADMIN] Заказы: cancel - Happy Path | happy_path | P1 | orders |
| TC-0101 | [SUPERADMIN] Заказы: cancel - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0102 | [SUPERADMIN] Заказы: repeat - Happy Path | happy_path | P1 | orders |
| TC-0103 | [SUPERADMIN] Заказы: repeat - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0104 | [SUPERADMIN] Заказы: list - Happy Path | happy_path | P1 | orders |
| TC-0105 | [SUPERADMIN] Заказы: list - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0106 | [SUPERADMIN] Заказы: view - Happy Path | happy_path | P1 | orders |
| TC-0107 | [SUPERADMIN] Заказы: view - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0145 | [SUPERADMIN] Финансы: deposit - Happy Path | happy_path | P1 | finance |
| TC-0146 | [SUPERADMIN] Финансы: deposit - Платёж отклонён | error_path | P1 | finance |
| TC-0147 | [SUPERADMIN] Финансы: deposit - Сумма ниже минимума | error_path | P2 | finance |
| TC-0148 | [SUPERADMIN] Финансы: deposit - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0149 | [SUPERADMIN] Финансы: withdraw - Happy Path | happy_path | P1 | finance |
| TC-0150 | [SUPERADMIN] Финансы: withdraw - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0151 | [SUPERADMIN] Финансы: history - Happy Path | happy_path | P1 | finance |
| TC-0152 | [SUPERADMIN] Финансы: history - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0153 | [SUPERADMIN] Финансы: convert - Happy Path | happy_path | P1 | finance |
| TC-0154 | [SUPERADMIN] Финансы: convert - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0185 | [SUPERADMIN] Услуги: list - Happy Path | happy_path | P1 | services |
| TC-0186 | [SUPERADMIN] Услуги: list - Edge: Пустые данные | edge_case | P3 | services |
| TC-0187 | [SUPERADMIN] Услуги: view - Happy Path | happy_path | P1 | services |
| TC-0188 | [SUPERADMIN] Услуги: view - Edge: Пустые данные | edge_case | P3 | services |
| TC-0189 | [SUPERADMIN] Услуги: create - Happy Path | happy_path | P1 | services |
| TC-0190 | [SUPERADMIN] Услуги: create - Edge: Пустые данные | edge_case | P3 | services |
| TC-0191 | [SUPERADMIN] Услуги: update - Happy Path | happy_path | P1 | services |
| TC-0192 | [SUPERADMIN] Услуги: update - Edge: Пустые данные | edge_case | P3 | services |
| TC-0193 | [SUPERADMIN] Услуги: delete - Happy Path | happy_path | P1 | services |
| TC-0194 | [SUPERADMIN] Услуги: delete - Edge: Пустые данные | edge_case | P3 | services |
| TC-0221 | [SUPERADMIN] Лояльность: referral_link - Happy Path | happy_path | P1 | loyalty |
| TC-0222 | [SUPERADMIN] Лояльность: referral_link - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0223 | [SUPERADMIN] Лояльность: referrals - Happy Path | happy_path | P1 | loyalty |
| TC-0224 | [SUPERADMIN] Лояльность: referrals - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0225 | [SUPERADMIN] Лояльность: achievements - Happy Path | happy_path | P1 | loyalty |
| TC-0226 | [SUPERADMIN] Лояльность: achievements - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0227 | [SUPERADMIN] Лояльность: bonus - Happy Path | happy_path | P1 | loyalty |
| TC-0228 | [SUPERADMIN] Лояльность: bonus - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0257 | [SUPERADMIN] Админ-панель: users - Happy Path | happy_path | P1 | admin |
| TC-0258 | [SUPERADMIN] Админ-панель: users - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0259 | [SUPERADMIN] Админ-панель: orders - Happy Path | happy_path | P1 | admin |
| TC-0260 | [SUPERADMIN] Админ-панель: orders - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0261 | [SUPERADMIN] Админ-панель: services - Happy Path | happy_path | P1 | admin |
| TC-0262 | [SUPERADMIN] Админ-панель: services - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0263 | [SUPERADMIN] Админ-панель: finance - Happy Path | happy_path | P1 | admin |
| TC-0264 | [SUPERADMIN] Админ-панель: finance - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0265 | [SUPERADMIN] Админ-панель: settings - Happy Path | happy_path | P1 | admin |
| TC-0266 | [SUPERADMIN] Админ-панель: settings - Edge: Пустые данные | edge_case | P3 | admin |

## Роль: SUPPORT

| ID | Название | Тип | Приоритет | Модуль |
|---|---|---|---|---|
| TC-0043 | [SUPPORT] Авторизация: register - Happy Path | happy_path | P1 | auth |
| TC-0044 | [SUPPORT] Авторизация: register - Существующий email | error_path | P1 | auth |
| TC-0045 | [SUPPORT] Авторизация: register - Слабый пароль | error_path | P2 | auth |
| TC-0046 | [SUPPORT] Авторизация: register - Edge: Пробелы в email | edge_case | P3 | auth |
| TC-0047 | [SUPPORT] Авторизация: register - Edge: Unicode в email | edge_case | P3 | auth |
| TC-0048 | [SUPPORT] Авторизация: login - Happy Path | happy_path | P1 | auth |
| TC-0049 | [SUPPORT] Авторизация: login - Неверный пароль | error_path | P1 | auth |
| TC-0050 | [SUPPORT] Авторизация: login - Несуществующий email | error_path | P1 | auth |
| TC-0051 | [SUPPORT] Авторизация: login - Заблокированный аккаунт | error_path | P1 | auth |
| TC-0052 | [SUPPORT] Авторизация: login - Edge: Пустые данные | edge_case | P3 | auth |
| TC-0053 | [SUPPORT] Авторизация: logout - Happy Path | happy_path | P1 | auth |
| TC-0054 | [SUPPORT] Авторизация: logout - Edge: Пустые данные | edge_case | P3 | auth |
| TC-0055 | [SUPPORT] Авторизация: reset_password - Happy Path | happy_path | P1 | auth |
| TC-0056 | [SUPPORT] Авторизация: reset_password - Edge: Пустые данные | edge_case | P3 | auth |
| TC-0108 | [SUPPORT] Заказы: create - Happy Path | happy_path | P1 | orders |
| TC-0109 | [SUPPORT] Заказы: create - Недостаточно средств | error_path | P0 | orders |
| TC-0110 | [SUPPORT] Заказы: create - Невалидная ссылка | error_path | P1 | orders |
| TC-0111 | [SUPPORT] Заказы: create - Приватный профиль | error_path | P2 | orders |
| TC-0112 | [SUPPORT] Заказы: create - Превышен лимит | error_path | P3 | orders |
| TC-0113 | [SUPPORT] Заказы: create - Edge: Минимальное количество | edge_case | P3 | orders |
| TC-0114 | [SUPPORT] Заказы: create - Edge: Максимальное количество | edge_case | P3 | orders |
| TC-0115 | [SUPPORT] Заказы: create - Edge: Граничное (min-1) | edge_case | P3 | orders |
| TC-0116 | [SUPPORT] Заказы: create - Edge: Unicode в ссылке | edge_case | P3 | orders |
| TC-0117 | [SUPPORT] Заказы: cancel - Happy Path | happy_path | P1 | orders |
| TC-0118 | [SUPPORT] Заказы: cancel - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0119 | [SUPPORT] Заказы: repeat - Happy Path | happy_path | P1 | orders |
| TC-0120 | [SUPPORT] Заказы: repeat - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0121 | [SUPPORT] Заказы: list - Happy Path | happy_path | P1 | orders |
| TC-0122 | [SUPPORT] Заказы: list - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0123 | [SUPPORT] Заказы: view - Happy Path | happy_path | P1 | orders |
| TC-0124 | [SUPPORT] Заказы: view - Edge: Пустые данные | edge_case | P3 | orders |
| TC-0155 | [SUPPORT] Финансы: deposit - Happy Path | happy_path | P1 | finance |
| TC-0156 | [SUPPORT] Финансы: deposit - Платёж отклонён | error_path | P1 | finance |
| TC-0157 | [SUPPORT] Финансы: deposit - Сумма ниже минимума | error_path | P2 | finance |
| TC-0158 | [SUPPORT] Финансы: deposit - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0159 | [SUPPORT] Финансы: withdraw - Happy Path | happy_path | P1 | finance |
| TC-0160 | [SUPPORT] Финансы: withdraw - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0161 | [SUPPORT] Финансы: history - Happy Path | happy_path | P1 | finance |
| TC-0162 | [SUPPORT] Финансы: history - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0163 | [SUPPORT] Финансы: convert - Happy Path | happy_path | P1 | finance |
| TC-0164 | [SUPPORT] Финансы: convert - Edge: Пустые данные | edge_case | P3 | finance |
| TC-0195 | [SUPPORT] Услуги: list - Happy Path | happy_path | P1 | services |
| TC-0196 | [SUPPORT] Услуги: list - Edge: Пустые данные | edge_case | P3 | services |
| TC-0197 | [SUPPORT] Услуги: view - Happy Path | happy_path | P1 | services |
| TC-0198 | [SUPPORT] Услуги: view - Edge: Пустые данные | edge_case | P3 | services |
| TC-0199 | [SUPPORT] Услуги: create - Happy Path | happy_path | P1 | services |
| TC-0200 | [SUPPORT] Услуги: create - Edge: Пустые данные | edge_case | P3 | services |
| TC-0201 | [SUPPORT] Услуги: update - Happy Path | happy_path | P1 | services |
| TC-0202 | [SUPPORT] Услуги: update - Edge: Пустые данные | edge_case | P3 | services |
| TC-0203 | [SUPPORT] Услуги: delete - Happy Path | happy_path | P1 | services |
| TC-0204 | [SUPPORT] Услуги: delete - Edge: Пустые данные | edge_case | P3 | services |
| TC-0229 | [SUPPORT] Лояльность: referral_link - Happy Path | happy_path | P1 | loyalty |
| TC-0230 | [SUPPORT] Лояльность: referral_link - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0231 | [SUPPORT] Лояльность: referrals - Happy Path | happy_path | P1 | loyalty |
| TC-0232 | [SUPPORT] Лояльность: referrals - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0233 | [SUPPORT] Лояльность: achievements - Happy Path | happy_path | P1 | loyalty |
| TC-0234 | [SUPPORT] Лояльность: achievements - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0235 | [SUPPORT] Лояльность: bonus - Happy Path | happy_path | P1 | loyalty |
| TC-0236 | [SUPPORT] Лояльность: bonus - Edge: Пустые данные | edge_case | P3 | loyalty |
| TC-0267 | [SUPPORT] Админ-панель: users - Happy Path | happy_path | P1 | admin |
| TC-0268 | [SUPPORT] Админ-панель: users - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0269 | [SUPPORT] Админ-панель: orders - Happy Path | happy_path | P1 | admin |
| TC-0270 | [SUPPORT] Админ-панель: orders - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0271 | [SUPPORT] Админ-панель: services - Happy Path | happy_path | P1 | admin |
| TC-0272 | [SUPPORT] Админ-панель: services - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0273 | [SUPPORT] Админ-панель: finance - Happy Path | happy_path | P1 | admin |
| TC-0274 | [SUPPORT] Админ-панель: finance - Edge: Пустые данные | edge_case | P3 | admin |
| TC-0275 | [SUPPORT] Админ-панель: settings - Happy Path | happy_path | P1 | admin |
| TC-0276 | [SUPPORT] Админ-панель: settings - Edge: Пустые данные | edge_case | P3 | admin |

---

## Детали тест-кейсов

### TC-0001: [USER] Авторизация: register - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу регистрации | Форма загружена |
| 2 | Ввести email | Email валиден |
| 3 | Ввести пароль | Пароль соответствует требованиям |
| 4 | Нажать 'Зарегистрироваться' | Аккаунт создан, email отправлен |

**Ожидаемый результат:** Успешное выполнение: register

### TC-0002: [USER] Авторизация: register - Существующий email

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу регистрации | Форма загружена |
| 2 | Ввести email | Email валиден |
| 3 | Ввести пароль | Пароль соответствует требованиям |
| 5 | Сценарий: Существующий email | Ошибка: email уже зарегистрирован |

**Ожидаемый результат:** Ошибка: email уже зарегистрирован

### TC-0003: [USER] Авторизация: register - Слабый пароль

- **Тип:** error_path
- **Приоритет:** P2
- **Роль:** USER
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу регистрации | Форма загружена |
| 2 | Ввести email | Email валиден |
| 3 | Ввести пароль | Пароль соответствует требованиям |
| 5 | Сценарий: Слабый пароль | Ошибка: пароль не соответствует требованиям |

**Ожидаемый результат:** Ошибка: пароль не соответствует требованиям

### TC-0004: [USER] Авторизация: register - Edge: Пробелы в email

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'email': ' user@email.com '} | Данные готовы |
| 2 | Выполнить: register | Trim и принятие |

**Ожидаемый результат:** Trim и принятие

### TC-0005: [USER] Авторизация: register - Edge: Unicode в email

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'email': 'пользователь@почта.рф'} | Данные готовы |
| 2 | Выполнить: register | Корректная обработка |

**Ожидаемый результат:** Корректная обработка

### TC-0006: [USER] Авторизация: login - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 4 | Нажать 'Войти' | Успешный вход, редирект |

**Ожидаемый результат:** Успешное выполнение: login

### TC-0007: [USER] Авторизация: login - Неверный пароль

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 5 | Сценарий: Неверный пароль | Ошибка: неверные учётные данные |

**Ожидаемый результат:** Ошибка: неверные учётные данные

### TC-0008: [USER] Авторизация: login - Несуществующий email

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 5 | Сценарий: Несуществующий email | Ошибка: пользователь не найден |

**Ожидаемый результат:** Ошибка: пользователь не найден

### TC-0009: [USER] Авторизация: login - Заблокированный аккаунт

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 5 | Сценарий: Заблокированный аккаунт | Ошибка: аккаунт заблокирован |

**Ожидаемый результат:** Ошибка: аккаунт заблокирован

### TC-0010: [USER] Авторизация: login - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: login | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0011: [USER] Авторизация: logout - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: logout | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: logout

### TC-0012: [USER] Авторизация: logout - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: logout | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0013: [USER] Авторизация: reset_password - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: reset_password | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: reset_password

### TC-0014: [USER] Авторизация: reset_password - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: reset_password | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0015: [ADMIN] Авторизация: register - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу регистрации | Форма загружена |
| 2 | Ввести email | Email валиден |
| 3 | Ввести пароль | Пароль соответствует требованиям |
| 4 | Нажать 'Зарегистрироваться' | Аккаунт создан, email отправлен |

**Ожидаемый результат:** Успешное выполнение: register

### TC-0016: [ADMIN] Авторизация: register - Существующий email

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу регистрации | Форма загружена |
| 2 | Ввести email | Email валиден |
| 3 | Ввести пароль | Пароль соответствует требованиям |
| 5 | Сценарий: Существующий email | Ошибка: email уже зарегистрирован |

**Ожидаемый результат:** Ошибка: email уже зарегистрирован

### TC-0017: [ADMIN] Авторизация: register - Слабый пароль

- **Тип:** error_path
- **Приоритет:** P2
- **Роль:** ADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу регистрации | Форма загружена |
| 2 | Ввести email | Email валиден |
| 3 | Ввести пароль | Пароль соответствует требованиям |
| 5 | Сценарий: Слабый пароль | Ошибка: пароль не соответствует требованиям |

**Ожидаемый результат:** Ошибка: пароль не соответствует требованиям

### TC-0018: [ADMIN] Авторизация: register - Edge: Пробелы в email

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'email': ' user@email.com '} | Данные готовы |
| 2 | Выполнить: register | Trim и принятие |

**Ожидаемый результат:** Trim и принятие

### TC-0019: [ADMIN] Авторизация: register - Edge: Unicode в email

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'email': 'пользователь@почта.рф'} | Данные готовы |
| 2 | Выполнить: register | Корректная обработка |

**Ожидаемый результат:** Корректная обработка

### TC-0020: [ADMIN] Авторизация: login - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 4 | Нажать 'Войти' | Успешный вход, редирект |

**Ожидаемый результат:** Успешное выполнение: login

### TC-0021: [ADMIN] Авторизация: login - Неверный пароль

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 5 | Сценарий: Неверный пароль | Ошибка: неверные учётные данные |

**Ожидаемый результат:** Ошибка: неверные учётные данные

### TC-0022: [ADMIN] Авторизация: login - Несуществующий email

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 5 | Сценарий: Несуществующий email | Ошибка: пользователь не найден |

**Ожидаемый результат:** Ошибка: пользователь не найден

### TC-0023: [ADMIN] Авторизация: login - Заблокированный аккаунт

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 5 | Сценарий: Заблокированный аккаунт | Ошибка: аккаунт заблокирован |

**Ожидаемый результат:** Ошибка: аккаунт заблокирован

### TC-0024: [ADMIN] Авторизация: login - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: login | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0025: [ADMIN] Авторизация: logout - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: logout | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: logout

### TC-0026: [ADMIN] Авторизация: logout - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: logout | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0027: [ADMIN] Авторизация: reset_password - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: reset_password | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: reset_password

### TC-0028: [ADMIN] Авторизация: reset_password - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: reset_password | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0029: [SUPERADMIN] Авторизация: register - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу регистрации | Форма загружена |
| 2 | Ввести email | Email валиден |
| 3 | Ввести пароль | Пароль соответствует требованиям |
| 4 | Нажать 'Зарегистрироваться' | Аккаунт создан, email отправлен |

**Ожидаемый результат:** Успешное выполнение: register

### TC-0030: [SUPERADMIN] Авторизация: register - Существующий email

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу регистрации | Форма загружена |
| 2 | Ввести email | Email валиден |
| 3 | Ввести пароль | Пароль соответствует требованиям |
| 5 | Сценарий: Существующий email | Ошибка: email уже зарегистрирован |

**Ожидаемый результат:** Ошибка: email уже зарегистрирован

### TC-0031: [SUPERADMIN] Авторизация: register - Слабый пароль

- **Тип:** error_path
- **Приоритет:** P2
- **Роль:** SUPERADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу регистрации | Форма загружена |
| 2 | Ввести email | Email валиден |
| 3 | Ввести пароль | Пароль соответствует требованиям |
| 5 | Сценарий: Слабый пароль | Ошибка: пароль не соответствует требованиям |

**Ожидаемый результат:** Ошибка: пароль не соответствует требованиям

### TC-0032: [SUPERADMIN] Авторизация: register - Edge: Пробелы в email

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'email': ' user@email.com '} | Данные готовы |
| 2 | Выполнить: register | Trim и принятие |

**Ожидаемый результат:** Trim и принятие

### TC-0033: [SUPERADMIN] Авторизация: register - Edge: Unicode в email

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'email': 'пользователь@почта.рф'} | Данные готовы |
| 2 | Выполнить: register | Корректная обработка |

**Ожидаемый результат:** Корректная обработка

### TC-0034: [SUPERADMIN] Авторизация: login - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 4 | Нажать 'Войти' | Успешный вход, редирект |

**Ожидаемый результат:** Успешное выполнение: login

### TC-0035: [SUPERADMIN] Авторизация: login - Неверный пароль

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 5 | Сценарий: Неверный пароль | Ошибка: неверные учётные данные |

**Ожидаемый результат:** Ошибка: неверные учётные данные

### TC-0036: [SUPERADMIN] Авторизация: login - Несуществующий email

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 5 | Сценарий: Несуществующий email | Ошибка: пользователь не найден |

**Ожидаемый результат:** Ошибка: пользователь не найден

### TC-0037: [SUPERADMIN] Авторизация: login - Заблокированный аккаунт

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 5 | Сценарий: Заблокированный аккаунт | Ошибка: аккаунт заблокирован |

**Ожидаемый результат:** Ошибка: аккаунт заблокирован

### TC-0038: [SUPERADMIN] Авторизация: login - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: login | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0039: [SUPERADMIN] Авторизация: logout - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: logout | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: logout

### TC-0040: [SUPERADMIN] Авторизация: logout - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: logout | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0041: [SUPERADMIN] Авторизация: reset_password - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: reset_password | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: reset_password

### TC-0042: [SUPERADMIN] Авторизация: reset_password - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: reset_password | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0043: [SUPPORT] Авторизация: register - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу регистрации | Форма загружена |
| 2 | Ввести email | Email валиден |
| 3 | Ввести пароль | Пароль соответствует требованиям |
| 4 | Нажать 'Зарегистрироваться' | Аккаунт создан, email отправлен |

**Ожидаемый результат:** Успешное выполнение: register

### TC-0044: [SUPPORT] Авторизация: register - Существующий email

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу регистрации | Форма загружена |
| 2 | Ввести email | Email валиден |
| 3 | Ввести пароль | Пароль соответствует требованиям |
| 5 | Сценарий: Существующий email | Ошибка: email уже зарегистрирован |

**Ожидаемый результат:** Ошибка: email уже зарегистрирован

### TC-0045: [SUPPORT] Авторизация: register - Слабый пароль

- **Тип:** error_path
- **Приоритет:** P2
- **Роль:** SUPPORT
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу регистрации | Форма загружена |
| 2 | Ввести email | Email валиден |
| 3 | Ввести пароль | Пароль соответствует требованиям |
| 5 | Сценарий: Слабый пароль | Ошибка: пароль не соответствует требованиям |

**Ожидаемый результат:** Ошибка: пароль не соответствует требованиям

### TC-0046: [SUPPORT] Авторизация: register - Edge: Пробелы в email

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'email': ' user@email.com '} | Данные готовы |
| 2 | Выполнить: register | Trim и принятие |

**Ожидаемый результат:** Trim и принятие

### TC-0047: [SUPPORT] Авторизация: register - Edge: Unicode в email

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'email': 'пользователь@почта.рф'} | Данные готовы |
| 2 | Выполнить: register | Корректная обработка |

**Ожидаемый результат:** Корректная обработка

### TC-0048: [SUPPORT] Авторизация: login - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 4 | Нажать 'Войти' | Успешный вход, редирект |

**Ожидаемый результат:** Успешное выполнение: login

### TC-0049: [SUPPORT] Авторизация: login - Неверный пароль

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 5 | Сценарий: Неверный пароль | Ошибка: неверные учётные данные |

**Ожидаемый результат:** Ошибка: неверные учётные данные

### TC-0050: [SUPPORT] Авторизация: login - Несуществующий email

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 5 | Сценарий: Несуществующий email | Ошибка: пользователь не найден |

**Ожидаемый результат:** Ошибка: пользователь не найден

### TC-0051: [SUPPORT] Авторизация: login - Заблокированный аккаунт

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Открыть страницу входа | Форма загружена |
| 2 | Ввести email | Email принят |
| 3 | Ввести пароль | Пароль принят |
| 5 | Сценарий: Заблокированный аккаунт | Ошибка: аккаунт заблокирован |

**Ожидаемый результат:** Ошибка: аккаунт заблокирован

### TC-0052: [SUPPORT] Авторизация: login - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: login | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0053: [SUPPORT] Авторизация: logout - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: logout | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: logout

### TC-0054: [SUPPORT] Авторизация: logout - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: logout | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0055: [SUPPORT] Авторизация: reset_password - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: reset_password | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: reset_password

### TC-0056: [SUPPORT] Авторизация: reset_password - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** auth

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: reset_password | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0057: [USER] Заказы: create - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 4 | Ввести валидную ссылку | Ссылка принята |
| 5 | Ввести количество | Стоимость рассчитана |
| 6 | Нажать 'Создать заказ' | Заказ создан, баланс списан |

**Ожидаемый результат:** Успешное выполнение: create

### TC-0058: [USER] Заказы: create - Недостаточно средств

- **Тип:** error_path
- **Приоритет:** P0
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Недостаточно средств | Ошибка: пополните баланс |

**Ожидаемый результат:** Ошибка: пополните баланс

### TC-0059: [USER] Заказы: create - Невалидная ссылка

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Невалидная ссылка | Ошибка валидации ссылки |

**Ожидаемый результат:** Ошибка валидации ссылки

### TC-0060: [USER] Заказы: create - Приватный профиль

- **Тип:** error_path
- **Приоритет:** P2
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Приватный профиль | Ошибка: профиль должен быть открыт |

**Ожидаемый результат:** Ошибка: профиль должен быть открыт

### TC-0061: [USER] Заказы: create - Превышен лимит

- **Тип:** error_path
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Превышен лимит | Ошибка: превышен максимум/минимум |

**Ожидаемый результат:** Ошибка: превышен максимум/минимум

### TC-0062: [USER] Заказы: create - Edge: Минимальное количество

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'quantity': 'min'} | Данные готовы |
| 2 | Выполнить: create | Заказ создаётся |

**Ожидаемый результат:** Заказ создаётся

### TC-0063: [USER] Заказы: create - Edge: Максимальное количество

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'quantity': 'max'} | Данные готовы |
| 2 | Выполнить: create | Заказ создаётся |

**Ожидаемый результат:** Заказ создаётся

### TC-0064: [USER] Заказы: create - Edge: Граничное (min-1)

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'quantity': 'min-1'} | Данные готовы |
| 2 | Выполнить: create | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0065: [USER] Заказы: create - Edge: Unicode в ссылке

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'link': 'https://x.com/пользователь'} | Данные готовы |
| 2 | Выполнить: create | Корректная обработка |

**Ожидаемый результат:** Корректная обработка

### TC-0066: [USER] Заказы: cancel - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Открыть активный заказ | Страница заказа открыта |
| 3 | Нажать 'Отменить' | Заказ отменён, частичный возврат |

**Ожидаемый результат:** Успешное выполнение: cancel

### TC-0067: [USER] Заказы: cancel - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: cancel | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0068: [USER] Заказы: repeat - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: repeat | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: repeat

### TC-0069: [USER] Заказы: repeat - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: repeat | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0070: [USER] Заказы: list - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Мои заказы' | Список заказов загружен |

**Ожидаемый результат:** Успешное выполнение: list

### TC-0071: [USER] Заказы: list - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: list | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0072: [USER] Заказы: view - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: view | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: view

### TC-0073: [USER] Заказы: view - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: view | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0074: [ADMIN] Заказы: create - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 4 | Ввести валидную ссылку | Ссылка принята |
| 5 | Ввести количество | Стоимость рассчитана |
| 6 | Нажать 'Создать заказ' | Заказ создан, баланс списан |

**Ожидаемый результат:** Успешное выполнение: create

### TC-0075: [ADMIN] Заказы: create - Недостаточно средств

- **Тип:** error_path
- **Приоритет:** P0
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Недостаточно средств | Ошибка: пополните баланс |

**Ожидаемый результат:** Ошибка: пополните баланс

### TC-0076: [ADMIN] Заказы: create - Невалидная ссылка

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Невалидная ссылка | Ошибка валидации ссылки |

**Ожидаемый результат:** Ошибка валидации ссылки

### TC-0077: [ADMIN] Заказы: create - Приватный профиль

- **Тип:** error_path
- **Приоритет:** P2
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Приватный профиль | Ошибка: профиль должен быть открыт |

**Ожидаемый результат:** Ошибка: профиль должен быть открыт

### TC-0078: [ADMIN] Заказы: create - Превышен лимит

- **Тип:** error_path
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Превышен лимит | Ошибка: превышен максимум/минимум |

**Ожидаемый результат:** Ошибка: превышен максимум/минимум

### TC-0079: [ADMIN] Заказы: create - Edge: Минимальное количество

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'quantity': 'min'} | Данные готовы |
| 2 | Выполнить: create | Заказ создаётся |

**Ожидаемый результат:** Заказ создаётся

### TC-0080: [ADMIN] Заказы: create - Edge: Максимальное количество

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'quantity': 'max'} | Данные готовы |
| 2 | Выполнить: create | Заказ создаётся |

**Ожидаемый результат:** Заказ создаётся

### TC-0081: [ADMIN] Заказы: create - Edge: Граничное (min-1)

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'quantity': 'min-1'} | Данные готовы |
| 2 | Выполнить: create | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0082: [ADMIN] Заказы: create - Edge: Unicode в ссылке

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'link': 'https://x.com/пользователь'} | Данные готовы |
| 2 | Выполнить: create | Корректная обработка |

**Ожидаемый результат:** Корректная обработка

### TC-0083: [ADMIN] Заказы: cancel - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Открыть активный заказ | Страница заказа открыта |
| 3 | Нажать 'Отменить' | Заказ отменён, частичный возврат |

**Ожидаемый результат:** Успешное выполнение: cancel

### TC-0084: [ADMIN] Заказы: cancel - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: cancel | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0085: [ADMIN] Заказы: repeat - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: repeat | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: repeat

### TC-0086: [ADMIN] Заказы: repeat - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: repeat | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0087: [ADMIN] Заказы: list - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Мои заказы' | Список заказов загружен |

**Ожидаемый результат:** Успешное выполнение: list

### TC-0088: [ADMIN] Заказы: list - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: list | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0089: [ADMIN] Заказы: view - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: view | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: view

### TC-0090: [ADMIN] Заказы: view - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: view | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0091: [SUPERADMIN] Заказы: create - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 4 | Ввести валидную ссылку | Ссылка принята |
| 5 | Ввести количество | Стоимость рассчитана |
| 6 | Нажать 'Создать заказ' | Заказ создан, баланс списан |

**Ожидаемый результат:** Успешное выполнение: create

### TC-0092: [SUPERADMIN] Заказы: create - Недостаточно средств

- **Тип:** error_path
- **Приоритет:** P0
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Недостаточно средств | Ошибка: пополните баланс |

**Ожидаемый результат:** Ошибка: пополните баланс

### TC-0093: [SUPERADMIN] Заказы: create - Невалидная ссылка

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Невалидная ссылка | Ошибка валидации ссылки |

**Ожидаемый результат:** Ошибка валидации ссылки

### TC-0094: [SUPERADMIN] Заказы: create - Приватный профиль

- **Тип:** error_path
- **Приоритет:** P2
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Приватный профиль | Ошибка: профиль должен быть открыт |

**Ожидаемый результат:** Ошибка: профиль должен быть открыт

### TC-0095: [SUPERADMIN] Заказы: create - Превышен лимит

- **Тип:** error_path
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Превышен лимит | Ошибка: превышен максимум/минимум |

**Ожидаемый результат:** Ошибка: превышен максимум/минимум

### TC-0096: [SUPERADMIN] Заказы: create - Edge: Минимальное количество

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'quantity': 'min'} | Данные готовы |
| 2 | Выполнить: create | Заказ создаётся |

**Ожидаемый результат:** Заказ создаётся

### TC-0097: [SUPERADMIN] Заказы: create - Edge: Максимальное количество

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'quantity': 'max'} | Данные готовы |
| 2 | Выполнить: create | Заказ создаётся |

**Ожидаемый результат:** Заказ создаётся

### TC-0098: [SUPERADMIN] Заказы: create - Edge: Граничное (min-1)

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'quantity': 'min-1'} | Данные готовы |
| 2 | Выполнить: create | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0099: [SUPERADMIN] Заказы: create - Edge: Unicode в ссылке

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'link': 'https://x.com/пользователь'} | Данные готовы |
| 2 | Выполнить: create | Корректная обработка |

**Ожидаемый результат:** Корректная обработка

### TC-0100: [SUPERADMIN] Заказы: cancel - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Открыть активный заказ | Страница заказа открыта |
| 3 | Нажать 'Отменить' | Заказ отменён, частичный возврат |

**Ожидаемый результат:** Успешное выполнение: cancel

### TC-0101: [SUPERADMIN] Заказы: cancel - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: cancel | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0102: [SUPERADMIN] Заказы: repeat - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: repeat | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: repeat

### TC-0103: [SUPERADMIN] Заказы: repeat - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: repeat | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0104: [SUPERADMIN] Заказы: list - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Мои заказы' | Список заказов загружен |

**Ожидаемый результат:** Успешное выполнение: list

### TC-0105: [SUPERADMIN] Заказы: list - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: list | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0106: [SUPERADMIN] Заказы: view - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: view | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: view

### TC-0107: [SUPERADMIN] Заказы: view - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: view | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0108: [SUPPORT] Заказы: create - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 4 | Ввести валидную ссылку | Ссылка принята |
| 5 | Ввести количество | Стоимость рассчитана |
| 6 | Нажать 'Создать заказ' | Заказ создан, баланс списан |

**Ожидаемый результат:** Успешное выполнение: create

### TC-0109: [SUPPORT] Заказы: create - Недостаточно средств

- **Тип:** error_path
- **Приоритет:** P0
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Недостаточно средств | Ошибка: пополните баланс |

**Ожидаемый результат:** Ошибка: пополните баланс

### TC-0110: [SUPPORT] Заказы: create - Невалидная ссылка

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Невалидная ссылка | Ошибка валидации ссылки |

**Ожидаемый результат:** Ошибка валидации ссылки

### TC-0111: [SUPPORT] Заказы: create - Приватный профиль

- **Тип:** error_path
- **Приоритет:** P2
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Приватный профиль | Ошибка: профиль должен быть открыт |

**Ожидаемый результат:** Ошибка: профиль должен быть открыт

### TC-0112: [SUPPORT] Заказы: create - Превышен лимит

- **Тип:** error_path
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в каталог услуг | Список услуг загружен |
| 3 | Выбрать услугу | Форма заказа открыта |
| 7 | Сценарий: Превышен лимит | Ошибка: превышен максимум/минимум |

**Ожидаемый результат:** Ошибка: превышен максимум/минимум

### TC-0113: [SUPPORT] Заказы: create - Edge: Минимальное количество

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'quantity': 'min'} | Данные готовы |
| 2 | Выполнить: create | Заказ создаётся |

**Ожидаемый результат:** Заказ создаётся

### TC-0114: [SUPPORT] Заказы: create - Edge: Максимальное количество

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'quantity': 'max'} | Данные готовы |
| 2 | Выполнить: create | Заказ создаётся |

**Ожидаемый результат:** Заказ создаётся

### TC-0115: [SUPPORT] Заказы: create - Edge: Граничное (min-1)

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'quantity': 'min-1'} | Данные готовы |
| 2 | Выполнить: create | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0116: [SUPPORT] Заказы: create - Edge: Unicode в ссылке

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {'link': 'https://x.com/пользователь'} | Данные готовы |
| 2 | Выполнить: create | Корректная обработка |

**Ожидаемый результат:** Корректная обработка

### TC-0117: [SUPPORT] Заказы: cancel - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Открыть активный заказ | Страница заказа открыта |
| 3 | Нажать 'Отменить' | Заказ отменён, частичный возврат |

**Ожидаемый результат:** Успешное выполнение: cancel

### TC-0118: [SUPPORT] Заказы: cancel - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: cancel | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0119: [SUPPORT] Заказы: repeat - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: repeat | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: repeat

### TC-0120: [SUPPORT] Заказы: repeat - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: repeat | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0121: [SUPPORT] Заказы: list - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Мои заказы' | Список заказов загружен |

**Ожидаемый результат:** Успешное выполнение: list

### TC-0122: [SUPPORT] Заказы: list - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: list | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0123: [SUPPORT] Заказы: view - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: view | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: view

### TC-0124: [SUPPORT] Заказы: view - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** orders

**Предусловия:**
- Пользователь авторизован
- Баланс > 0

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: view | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0125: [USER] Финансы: deposit - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Баланс' | Страница баланса открыта |
| 3 | Нажать 'Пополнить' | Форма пополнения открыта |
| 4 | Выбрать способ оплаты | Способ выбран |
| 5 | Ввести сумму | Сумма валидна |
| 6 | Оплатить | Редирект на платёжный шлюз |
| 7 | Завершить оплату | Баланс пополнен |

**Ожидаемый результат:** Успешное выполнение: deposit

### TC-0126: [USER] Финансы: deposit - Платёж отклонён

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Баланс' | Страница баланса открыта |
| 3 | Нажать 'Пополнить' | Форма пополнения открыта |
| 8 | Сценарий: Платёж отклонён | Ошибка оплаты, попробуйте другой способ |

**Ожидаемый результат:** Ошибка оплаты, попробуйте другой способ

### TC-0127: [USER] Финансы: deposit - Сумма ниже минимума

- **Тип:** error_path
- **Приоритет:** P2
- **Роль:** USER
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Баланс' | Страница баланса открыта |
| 3 | Нажать 'Пополнить' | Форма пополнения открыта |
| 8 | Сценарий: Сумма ниже минимума | Ошибка: минимальная сумма X |

**Ожидаемый результат:** Ошибка: минимальная сумма X

### TC-0128: [USER] Финансы: deposit - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: deposit | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0129: [USER] Финансы: withdraw - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: withdraw | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: withdraw

### TC-0130: [USER] Финансы: withdraw - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: withdraw | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0131: [USER] Финансы: history - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: history | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: history

### TC-0132: [USER] Финансы: history - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: history | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0133: [USER] Финансы: convert - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: convert | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: convert

### TC-0134: [USER] Финансы: convert - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: convert | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0135: [ADMIN] Финансы: deposit - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Баланс' | Страница баланса открыта |
| 3 | Нажать 'Пополнить' | Форма пополнения открыта |
| 4 | Выбрать способ оплаты | Способ выбран |
| 5 | Ввести сумму | Сумма валидна |
| 6 | Оплатить | Редирект на платёжный шлюз |
| 7 | Завершить оплату | Баланс пополнен |

**Ожидаемый результат:** Успешное выполнение: deposit

### TC-0136: [ADMIN] Финансы: deposit - Платёж отклонён

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Баланс' | Страница баланса открыта |
| 3 | Нажать 'Пополнить' | Форма пополнения открыта |
| 8 | Сценарий: Платёж отклонён | Ошибка оплаты, попробуйте другой способ |

**Ожидаемый результат:** Ошибка оплаты, попробуйте другой способ

### TC-0137: [ADMIN] Финансы: deposit - Сумма ниже минимума

- **Тип:** error_path
- **Приоритет:** P2
- **Роль:** ADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Баланс' | Страница баланса открыта |
| 3 | Нажать 'Пополнить' | Форма пополнения открыта |
| 8 | Сценарий: Сумма ниже минимума | Ошибка: минимальная сумма X |

**Ожидаемый результат:** Ошибка: минимальная сумма X

### TC-0138: [ADMIN] Финансы: deposit - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: deposit | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0139: [ADMIN] Финансы: withdraw - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: withdraw | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: withdraw

### TC-0140: [ADMIN] Финансы: withdraw - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: withdraw | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0141: [ADMIN] Финансы: history - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: history | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: history

### TC-0142: [ADMIN] Финансы: history - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: history | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0143: [ADMIN] Финансы: convert - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: convert | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: convert

### TC-0144: [ADMIN] Финансы: convert - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: convert | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0145: [SUPERADMIN] Финансы: deposit - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Баланс' | Страница баланса открыта |
| 3 | Нажать 'Пополнить' | Форма пополнения открыта |
| 4 | Выбрать способ оплаты | Способ выбран |
| 5 | Ввести сумму | Сумма валидна |
| 6 | Оплатить | Редирект на платёжный шлюз |
| 7 | Завершить оплату | Баланс пополнен |

**Ожидаемый результат:** Успешное выполнение: deposit

### TC-0146: [SUPERADMIN] Финансы: deposit - Платёж отклонён

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Баланс' | Страница баланса открыта |
| 3 | Нажать 'Пополнить' | Форма пополнения открыта |
| 8 | Сценарий: Платёж отклонён | Ошибка оплаты, попробуйте другой способ |

**Ожидаемый результат:** Ошибка оплаты, попробуйте другой способ

### TC-0147: [SUPERADMIN] Финансы: deposit - Сумма ниже минимума

- **Тип:** error_path
- **Приоритет:** P2
- **Роль:** SUPERADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Баланс' | Страница баланса открыта |
| 3 | Нажать 'Пополнить' | Форма пополнения открыта |
| 8 | Сценарий: Сумма ниже минимума | Ошибка: минимальная сумма X |

**Ожидаемый результат:** Ошибка: минимальная сумма X

### TC-0148: [SUPERADMIN] Финансы: deposit - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: deposit | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0149: [SUPERADMIN] Финансы: withdraw - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: withdraw | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: withdraw

### TC-0150: [SUPERADMIN] Финансы: withdraw - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: withdraw | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0151: [SUPERADMIN] Финансы: history - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: history | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: history

### TC-0152: [SUPERADMIN] Финансы: history - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: history | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0153: [SUPERADMIN] Финансы: convert - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: convert | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: convert

### TC-0154: [SUPERADMIN] Финансы: convert - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: convert | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0155: [SUPPORT] Финансы: deposit - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Баланс' | Страница баланса открыта |
| 3 | Нажать 'Пополнить' | Форма пополнения открыта |
| 4 | Выбрать способ оплаты | Способ выбран |
| 5 | Ввести сумму | Сумма валидна |
| 6 | Оплатить | Редирект на платёжный шлюз |
| 7 | Завершить оплату | Баланс пополнен |

**Ожидаемый результат:** Успешное выполнение: deposit

### TC-0156: [SUPPORT] Финансы: deposit - Платёж отклонён

- **Тип:** error_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Баланс' | Страница баланса открыта |
| 3 | Нажать 'Пополнить' | Форма пополнения открыта |
| 8 | Сценарий: Платёж отклонён | Ошибка оплаты, попробуйте другой способ |

**Ожидаемый результат:** Ошибка оплаты, попробуйте другой способ

### TC-0157: [SUPPORT] Финансы: deposit - Сумма ниже минимума

- **Тип:** error_path
- **Приоритет:** P2
- **Роль:** SUPPORT
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Авторизоваться в системе | Успешная авторизация |
| 2 | Перейти в 'Баланс' | Страница баланса открыта |
| 3 | Нажать 'Пополнить' | Форма пополнения открыта |
| 8 | Сценарий: Сумма ниже минимума | Ошибка: минимальная сумма X |

**Ожидаемый результат:** Ошибка: минимальная сумма X

### TC-0158: [SUPPORT] Финансы: deposit - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: deposit | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0159: [SUPPORT] Финансы: withdraw - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: withdraw | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: withdraw

### TC-0160: [SUPPORT] Финансы: withdraw - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: withdraw | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0161: [SUPPORT] Финансы: history - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: history | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: history

### TC-0162: [SUPPORT] Финансы: history - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: history | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0163: [SUPPORT] Финансы: convert - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: convert | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: convert

### TC-0164: [SUPPORT] Финансы: convert - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** finance

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: convert | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0165: [USER] Услуги: list - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: list | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: list

### TC-0166: [USER] Услуги: list - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: list | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0167: [USER] Услуги: view - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: view | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: view

### TC-0168: [USER] Услуги: view - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: view | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0169: [USER] Услуги: create - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: create | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: create

### TC-0170: [USER] Услуги: create - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: create | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0171: [USER] Услуги: update - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: update | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: update

### TC-0172: [USER] Услуги: update - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: update | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0173: [USER] Услуги: delete - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: delete | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: delete

### TC-0174: [USER] Услуги: delete - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: delete | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0175: [ADMIN] Услуги: list - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: list | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: list

### TC-0176: [ADMIN] Услуги: list - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: list | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0177: [ADMIN] Услуги: view - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: view | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: view

### TC-0178: [ADMIN] Услуги: view - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: view | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0179: [ADMIN] Услуги: create - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: create | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: create

### TC-0180: [ADMIN] Услуги: create - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: create | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0181: [ADMIN] Услуги: update - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: update | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: update

### TC-0182: [ADMIN] Услуги: update - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: update | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0183: [ADMIN] Услуги: delete - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: delete | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: delete

### TC-0184: [ADMIN] Услуги: delete - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: delete | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0185: [SUPERADMIN] Услуги: list - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: list | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: list

### TC-0186: [SUPERADMIN] Услуги: list - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: list | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0187: [SUPERADMIN] Услуги: view - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: view | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: view

### TC-0188: [SUPERADMIN] Услуги: view - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: view | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0189: [SUPERADMIN] Услуги: create - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: create | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: create

### TC-0190: [SUPERADMIN] Услуги: create - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: create | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0191: [SUPERADMIN] Услуги: update - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: update | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: update

### TC-0192: [SUPERADMIN] Услуги: update - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: update | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0193: [SUPERADMIN] Услуги: delete - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: delete | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: delete

### TC-0194: [SUPERADMIN] Услуги: delete - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: delete | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0195: [SUPPORT] Услуги: list - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: list | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: list

### TC-0196: [SUPPORT] Услуги: list - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: list | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0197: [SUPPORT] Услуги: view - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: view | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: view

### TC-0198: [SUPPORT] Услуги: view - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: view | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0199: [SUPPORT] Услуги: create - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: create | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: create

### TC-0200: [SUPPORT] Услуги: create - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: create | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0201: [SUPPORT] Услуги: update - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: update | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: update

### TC-0202: [SUPPORT] Услуги: update - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: update | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0203: [SUPPORT] Услуги: delete - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: delete | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: delete

### TC-0204: [SUPPORT] Услуги: delete - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** services

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: delete | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0205: [USER] Лояльность: referral_link - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: referral_link | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: referral_link

### TC-0206: [USER] Лояльность: referral_link - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: referral_link | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0207: [USER] Лояльность: referrals - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: referrals | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: referrals

### TC-0208: [USER] Лояльность: referrals - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: referrals | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0209: [USER] Лояльность: achievements - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: achievements | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: achievements

### TC-0210: [USER] Лояльность: achievements - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: achievements | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0211: [USER] Лояльность: bonus - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: bonus | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: bonus

### TC-0212: [USER] Лояльность: bonus - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: bonus | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0213: [ADMIN] Лояльность: referral_link - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: referral_link | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: referral_link

### TC-0214: [ADMIN] Лояльность: referral_link - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: referral_link | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0215: [ADMIN] Лояльность: referrals - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: referrals | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: referrals

### TC-0216: [ADMIN] Лояльность: referrals - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: referrals | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0217: [ADMIN] Лояльность: achievements - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: achievements | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: achievements

### TC-0218: [ADMIN] Лояльность: achievements - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: achievements | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0219: [ADMIN] Лояльность: bonus - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: bonus | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: bonus

### TC-0220: [ADMIN] Лояльность: bonus - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: bonus | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0221: [SUPERADMIN] Лояльность: referral_link - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: referral_link | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: referral_link

### TC-0222: [SUPERADMIN] Лояльность: referral_link - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: referral_link | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0223: [SUPERADMIN] Лояльность: referrals - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: referrals | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: referrals

### TC-0224: [SUPERADMIN] Лояльность: referrals - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: referrals | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0225: [SUPERADMIN] Лояльность: achievements - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: achievements | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: achievements

### TC-0226: [SUPERADMIN] Лояльность: achievements - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: achievements | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0227: [SUPERADMIN] Лояльность: bonus - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: bonus | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: bonus

### TC-0228: [SUPERADMIN] Лояльность: bonus - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: bonus | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0229: [SUPPORT] Лояльность: referral_link - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: referral_link | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: referral_link

### TC-0230: [SUPPORT] Лояльность: referral_link - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: referral_link | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0231: [SUPPORT] Лояльность: referrals - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: referrals | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: referrals

### TC-0232: [SUPPORT] Лояльность: referrals - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: referrals | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0233: [SUPPORT] Лояльность: achievements - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: achievements | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: achievements

### TC-0234: [SUPPORT] Лояльность: achievements - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: achievements | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0235: [SUPPORT] Лояльность: bonus - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: bonus | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: bonus

### TC-0236: [SUPPORT] Лояльность: bonus - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** loyalty

**Предусловия:**
- Пользователь авторизован

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: bonus | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0237: [USER] Админ-панель: users - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль USER
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: users | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: users

### TC-0238: [USER] Админ-панель: users - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль USER
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: users | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0239: [USER] Админ-панель: orders - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль USER
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: orders | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: orders

### TC-0240: [USER] Админ-панель: orders - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль USER
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: orders | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0241: [USER] Админ-панель: services - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль USER
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: services | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: services

### TC-0242: [USER] Админ-панель: services - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль USER
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: services | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0243: [USER] Админ-панель: finance - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль USER
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: finance | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: finance

### TC-0244: [USER] Админ-панель: finance - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль USER
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: finance | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0245: [USER] Админ-панель: settings - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** USER
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль USER
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: settings | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: settings

### TC-0246: [USER] Админ-панель: settings - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** USER
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль USER
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: settings | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0247: [ADMIN] Админ-панель: users - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль ADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: users | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: users

### TC-0248: [ADMIN] Админ-панель: users - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль ADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: users | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0249: [ADMIN] Админ-панель: orders - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль ADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: orders | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: orders

### TC-0250: [ADMIN] Админ-панель: orders - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль ADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: orders | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0251: [ADMIN] Админ-панель: services - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль ADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: services | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: services

### TC-0252: [ADMIN] Админ-панель: services - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль ADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: services | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0253: [ADMIN] Админ-панель: finance - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль ADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: finance | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: finance

### TC-0254: [ADMIN] Админ-панель: finance - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль ADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: finance | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0255: [ADMIN] Админ-панель: settings - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** ADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль ADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: settings | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: settings

### TC-0256: [ADMIN] Админ-панель: settings - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** ADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль ADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: settings | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0257: [SUPERADMIN] Админ-панель: users - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPERADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: users | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: users

### TC-0258: [SUPERADMIN] Админ-панель: users - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPERADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: users | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0259: [SUPERADMIN] Админ-панель: orders - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPERADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: orders | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: orders

### TC-0260: [SUPERADMIN] Админ-панель: orders - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPERADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: orders | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0261: [SUPERADMIN] Админ-панель: services - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPERADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: services | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: services

### TC-0262: [SUPERADMIN] Админ-панель: services - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPERADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: services | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0263: [SUPERADMIN] Админ-панель: finance - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPERADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: finance | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: finance

### TC-0264: [SUPERADMIN] Админ-панель: finance - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPERADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: finance | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0265: [SUPERADMIN] Админ-панель: settings - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPERADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPERADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: settings | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: settings

### TC-0266: [SUPERADMIN] Админ-панель: settings - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPERADMIN
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPERADMIN
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: settings | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0267: [SUPPORT] Админ-панель: users - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPPORT
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: users | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: users

### TC-0268: [SUPPORT] Админ-панель: users - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPPORT
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: users | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0269: [SUPPORT] Админ-панель: orders - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPPORT
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: orders | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: orders

### TC-0270: [SUPPORT] Админ-панель: orders - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPPORT
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: orders | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0271: [SUPPORT] Админ-панель: services - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPPORT
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: services | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: services

### TC-0272: [SUPPORT] Админ-панель: services - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPPORT
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: services | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0273: [SUPPORT] Админ-панель: finance - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPPORT
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: finance | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: finance

### TC-0274: [SUPPORT] Админ-панель: finance - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPPORT
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: finance | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации

### TC-0275: [SUPPORT] Админ-панель: settings - Happy Path

- **Тип:** happy_path
- **Приоритет:** P1
- **Роль:** SUPPORT
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPPORT
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Выполнить: settings | Успешное выполнение |

**Ожидаемый результат:** Успешное выполнение: settings

### TC-0276: [SUPPORT] Админ-панель: settings - Edge: Пустые данные

- **Тип:** edge_case
- **Приоритет:** P3
- **Роль:** SUPPORT
- **Модуль:** admin

**Предусловия:**
- Пользователь имеет роль SUPPORT
- Назначен на проект

**Шаги:**

| Шаг | Действие | Ожидаемый результат |
|---|---|---|
| 1 | Подготовить данные: {} | Данные готовы |
| 2 | Выполнить: settings | Ошибка валидации |

**Ожидаемый результат:** Ошибка валидации
