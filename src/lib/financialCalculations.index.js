/**
 * Financial Calculations Index
 * Re-exports all financial calculation functions for easier imports
 */

export {
    calculateXIRR,
    calculateCAGR,
    calculateTRI,
    calculateFIFOPnL,
    calculatePRU,
    calculateCryptoRealizedPL,
    formatPercentage,
    formatCurrency
} from './financialCalculations'

export {
    calculateDiversificationScore,
    getDiversificationColor,
    getDiversificationBgColor
} from './diversificationScore'
