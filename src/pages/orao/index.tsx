import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { RPC_DEVNET, RPC_MAINNET } from "config/constants";
import { useEffect, useMemo, useState } from "react";
import idl from "idl/orao.json";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Provider, BN, Program, Wallet } from "@project-serum/anchor";
import { IDL, Orao as OraoIdl } from "idl/orao";
import StorageSelect from "components/SotrageSelect";
import Header from "components/Header";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { isAdmin } from "config/utils";
import { toast } from "react-toastify";
import {
  Orao,
  networkStateAccountAddress,
  randomnessAccountAddress,
  FulfillBuilder,
  InitBuilder,
} from "@orao-network/solana-vrf";
import { getPlayerStateAddress } from "./utils";
import nacl from "tweetnacl";
import bs58 from "bs58";

const deafultProgramIDs = [idl.metadata.address];

export default function OraoPage() {
  const [network, setNetwork] = useState(WalletAdapterNetwork.Devnet);
  const connection = useMemo(() => new Connection(network === "mainnet-beta" ? RPC_MAINNET : RPC_DEVNET, "confirmed"), [network]);
  const [programID, setProgramID] = useState(idl.metadata.address);
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet() as Wallet;
  // console.log(bs58.encode(Keypair.generate().secretKey));
  const fulfillmentAuthority = Keypair.fromSecretKey(bs58.decode("4UWHeXfVHVn63TMT9jC56PZZ1iJSv91qn4usK7oCQePv2vas2NhfsKT2WSraK5YEvrkYxYmzArZcKXCtjC9WdXN4"));
  const [provider, setProvider] = useState<AnchorProvider | null>();
  const [program, setProgram] = useState<Program<OraoIdl> | null>();
  const [vrf, setVrf] = useState<Orao | null>();
  const [treasury, setTreasury] = useState<PublicKey | null>();
  useEffect(() => {
    if (!wallet.publicKey) return;

    const provider = new AnchorProvider(connection, anchorWallet, AnchorProvider.defaultOptions());
    setProvider(provider);
    const program = new Program(IDL, programID, provider) as Program<OraoIdl>;
    setProgram(program);
    console.log({ ...provider, publicKey: provider.wallet.publicKey });
    const vrf = new Orao({ ...provider, publicKey: provider.wallet.publicKey });

    setVrf(vrf);
    setTreasury(provider.wallet.publicKey);
  }, [wallet.publicKey, network, programID]);


  async function fetchData() {
    if (!provider || !program) return;
    try {
      const [playerState] = await getPlayerStateAddress(provider.wallet.publicKey);
      const playerStateAcc = await program.account.playerState.fetchNullable(playerState);
      console.log(playerStateAcc);
    } catch (error) {
      console.log(error);
      toast.error('Failed');
    }
  }

  // This helper will play a single round of russian-roulette.
  async function spinAndPullTheTrigger(prevForce: Buffer, force: Buffer) {
    if (!provider || !program || !vrf || !treasury) return;

    const prevRound = randomnessAccountAddress(prevForce);
    const random = randomnessAccountAddress(force);
    const [playerState] = await getPlayerStateAddress(provider.wallet.publicKey);

    const transaction = new Transaction().add(
      // @ts-ignore
      await program.transaction.spinAndPullTheTrigger([...force], {
        accounts: {
          player: provider.wallet.publicKey,
          playerState,
          prevRound,
          vrf: vrf.programId,
          config: networkStateAccountAddress(),
          treasury,
          random,
          systemProgram: SystemProgram.programId,
        }
      })
    );
    const txSignature = await wallet.sendTransaction(transaction, provider.connection, { skipPreflight: true });
    await provider.connection.confirmTransaction(txSignature, "confirmed");
    console.log(txSignature);
  }

  // This helper will fulfill randomness for our test VRF.
  async function emulateFulfill(seed: Buffer, vrf: Orao) {
    let signature = nacl.sign.detached(
      seed,
      fulfillmentAuthority.secretKey
    );
    await new FulfillBuilder(vrf, seed).rpc(
      fulfillmentAuthority.publicKey,
      signature
    );
  }

  const initializeVrf = async () => {
    if (!vrf || !treasury) return;

    // Initialize test VRF
    const fee = 2 * LAMPORTS_PER_SOL;
    const fulfillmentAuthorities = [fulfillmentAuthority.publicKey];
    const configAuthority = Keypair.generate();
    console.log(bs58.encode(configAuthority.secretKey));
    new InitBuilder(
      vrf,
      configAuthority.publicKey,
      treasury,
      fulfillmentAuthorities,
      new BN(fee)
    ).rpc();
  }

  async function play() {
    if (!provider || !program) return;
    try {
      const [playerState] = await getPlayerStateAddress(provider.wallet.publicKey);
      let force = Keypair.generate().publicKey;

      await spinAndPullTheTrigger(Buffer.alloc(32), force.toBuffer());

      const playerStateAcc = await program.account.playerState.fetch(
        playerState
      );

      console.log(playerStateAcc);
    } catch (error) {
      console.log(error);
      toast.error('Failed');
    }
  }

  useEffect(() => {
    fetchData();
  }, [wallet.connected, network, programID]);

  if (!wallet.connected || (wallet.publicKey && !isAdmin(wallet.publicKey))) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <div className="relative">
        <Header />
        <div className="absolute right-5 top-2">
          <WalletMultiButton />
        </div>
      </div>
    );
  }
  return (
    <div className="text-black relative flex gap-2 flex-col ">
      <Header />
      <div className="absolute right-5 top-2">
        <WalletMultiButton />
      </div>
      <div className="absolute left-5 top-4 text-white">
        NETWORK:
        <select
          className="border-2 border-black p-2"
          onChange={(e) => {
            setNetwork(e.target.value as WalletAdapterNetwork);
            localStorage.setItem("network", e.target.value);
          }}
          value={network}
        >
          <option value={WalletAdapterNetwork.Mainnet}>Mainnet</option>
          <option value={WalletAdapterNetwork.Devnet}>Devnet</option>
        </select>
      </div>
      <div className="ml-5 flex gap-2 flex-col ">
        <StorageSelect itemkey={"auction-programId"} label="Program ID" setItem={setProgramID} defaultItems={deafultProgramIDs} defaultItem={programID} />
      </div>

      <div className="flex gap-2">
        <button className="border-2 border-black p-2" onClick={initializeVrf}>
          Init VRF
        </button>
        <button className="border-2 border-black p-2" onClick={play}>
          Play
        </button>
      </div>
    </div>
  );
}