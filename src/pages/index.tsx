import { BackgroundBeams } from "@/components/ui/background-beams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSdk } from "@/contexts/SdkContext";
import { Dice6, Loader2, WalletMinimal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  web,
  abiDecoder,
  abiEncoder,
  TransactionType,
  ISmartContract,
} from "@klever/sdk-web";
import { useToast } from "@/components/ui/use-toast";
import {
  betTypeToNumber,
  cn,
  convertBetToJSON,
  formatAddress,
} from "@/lib/utils";
import Image from "next/image";
import { abi } from "@/lib/abi";
import { FormattedBet, RawBet } from "@/@types/bet";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Counter from "@/components/counter";
import { transactionsProcessed } from "@/lib/tx-processor";

const MIN_PREDICTION_UNDER_VALUE = 1,
  MAX_PREDICTION_UNDER_VALUE = 94,
  MIN_PREDICTION_OVER_VALUE = 5,
  MAX_PREDICTION_OVER_VALUE = 98;

const nodeUrl = process.env.NEXT_PUBLIC_NODE_URL,
  proxyUrl = process.env.NEXT_PUBLIC_PROXY_URL,
  scAddress = process.env.NEXT_PUBLIC_SC_ADDRESS;

export default function Home() {
  const { toast } = useToast();

  const [bet, setBet] = useState<FormattedBet>();
  const [loading, setLoading] = useState(false);
  const [betting, setBetting] = useState(false);
  const [betType, setBetType] = useState<"over" | "under">("over");
  const [prediction, setPrediction] = useState(50);
  const [value, setValue] = useState(0);
  const [limits, setLimits] = useState([
    MIN_PREDICTION_OVER_VALUE,
    MAX_PREDICTION_OVER_VALUE,
  ]);
  const [min, max] = limits;

  const isUnder = min === MIN_PREDICTION_UNDER_VALUE;

  const sdk = useSdk();
  const address = sdk.getAccount();

  const [balance, setBalance] = useState(0);

  const connectWallet = async () => {
    setLoading(true);

    try {
      if (typeof window === "undefined" || !window.kleverWeb) {
        throw Error("Klever Extension not found");
      }

      await window.kleverWeb.initialize();
      const addr = window.kleverWeb.getWalletAddress();
      if (!addr) {
        throw Error("Cannot retrieve wallet address");
      }

      if (nodeUrl && proxyUrl) {
        web.setProvider({
          node: nodeUrl,
          api: proxyUrl,
        });
      } else {
        web.setProvider(window.kleverWeb.provider);
      }

      const balance = await window.kleverWeb.getBalance();
      setBalance(balance);

      sdk.setAccount(addr);
      toast({
        title: "Connected",
        duration: 3000,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast({
        title: "Error",
        description: errorMessage,
        duration: 3000,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!address) return;

    const data = getLastResults(address);
    setBet(data);
  }, [address]);

  function handleTabChange(value: string) {
    if (value === "over") {
      setBetType("over");
      setLimits([MIN_PREDICTION_OVER_VALUE, MAX_PREDICTION_OVER_VALUE]);
    }

    if (value === "under") {
      setBetType("under");
      setLimits([MIN_PREDICTION_UNDER_VALUE, MAX_PREDICTION_UNDER_VALUE]);
    }
  }

  const handleSliderChange = useCallback(
    (prediction: number) => {
      switch (true) {
        case prediction < min:
          setPrediction(min);
          break;
        case prediction > max:
          setPrediction(max);
          break;
        default:
          setPrediction(prediction);
      }
    },
    [min, max]
  );

  useEffect(() => {
    handleSliderChange(prediction);
  }, [handleSliderChange, prediction, betType]);

  async function handleBet() {
    if (!address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        duration: 3000,
        variant: "destructive",
      });
      return;
    }

    if (!value) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        duration: 3000,
        variant: "destructive",
      });
      return;
    }

    const betTypeParsed = betTypeToNumber(betType);

    try {
      setBetting(true);
      const broadcastedTx = await sendBet(betTypeParsed, prediction, value);

      const data = await getReturnData(broadcastedTx.data.txsHashes);
      setBet(data);
      localStorage.setItem(`lastBet@${address}`, JSON.stringify(data));
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast({
        title: "Error",
        description: errorMessage,
        duration: 3000,
        variant: "destructive",
      });
    } finally {
      setBetting(false);
    }
  }

  return (
    <div className="bg-gray-700 min-h-screen pb-20">
      <nav className="relative z-10 min-w-full flex items-center justify-end p-4 bg-gray-800 text-primary-foreground">
        {address ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-indigo-600 p-2 rounded-lg font-medium">
              <Image src="/klv.webp" alt="Klever" width={24} height={24} />
              <span>KLV {balance}</span>
            </div>

            <p className="font-medium text-primary-foreground antialiased">
              {formatAddress(address)}
            </p>
          </div>
        ) : (
          <Button onClick={connectWallet} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 animate-spin" />
            ) : (
              <WalletMinimal className="mr-2" />
            )}
            Connect Wallet
          </Button>
        )}
      </nav>
      <main className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 px-2 md:px-6 mt-4">
        <div className="col-span-1 md:col-span-2 text-center">
          <h1 className="inline-flex items-center text-4xl font-extrabold text-white">
            <Dice6 className="mr-2" width={32} height={32} /> Dice
          </h1>
        </div>

        <div className="flex flex-col gap-4 items-center justify-between bg-gray-800 p-4 rounded-lg">
          <Tabs
            defaultValue={betType}
            className="w-full"
            onValueChange={handleTabChange}
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-700">
              <TabsTrigger value="over">Roll over</TabsTrigger>
              <TabsTrigger value="under">Roll under</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input
            className="bg-gray-700"
            placeholder="0.00"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
          <Button className="w-full" onClick={handleBet}>
            Roll
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="grid w-full grid-cols-2">
            <div className="flex px-4 py-8 items-center justify-center bg-gray-800 rounded-tl-lg text-primary-foreground text-4xl md:text-6xl font-bold border-2 border-r-0 border-indigo-500">
              {prediction > 9 ? prediction : `0${prediction}`}
            </div>
            <div className="flex px-4 py-8 items-center justify-center bg-gray-800 rounded-tr-lg text-primary-foreground text-4xl md:text-6xl font-bold border-2 border-indigo-500">
              <Counter loading={betting} value={bet?.diceValue || 0o0} />
            </div>
            <div className="flex p-2 text-sm items-center justify-center bg-gray-800 rounded-bl-lg text-primary-foreground font-semibold border-2 border-r-0 border-t-0 border-indigo-500">
              <span>PREDICTION</span>
            </div>
            <div className="flex p-2 text-sm items-center justify-center bg-gray-800 rounded-br-lg text-primary-foreground font-semibold border-2 border-t-0 border-indigo-500">
              <span>LUCKY NUMBER</span>
            </div>
          </div>
          <Slider
            className="w-full mt-4"
            min={0}
            max={100}
            step={1}
            isUnder={isUnder}
            defaultValue={[prediction]}
            value={[prediction]}
            onValueChange={([value]) => handleSliderChange(value)}
          />

          <div className="mt-1.5 flex justify-between w-full">
            {Array.from({ length: 4 + 1 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "text-sm font-light",
                  i > 0 && i < 4 && "text-10 opacity-40"
                )}
                role="presentation"
              >
                {i * 25 === 0 ? "00" : i * 25}
              </span>
            ))}
          </div>
        </div>
      </main>

      <section className="relative z-10 mt-20 px-2 md:px-6">
        <p className="text-gray-400 text-center antialiased mb-2">
          Your last bet
        </p>
        <Table>
          <TableHeader className="bg-gray-800">
            <TableRow>
              <TableHead>Tx</TableHead>
              <TableHead>Prediction</TableHead>
              <TableHead>Lucky Number</TableHead>
              <TableHead>Result</TableHead>
              <TableHead className="text-right">Multiplier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {betting ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <Loader2 className="inline animate-spin" />
                </TableCell>
              </TableRow>
            ) : bet ? (
              <TableRow>
                <TableCell>
                  <a
                    href={bet.txHash}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-500 hover:underline cursor-pointer"
                  >
                    View
                  </a>
                </TableCell>
                <TableCell className="font-medium truncate">
                  {bet.betType.toUpperCase()} {bet.betValue}
                </TableCell>
                <TableCell>{bet.diceValue}</TableCell>
                <TableCell>
                  {bet.isWinner ? (
                    <Badge className="bg-green-500">Win</Badge>
                  ) : (
                    <Badge className="bg-red-500">Lose</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {bet.multiplier / 100}x
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No last bet found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
      {/* <BackgroundBeams /> */}
    </div>
  );
}

async function getReturnData(txHashes: string[]): Promise<FormattedBet> {
  let data = await transactionsProcessed(txHashes);
  const transaction = data[0].transaction;

  let rawData;
  for (const tx of transaction.logs.events) {
    if (tx.identifier === "ReturnData") {
      rawData = tx.data[0];
    }
  }

  const decodedData = abiDecoder.decodeList(rawData, "Bet", abi) as RawBet[];
  const parsed = convertBetToJSON(decodedData);

  return {
    ...parsed[0],
    txHash: `https://testnet.kleverscan.org/transaction/${transaction.hash}`,
  };
}

async function sendBet(betType: number, betValue: number, amount: number) {
  const metadata = [
    abiEncoder.encodeABIValue(betType, "i32", false),
    abiEncoder.encodeABIValue(betValue, "u32", false),
  ].join("@");

  const parsedAmount = amount * 1e6;

  const payload: ISmartContract = {
    address: scAddress as string,
    scType: 0,
    callValue: {
      KLV: parsedAmount,
    },
  };

  const txData = Buffer.from("bet" + "@" + metadata, "utf8").toString("base64");

  const unsignedTx = await web.buildTransaction(
    [
      {
        payload,
        type: TransactionType.SmartContract,
      },
    ],
    [txData]
  );

  const signedTx = await web.signTransaction(unsignedTx);

  return web.broadcastTransactions([signedTx]);
}

function getLastResults(address: string) {
  const rawBet = localStorage.getItem(`lastBet@${address}`);

  return rawBet ? JSON.parse(rawBet) : null;
}
