import { web } from "@klever/sdk-web";

const transactionsProcessed = async (
  hashes: string[],
  tries = 10
): Promise<any[]> => {
  const processedRequest: Promise<any>[] = hashes.map(async (hash) => {
    const array = Array.from({ length: tries }, (_, i) => i);
    let error = "";

    for (const i of array) {
      const result = await fetch(
        `${web.getProvider().api}/transaction/${hash}?withResults=true`
      );

      const data = await result.json();

      if (data && !data.error) {
        return data.data;
      } else if (data.error) {
        error = data;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw error;
  });

  return await Promise.all(processedRequest);
};

export { transactionsProcessed };
