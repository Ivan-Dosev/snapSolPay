import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair } from '@solana/web3.js'
import { Superteam101 } from '../target/types/superteam101'

describe('superteam101', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Superteam101 as Program<Superteam101>

  const superteam101Keypair = Keypair.generate()

  it('Initialize Superteam101', async () => {
    await program.methods
      .initialize()
      .accounts({
        superteam101: superteam101Keypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([superteam101Keypair])
      .rpc()

    const currentCount = await program.account.superteam101.fetch(superteam101Keypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Superteam101', async () => {
    await program.methods.increment().accounts({ superteam101: superteam101Keypair.publicKey }).rpc()

    const currentCount = await program.account.superteam101.fetch(superteam101Keypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Superteam101 Again', async () => {
    await program.methods.increment().accounts({ superteam101: superteam101Keypair.publicKey }).rpc()

    const currentCount = await program.account.superteam101.fetch(superteam101Keypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Superteam101', async () => {
    await program.methods.decrement().accounts({ superteam101: superteam101Keypair.publicKey }).rpc()

    const currentCount = await program.account.superteam101.fetch(superteam101Keypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set superteam101 value', async () => {
    await program.methods.set(42).accounts({ superteam101: superteam101Keypair.publicKey }).rpc()

    const currentCount = await program.account.superteam101.fetch(superteam101Keypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the superteam101 account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        superteam101: superteam101Keypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.superteam101.fetchNullable(superteam101Keypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
