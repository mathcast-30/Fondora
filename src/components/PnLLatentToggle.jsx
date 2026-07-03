/**
 * Toggle component for switching between Euro and Percentage display modes
 * @param {Object} props - Component props
 * @param {string} props.mode - Current display mode ('euro' or 'percentage')
 * @param {Function} props.onToggle - Callback when toggle changes
 * @returns {JSX.Element} Toggle component
 */
function PnLLatentToggle({ mode, onToggle }) {
    return (
        <div className="flex items-center gap-2 bg-graylight rounded-lg p-1">
            <button
                onClick={() => onToggle('euro')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    mode === 'euro' 
                        ? 'bg-emerald text-white' 
                        : 'text-gray-500 hover:text-navy'
                }`}
            >
                €
            </button>
            <button
                onClick={() => onToggle('percentage')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    mode === 'percentage' 
                        ? 'bg-emerald text-white' 
                        : 'text-gray-500 hover:text-navy'
                }`}
            >
                %
            </button>
        </div>
    )
}

/**
 * Display P&L value with toggle functionality
 * @param {Object} props - Component props
 * @param {number} props.euroValue - Value in euros
 * @param {number} props.percentageValue - Value in percentage
 * @param {string} props.mode - Current display mode
 * @param {Function} props.onToggle - Toggle callback
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {JSX.Element} P&L display with toggle
 */
export function PnLLatentDisplay({ euroValue, percentageValue, mode, onToggle, className = '' }) {
    const displayValue = mode === 'euro' 
        ? new Intl.NumberFormat('fr-FR', { 
            style: 'currency', 
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          }).format(euroValue)
        : new Intl.NumberFormat('fr-FR', { 
            minimumFractionDigits: 1,
            maximumFractionDigits: 1 
          }).format(percentageValue) + '%'
    
    const isPositive = euroValue >= 0
    const textColor = isPositive ? 'text-emerald' : 'text-red-500'
    
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className={`font-semibold ${textColor}`}>
                {displayValue}
            </span>
            <PnLLatentToggle mode={mode} onToggle={onToggle} />
        </div>
    )
}

export default PnLLatentToggle
