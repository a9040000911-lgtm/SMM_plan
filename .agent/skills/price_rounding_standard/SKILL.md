# Smmplan Price Formatting & Rounding Standards

## Problem Description
SMM services often have extremely low prices per unit (e.g., 0.001 RUB for 1 view). Standard rounding to 2 decimal places often results in "0.00" being displayed, which is incorrect and confusing for users.

## The Smmplan Rounding Algorithm

To ensure transparency and avoid "0.00" prices, use the following rules:

### 1. Direction
Always round **UP** (Math.ceil equivalent) to ensure the platform never operates at a loss due to micro-rounding.

### 2. Precision
- **Micro-prices (Price < 1.0 RUB)**: Show **3 decimal places**.
  - Example: `0.0042` -> `0.005`
  - Example: `0.0001` -> `0.001`
- **Standard prices (Price >= 1.0 RUB)**: Show **2 decimal places**.
  - Example: `1.451` -> `1.46`
  - Example: `5.0` -> `5.00`

## Implementation Guide (Utility)

Use this logic in both Frontend (React) and Backend (Calculations):

```typescript
export function formatSmmPrice(price: number): string {
    const direction = 1; // Round up
    
    if (price < 1) {
        // Round UP to 3 decimal places
        const rounded = Math.ceil(price * 1000) / 1000;
        return rounded.toLocaleString('ru-RU', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 3 
        });
    } else {
        // Round UP to 2 decimal places
        const rounded = Math.ceil(price * 100) / 100;
        return rounded.toLocaleString('ru-RU', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }
}
```

## Guardrails
- NEVER use `.toFixed(2)` for unit prices without checking if they are micro-prices.
- ALWAYS use `toLocaleString('ru-RU')` for the final output to maintain the correct decimal separator (comma for Russian).
