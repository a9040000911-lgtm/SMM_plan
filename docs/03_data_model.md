# Модель данных

## Сущности

### User
- id
- email
- password_hash
- balance (Decimal)
- role (ADMIN, USER, RESELLER)
- created_at

### Service
- id (Local ID)
- external_id (ID в VexBoost)
- name
- category
- network
- provider_rate (Цена за 1000 от провайдера)
- sale_rate (Цена для клиента с наценкой)
- min_quantity
- max_quantity
- is_active
- description

### Order
- id
- user_id
- service_id
- external_order_id (ID в VexBoost)
- link (Ссылка на объект накрутки)
- quantity
- charge (Списанная сумма)
- status (Pending, Completed, etc.)
- remains (Сколько осталось докрутить)
- created_at

### Transaction
- id
- user_id
- amount
- type (DEPOSIT, ORDER_PAYMENT, REFUND)
- status
- created_at
