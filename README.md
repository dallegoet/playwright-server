# Run with Docker

## Run the server without security

```bash
docker run --env-file .env.local  -p 3000:3000 dallegoet/playwright-server
```

## Securize websocket connection using an access token

Create a `.env.local` file with the following content:

```bash
ACCESS_TOKEN=your_access_token
```

Then run the following command:

```bash
docker run --env-file .env.local -p 3000:3000 dallegoet/playwright-server
```

# Connect from a playwright client

```typescript
const browser = await playwright.chromium.connect("ws://localhost:3000", {
  headers: {
    authorization: "Bearer your_access_token",
  },
  slowMo: 400,
});

const page = await browser.newPage();

await page.goto("https://playwright.dev/");
await page.waitForTimeout(2000);
await page.screenshot({ path: "example.png" });
await page.close();
await browser.close();
```
