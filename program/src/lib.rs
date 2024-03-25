use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Demo {
    pub counter: u32,
}

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let account = next_account_info(account_iter)?;
    if account.owner != program_id {
        msg!("Account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }
    msg!("Hello from Rootster!");
    msg!("Account Id: {}", account.key);
    msg!("Executable?: {}", account.executable);
    msg!("Lamports?: {:#?}", account.lamports);
    msg!("Debug output complete");

    let mut demo_data = Demo::try_from_slice(&account.data.borrow())?;
    demo_data.counter += 1;
    demo_data.serialize(&mut &mut account.data.borrow_mut()[..])?;
    msg!("Current coutner value is: {}", demo_data.counter);
    Ok(())
}
