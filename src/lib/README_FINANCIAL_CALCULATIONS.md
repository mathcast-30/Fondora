# Financial Calculations Library

This directory contains utility functions for financial calculations used in Fondora's investment tracking features.

## Files

### `financialCalculations.js`
Core financial calculation functions:

- **`calculateXIRR(cashFlows, guess, maxIterations, tolerance)`** - Calculates Extended Internal Rate of Return using Newton-Raphson method
- **`calculateCAGR(initialValue, finalValue, years)`** - Calculates Compound Annual Growth Rate
- **`calculateTRI(cashFlows)`** - Calculates Taux de Rentabilité Interne (French IRR equivalent)
- **`calculateFIFOPnL(transactions)`** - Calculates realized P&L using FIFO/PEPS method for stocks
- **`calculatePRU(positions)`** - Calculates Prix de Revient Unitaire for French crypto tax rules
- **`calculateCryptoRealizedPL(transactions)`** - Calculates realized P&L for crypto using PRU method
- **`formatPercentage(value, decimals)`** - Formats numbers as percentages
- **`formatCurrency(value, currency)`** - Formats numbers as currency

### `diversificationScore.js`
Diversification analysis functions:

- **`calculateDiversificationScore(positions, total)`** - Calculates overall diversification score (0-100)
- **`getDiversificationColor(score)`** - Returns Tailwind CSS color class based on score
- **`getDiversificationBgColor(score)`** - Returns Tailwind CSS background color class based on score

### `financialCalculations.index.js`
Re-exports all functions for easier imports.

## Usage Examples

### XIRR Calculation
```javascript
import { calculateXIRR } from './lib/financialCalculations'

const cashFlows = [
    { date: '2023-01-01', amount: -1000 },  // Initial investment
    { date: '2023-06-01', amount: 500 },   // Partial return
    { date: '2024-01-01', amount: 800 }    // Final return
]

const xirr = calculateXIRR(cashFlows)
console.log(`XIRR: ${(xirr * 100).toFixed(2)}%`)
```

### FIFO P&L Calculation
```javascript
import { calculateFIFOPnL } from './lib/financialCalculations'

const transactions = [
    { date: '2023-01-01', quantity: 10, price: 100, type: 'buy' },
    { date: '2023-03-01', quantity: 5, price: 120, type: 'buy' },
    { date: '2023-06-01', quantity: 8, price: 150, type: 'sell' }
]

const result = calculateFIFOPnL(transactions)
console.log(`Realized P&L: ${result.realizedPL}`)
```

### Crypto PRU Calculation
```javascript
import { calculatePRU, calculateCryptoRealizedPL } from './lib/financialCalculations'

const positions = [
    { quantity: 0.5, price: 30000 },  // BTC
    { quantity: 2, price: 2000 }    // ETH
]

const pru = calculatePRU(positions)
console.log(`PRU: ${pru}`)

const cryptoTransactions = [
    { date: '2023-01-01', quantity: 0.5, price: 30000, type: 'buy' },
    { date: '2023-02-01', quantity: 2, price: 2000, type: 'buy' },
    { date: '2023-06-01', quantity: 0.2, price: 40000, type: 'sell' }
]

const cryptoPL = calculateCryptoRealizedPL(cryptoTransactions)
console.log(`Crypto Realized P&L: ${cryptoPL.realizedPL}`)
```

### Diversification Score
```javascript
import { calculateDiversificationScore } from './lib/diversificationScore'

const positions = [
    { nom: 'Apple', montant: 5000, secteur: 'Technologie', type: 'action' },
    { nom: 'Microsoft', montant: 3000, secteur: 'Technologie', type: 'action' },
    { nom: 'Total Energies', montant: 2000, secteur: 'Énergie', type: 'action' }
]

const score = calculateDiversificationScore(positions, 10000)
console.log(`Diversification Score: ${score.score}/100`)
console.log(`Grade: ${score.grade}`)
console.log(`Advice: ${score.advice}`)
```

## Financial Rules Implemented

### Stocks/ETF (PEA/CTO)
- **P&L Réalisé**: Uses FIFO/PEPS (Premier Entré, Premier Sorti) method
- **TRI/XIRR**: Calculates internal rate of return for irregular cash flows
- **CAGR**: Compound Annual Growth Rate for regular investments

### Crypto (French Tax Rules)
- **PRU**: Prix de Revient Unitaire pondéré for the entire crypto portfolio
- **P&L Réalisé**: Uses PRU method as required by French tax law (Article 150 VH bis du CGI)
- **Historical Tracking**: Portfolio value history with time-based filtering

### Diversification
- **Asset Class Diversification**: Scores based on distribution across asset classes (0-40 points)
- **Sector Diversification**: Scores based on distribution across sectors (0-30 points)
- **Concentration Risk**: Penalizes high concentration in single positions (0-30 points)
- **Overall Score**: Sum of all components (0-100)

## Database Tables Required

### `transactions_investissement`
```sql
CREATE TABLE transactions_investissement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbole VARCHAR(20) NOT NULL,
    quantity DECIMAL(15,6) NOT NULL,
    price DECIMAL(15,6) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fees DECIMAL(10,2) DEFAULT 0,
    type_compte VARCHAR(10) CHECK (type_compte IN ('PEA', 'CTO')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions_investissement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own investment transactions"
ON transactions_investissement
FOR ALL
USING (auth.uid() = user_id);
```

### `transactions_crypto`
```sql
CREATE TABLE transactions_crypto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    coin_id VARCHAR(50) NOT NULL,
    symbole VARCHAR(10) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(15,6) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fees DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions_crypto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own crypto transactions"
ON transactions_crypto
FOR ALL
USING (auth.uid() = user_id);
```

### `historique_valeur_crypto`
```sql
CREATE TABLE historique_valeur_crypto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    valeur DECIMAL(15,2) NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE historique_valeur_crypto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crypto history"
ON historique_valeur_crypto
FOR ALL
USING (auth.uid() = user_id);
```

## Testing

The functions include proper error handling and edge cases:
- Empty arrays
- Division by zero
- Invalid dates
- Non-converging XIRR calculations
- Single cash flow scenarios

## Performance Considerations

- XIRR calculation uses Newton-Raphson method with configurable tolerance and max iterations
- FIFO calculations use efficient array operations
- Diversification scoring uses memoization where appropriate
- Historical data filtering is optimized for common time periods

## Compliance

All calculations comply with:
- French tax law (CGI Article 150 VH bis for crypto)
- Standard financial calculation methods (XIRR, CAGR, FIFO)
- Best practices for investment performance measurement
