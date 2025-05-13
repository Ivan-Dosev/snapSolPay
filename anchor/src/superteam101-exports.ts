// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Cluster, PublicKey } from "@solana/web3.js";
import Superteam101IDL from "../target/idl/superteam101.json";
import type { Superteam101 } from "../target/types/superteam101";

// Re-export the generated IDL and type
export { Superteam101, Superteam101IDL };

// The programId is imported from the program IDL.
export const SUPERTEAM101_PROGRAM_ID = new PublicKey(Superteam101IDL.address);

// This is a helper function to get the Superteam101 Anchor program.
export function getSuperteam101Program(
  provider: AnchorProvider,
  address?: PublicKey
) {
  return new Program(
    {
      ...Superteam101IDL,
      address: address ? address.toBase58() : Superteam101IDL.address,
    } as Superteam101,
    provider
  );
}

// This is a helper function to get the program ID for the Superteam101 program depending on the cluster.
export function getSuperteam101ProgramId(cluster: Cluster) {
  switch (cluster) {
    case "devnet":
    case "testnet":
      // This is the program ID for the Superteam101 program on devnet and testnet.
      return new PublicKey("b7UvLiCW4gCcQWDHmxHt75LV3TYBKiJRvSEoZPCHsch");
    case "mainnet-beta":
    default:
      return SUPERTEAM101_PROGRAM_ID;
  }
}
