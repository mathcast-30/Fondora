/**
 * Financial Calculations Utility Library
 * Implements XIRR, TRI, CAGR, FIFO/PEPS, and PRU calculations for investment tracking
 */

/**
 * Calculates XIRR (Extended Internal Rate of Return) using Newton-Raphson method
 * @param {Array<{date: Date|string, amount: number}>} cashFlows - Array of cash flows (positive for income, negative for expenses)
 * @param {number} [guess=0.1] - Initial guess for the rate (default: 10%)
 * @param {number} [maxIterations=100] - Maximum iterations for convergence
 * @param {number} [tolerance=1e-6] - Tolerance for convergence
 * @returns {number|null} XIRR as a decimal (e.g., 0.1234 for 12.34%) or null if calculation fails
 */
export function calculateXIRR(cashFlows, guess = 0.1, maxIterations = 100, tolerance = 1e-6) {
    if (!cashFlows || cashFlows.length < 2) return null;
    
    // Parse dates and sort by date
    const flows = cashFlows
        .map(cf => ({
            date: cf.date instanceof Date ? cf.date : new Date(cf.date),
            amount: cf.amount
        }))
        .sort((a, b) => a.date - b.date);
    
    // Check if we have at least one positive and one negative cash flow
    const hasPositive = flows.some(cf => cf.amount > 0);
    const hasNegative = flows.some(cf => cf.amount < 0);
    if (!hasPositive || !hasNegative) return null;
    
    const firstDate = flows[0].date;
    
    // Newton-Raphson method
    let rate = guess;
    let iteration = 0;
    let lastValue = 0;
    
    while (iteration < maxIterations) {
        let sum = 0;
        let derivativeSum = 0;
        
        for (const cf of flows) {
            const days = (cf.date - firstDate) / (1000 * 60 * 60 * 24);
            const years = days / 365.25;
            const discountFactor = Math.pow(1 + rate, years);
            
            sum += cf.amount / discountFactor;
            derivativeSum += -cf.amount * years / Math.pow(1 + rate, years + 1);
        }
        
        const newValue = rate - sum / derivativeSum;
        
        if (Math.abs(newValue - rate) < tolerance) {
            return newValue;
        }
        
        if (Math.abs(newValue - lastValue) < tolerance) {
            // Avoid infinite loop with minimal changes
            break;
        }
        
        lastValue = rate;
        rate = newValue;
        iteration++;
    }
    
    return null; // Failed to converge
}

/**
 * Calculates CAGR (Compound Annual Growth Rate)
 * @param {number} initialValue - Initial investment value
 * @param {number} finalValue - Final investment value
 * @param {number} years - Number of years
 * @returns {number} CAGR as a decimal (e.g., 0.1234 for 12.34%)
 */
export function calculateCAGR(initialValue, finalValue, years) {
    if (initialValue === 0 || years <= 0) return 0;
    return Math.pow(finalValue / initialValue, 1 / years) - 1;
}

/**
 * Calculates TRI (Taux de Rentabilité Interne) - French equivalent of IRR
 * Uses XIRR calculation as the basis
 * @param {Array<{date: Date|string, amount: number}>} cashFlows - Array of cash flows
 * @returns {number|null} TRI as a decimal
 */
export function calculateTRI(cashFlows) {
    return calculateXIRR(cashFlows);
}

/**
 * Implements FIFO (First-In, First-Out) / PEPS (Premier Entré, Premier Sorti) method
 * for calculating realized P&L on stock sales
 * @param {Array<{date: Date|string, quantity: number, price: number, type: 'buy'|'sell'}>} transactions - Array of buy and sell transactions
 * @returns {Object} Object containing realized P&L, cost basis, and transaction details
 */
export function calculateFIFOPnL(transactions) {
    if (!transactions || transactions.length === 0) {
        return { realizedPL: 0, totalCost: 0, totalProceeds: 0, remainingPositions: [] };
    }
    
    // Sort transactions by date (oldest first)
    const sortedTransactions = [...transactions]
        .map(t => ({
            ...t,
            date: t.date instanceof Date ? t.date : new Date(t.date)
        }))
        .sort((a, b) => a.date - b.date);
    
    const inventory = []; // Stack of available positions (FIFO)
    let realizedPL = 0;
    let totalCost = 0;
    let totalProceeds = 0;
    const saleDetails = [];
    
    for (const tx of sortedTransactions) {
        if (tx.type === 'buy') {
            // Add to inventory
            inventory.push({
                quantity: tx.quantity,
                price: tx.price,
                date: tx.date
            });
            totalCost += tx.quantity * tx.price;
        } else if (tx.type === 'sell') {
            let remainingQuantity = tx.quantity;
            let totalCostForSale = 0;
            const lotsSold = [];
            
            // Sell from oldest positions first (FIFO)
            while (remainingQuantity > 0 && inventory.length > 0) {
                const oldest = inventory[0];
                const sellQuantity = Math.min(remainingQuantity, oldest.quantity);
                const costForThisLot = sellQuantity * oldest.price;
                
                lotsSold.push({
                    quantity: sellQuantity,
                    price: oldest.price,
                    date: oldest.date
                });
                
                totalCostForSale += costForThisLot;
                remainingQuantity -= sellQuantity;
                
                // Update or remove from inventory
                if (oldest.quantity > sellQuantity) {
                    oldest.quantity -= sellQuantity;
                } else {
                    inventory.shift();
                }
            }
            
            const proceeds = tx.quantity * tx.price;
            const costBasis = totalCostForSale;
            const plForSale = proceeds - costBasis;
            
            realizedPL += plForSale;
            totalProceeds += proceeds;
            
            saleDetails.push({
                date: tx.date,
                quantity: tx.quantity,
                salePrice: tx.price,
                costBasis: totalCostForSale / tx.quantity,
                pl: plForSale,
                lots: lotsSold
            });
        }
    }
    
    return {
        realizedPL,
        totalCost,
        totalProceeds,
        remainingPositions: inventory,
        saleDetails
    };
}

/**
 * Calculates PRU (Prix de Revient Unitaire) pondéré for French crypto tax rules
 * PRU is the weighted average cost per unit for the entire crypto portfolio
 * @param {Array<{quantity: number, price: number}>} positions - Current crypto positions
 * @returns {number} Weighted average cost per unit
 */
export function calculatePRU(positions) {
    if (!positions || positions.length === 0) return 0;
    
    const totalQuantity = positions.reduce((sum, p) => sum + p.quantity, 0);
    const totalCost = positions.reduce((sum, p) => sum + (p.quantity * p.price), 0);
    
    return totalCost / totalQuantity;
}

/**
 * Calculates realized P&L for crypto using French tax rules (PRU method)
 * In France, crypto sales use PRU (Prix de Revient Unitaire) pondéré for the entire portfolio
 * @param {Array<{date: Date|string, quantity: number, price: number, type: 'buy'|'sell'}>} transactions - All crypto transactions
 * @returns {Object} Object containing realized P&L and tax information
 */
export function calculateCryptoRealizedPL(transactions) {
    if (!transactions || transactions.length === 0) {
        return { realizedPL: 0, totalCost: 0, totalProceeds: 0, pruHistory: [] };
    }
    
    // Sort transactions by date
    const sortedTransactions = [...transactions]
        .map(t => ({
            ...t,
            date: t.date instanceof Date ? t.date : new Date(t.date)
        }))
        .sort((a, b) => a.date - b.date);
    
    let realizedPL = 0;
    let totalCost = 0;
    let totalProceeds = 0;
    let currentHoldings = []; // Current positions in portfolio
    const pruHistory = [];
    
    for (const tx of sortedTransactions) {
        if (tx.type === 'buy') {
            currentHoldings.push({
                quantity: tx.quantity,
                price: tx.price,
                date: tx.date
            });
            totalCost += tx.quantity * tx.price;
            
            // Calculate current PRU
            const currentPRU = calculatePRU(currentHoldings);
            pruHistory.push({
                date: tx.date,
                pru: currentPRU,
                totalQuantity: currentHoldings.reduce((sum, p) => sum + p.quantity, 0)
            });
        } else if (tx.type === 'sell') {
            const pruBefore = calculatePRU(currentHoldings);
            
            const proceeds = tx.quantity * tx.price;
            const costBasis = tx.quantity * pruBefore;
            const plForSale = proceeds - costBasis;
            
            realizedPL += plForSale;
            totalProceeds += proceeds;
            
            // Remove sold quantity from holdings (FIFO for tracking, but PRU for tax)
            let remainingQuantity = tx.quantity;
            while (remainingQuantity > 0 && currentHoldings.length > 0) {
                const position = currentHoldings[0];
                const sellQuantity = Math.min(remainingQuantity, position.quantity);
                
                if (position.quantity > sellQuantity) {
                    position.quantity -= sellQuantity;
                } else {
                    currentHoldings.shift();
                }
                
                remainingQuantity -= sellQuantity;
            }
            
            // Update PRU after sale
            if (currentHoldings.length > 0) {
                const currentPRU = calculatePRU(currentHoldings);
                pruHistory.push({
                    date: tx.date,
                    pru: currentPRU,
                    totalQuantity: currentHoldings.reduce((sum, p) => sum + p.quantity, 0)
                });
            }
        }
    }
    
    return {
        realizedPL,
        totalCost,
        totalProceeds,
        pruHistory,
        currentPRU: calculatePRU(currentHoldings)
    };
}

/**
 * Formats a number as a percentage
 * @param {number} value - The value to format
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 2) {
    return (value * 100).toFixed(decimals) + '%';
}

/**
 * Formats a monetary value
 * @param {number} value - The value to format
 * @param {string} [currency='EUR'] - Currency code
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency
    }).format(value);
}
