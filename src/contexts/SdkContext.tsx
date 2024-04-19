import { useState, createContext, useContext } from "react";

interface ISdkContext {
  getAccount(): any;
  setAccount(account: any): any;
}

const SdkContext = createContext({} as ISdkContext);

interface Props {
  children: React.ReactNode;
}

const SdkProvider: React.FC<Props> = ({ children }) => {
  const [acc, setAcc] = useState<any>(null);

  const values: ISdkContext = {
    getAccount: () => acc,
    setAccount: (account) => setAcc(account),
  };

  return <SdkContext.Provider value={values}>{children}</SdkContext.Provider>;
};

const useSdk = () => useContext(SdkContext);

export { SdkContext, SdkProvider, useSdk };
