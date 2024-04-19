import { IProvider } from "@klever/sdk-web";

declare global {
  interface Window {
    kleverWeb: {
      provider: IProvider;
      initialize: () => Promise<void>;
      getWalletAddress: () => string;
      getBalance: () => Promise<number>;
    };
  }
}
