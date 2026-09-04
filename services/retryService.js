function isRetryable(error) {
  const status = error?.status || error?.code;
  return status === 429 || (status >= 500 && status < 600);
}

function retryDelay(error, attempt) {
  const seconds = String(error?.message || "").match(/retryDelay.*?(\d+)s/i);
  return Math.min(seconds ? Number(seconds[1]) * 1000 : 1000 * 2 ** attempt, 30000);
}

export async function withRetry(operation, { attempts = 3 } = {}) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryable(error) || attempt === attempts - 1) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelay(error, attempt)));
    }
  }

  throw lastError;
}
