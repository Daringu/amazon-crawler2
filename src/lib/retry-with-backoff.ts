export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 25,
  delay = 1000,
  factor = 2,
): Promise<T> => {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (
        (error as { response: { status: number } }).response?.status === 429
      ) {
        attempt++;
        if (attempt > maxRetries) {
          throw new Error("Max retries reached for rate-limited request");
        }

        const backoffTime = delay * Math.pow(factor, attempt - 1);
        console.warn(`Rate limit hit. Retrying in ${backoffTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      } else {
        console.log(error);
        throw error;
      }
    }
  }

  throw new Error("Unexpected error in retry logic");
};
