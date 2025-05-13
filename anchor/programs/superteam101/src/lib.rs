#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("b7UvLiCW4gCcQWDHmxHt75LV3TYBKiJRvSEoZPCHsch");

//coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF

#[program]
pub mod superteam101 {
    use super::*;

  pub fn close(_ctx: Context<CloseSuperteam101>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.superteam101.count = ctx.accounts.superteam101.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.superteam101.count = ctx.accounts.superteam101.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeSuperteam101>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.superteam101.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeSuperteam101<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Superteam101::INIT_SPACE,
  payer = payer
  )]
  pub superteam101: Account<'info, Superteam101>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseSuperteam101<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub superteam101: Account<'info, Superteam101>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub superteam101: Account<'info, Superteam101>,
}

#[account]
#[derive(InitSpace)]
pub struct Superteam101 {
  count: u8,
}
