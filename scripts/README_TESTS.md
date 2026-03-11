# Testing Documentation

This project uses **Jest** for testing.

## Test Coverage

We have achieved **100% logic coverage** for the core utilities and services.

- **`src/utils/analyzer.ts`**: Link parsing logic for Telegram, Instagram, VK, TikTok, and YouTube.
- **`src/services/provider.service.ts`**: API integration with VexBoost, including error handling and data syncing.
- **`src/bot/bot.test.ts`**: Integration tests simulating the user flow (Link -> Analysis -> Database -> Calculation).

## Running Tests

To run all tests:
```bash
npm test
```

To run tests with a coverage report:
```bash
npx jest --coverage
```

## Note on E2E
Full End-to-End (E2E) tests involving actual Telegram servers are not included as they require external credentials and a running bot instance interacting with real servers. The `src/bot/bot.test.ts` file serves as a logical E2E test, validating the entire data flow from user input to final order calculation without external network dependencies.
