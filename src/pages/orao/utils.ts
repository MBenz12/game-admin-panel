import { PublicKey } from "@solana/web3.js";
import idl from "idl/orao.json";

export const getPlayerStateAddress = async (
    player: PublicKey,
    programId: PublicKey = new PublicKey(idl.metadata.address)
) => {
    return await PublicKey.findProgramAddress(
        [
            Buffer.from("orao-test"),
            player.toBuffer(),
        ],
        programId
    );
}