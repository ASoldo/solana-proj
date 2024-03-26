use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshDeserialize, BorshSerialize)]
pub struct CalculatorInstructions {
    operation: u32,
    operating_value: u32,
}

impl CalculatorInstructions {
    pub fn evaluate(self, value: u32) -> u32 {
        match self.operation {
            1 => value + self.operating_value,
            2 => value - self.operating_value,
            3 => value * self.operating_value,
            _ => value,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn evaluate_add() {
        let instruction = CalculatorInstructions {
            operation: 1,
            operating_value: 5,
        };
        assert_eq!(instruction.evaluate(10), 15);
    }

    #[test]
    fn evaluate_subtract() {
        let instruction = CalculatorInstructions {
            operation: 2,
            operating_value: 5,
        };
        assert_eq!(instruction.evaluate(10), 5);
    }

    #[test]
    fn evaluate_multiply() {
        let instruction = CalculatorInstructions {
            operation: 3,
            operating_value: 5,
        };
        assert_eq!(instruction.evaluate(10), 50);
    }

    #[test]
    fn evaluate_default() {
        let instruction = CalculatorInstructions {
            operation: 999, // Assuming this operation doesn't exist
            operating_value: 5,
        };
        assert_eq!(instruction.evaluate(10), 10);
    }
}
