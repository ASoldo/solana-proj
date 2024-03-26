mod calculator;
use crate::calculator::CalculatorInstructions;
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
pub struct Calculator {
    pub value: u32,
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

    let mut calc = Calculator::try_from_slice(&account.data.borrow())?;
    let calculator_instructions = CalculatorInstructions::try_from_slice(&instruction_data)?;
    calc.value = calculator_instructions.evaluate(calc.value);
    calc.serialize(&mut &mut account.data.borrow_mut()[..])?;
    msg!("Value is now: {}", calc.value);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use borsh::to_vec;
    use solana_program::clock::Epoch;

    #[test]
    fn test_process_instruction() {
        let program_id = Pubkey::new_unique();
        let key = Pubkey::new_unique();
        let mut lamports = 0;

        let calc = Calculator { value: 0 };
        let mut data = to_vec(&calc).unwrap();

        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            data.as_mut_slice(),
            &program_id,
            false,
            Epoch::default(),
        );

        let operation_code: u32 = 1;
        let operation_value: u32 = 5;
        let mut instruction_data = Vec::new();
        instruction_data.extend_from_slice(&operation_code.to_le_bytes());
        instruction_data.extend_from_slice(&operation_value.to_le_bytes());

        let accounts = vec![account];

        let result = process_instruction(&program_id, &accounts, &instruction_data);

        assert!(result.is_ok(), "process_instruction should return Ok(())");

        let updated_calc = Calculator::try_from_slice(&data).unwrap();
        assert_eq!(
            updated_calc.value, 5,
            "Calculator value should be updated to 5"
        );
    }
}
