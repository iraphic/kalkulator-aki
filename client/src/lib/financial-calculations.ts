export interface FinancialInputs {
  investmentCost: number;
  monthlyRevenue: number;
  contractPeriod: number;
}

export interface YearlyProjection {
  year: number;
  revenue: number;
  badDebt: number;
  opex: number;
  ebitda: number;
  depreciation: number;
  ebit: number;
  tax: number;
  netIncome: number;
}

export interface CashFlowProjection {
  year: number;
  netIncome: number;
  addBackDepreciation: number;
  totalCashInflow: number;
  capex: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
}

export interface CalculationResults {
  totalRevenue: number;
  otcRevenue: number;
  monthlyTotal: number;
  costIBL: number;
  costOBL: number;
  totalOpex: number;
  marketingCost: number;
  operationalCost: number;
  yearlyProjections: YearlyProjection[];
  cashFlowProjections: CashFlowProjection[];
  npv: number;
  irr: number;
  isViable: boolean;
}

// Constants
const WACC = 0.178; // 17.8%
const TAX_RATE = 0.11; // 11%
const BAD_DEBT_RATE = 0.05; // 5%
const MARKETING_RATE = 0.05; // 5%
const OPERATIONAL_RATE = 0.20; // 20%
const DEPRECIATION_YEARS = 6;

export function calculateFinancialAnalysis(inputs: FinancialInputs): CalculationResults {
  const { investmentCost, monthlyRevenue, contractPeriod } = inputs;

  // Basic calculations
  const otcRevenue = monthlyRevenue * 2.5; // OTC is 2.5x monthly
  const monthlyTotal = monthlyRevenue * contractPeriod;
  const totalRevenue = otcRevenue + monthlyTotal;

  // Costs
  const costIBL = totalRevenue; // Same as revenue for IBL
  const costOBL = 0; // No OBL costs
  
  // OPEX calculations
  const marketingCost = totalRevenue * MARKETING_RATE;
  const operationalCost = investmentCost * OPERATIONAL_RATE;
  const totalOpex = marketingCost + operationalCost;

  // Depreciation
  const annualDepreciation = investmentCost / DEPRECIATION_YEARS;

  // Yearly projections
  const yearlyProjections: YearlyProjection[] = [];
  
  for (let year = 0; year <= 6; year++) {
    let yearlyRevenue = 0;
    
    if (year === 0) {
      yearlyRevenue = otcRevenue;
    } else if (year <= Math.ceil(contractPeriod / 12)) {
      yearlyRevenue = Math.min(monthlyRevenue * 12, monthlyTotal - (monthlyRevenue * 12 * (year - 1)));
    }

    const badDebt = yearlyRevenue * BAD_DEBT_RATE;
    const yearlyOpex = year === 0 ? 0 : (marketingCost + operationalCost) / 6;
    const ebitda = yearlyRevenue - badDebt - yearlyOpex;
    const depreciation = year === 0 ? 0 : annualDepreciation;
    const ebit = ebitda - depreciation;
    const tax = ebit * TAX_RATE;
    const netIncome = ebit - tax;

    yearlyProjections.push({
      year,
      revenue: yearlyRevenue,
      badDebt,
      opex: yearlyOpex,
      ebitda,
      depreciation,
      ebit,
      tax,
      netIncome,
    });
  }

  // Cash flow projections
  const cashFlowProjections: CashFlowProjection[] = [];
  let cumulativeCashFlow = 0;

  for (let year = 0; year <= 6; year++) {
    const projection = yearlyProjections[year];
    const capex = year === 0 ? investmentCost : 0;
    const totalCashInflow = projection.netIncome + projection.depreciation;
    const netCashFlow = totalCashInflow - capex;
    cumulativeCashFlow += netCashFlow;

    cashFlowProjections.push({
      year,
      netIncome: projection.netIncome,
      addBackDepreciation: projection.depreciation,
      totalCashInflow,
      capex,
      netCashFlow,
      cumulativeCashFlow,
    });
  }

  // NPV calculation
  const npv = calculateNPV(cashFlowProjections.map(cf => cf.netCashFlow), WACC);
  
  // IRR calculation
  const irr = calculateIRR(cashFlowProjections.map(cf => cf.netCashFlow));

  return {
    totalRevenue,
    otcRevenue,
    monthlyTotal,
    costIBL,
    costOBL,
    totalOpex,
    marketingCost,
    operationalCost,
    yearlyProjections,
    cashFlowProjections,
    npv,
    irr: irr * 100, // Convert to percentage
    isViable: npv > 0 && irr > WACC,
  };
}

function calculateNPV(cashFlows: number[], discountRate: number): number {
  return cashFlows.reduce((npv, cashFlow, index) => {
    return npv + cashFlow / Math.pow(1 + discountRate, index);
  }, 0);
}

function calculateIRR(cashFlows: number[]): number {
  // Newton-Raphson method for IRR calculation
  let rate = 0.1; // Initial guess
  const maxIterations = 100;
  const precision = 1e-6;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let j = 0; j < cashFlows.length; j++) {
      const factor = Math.pow(1 + rate, j);
      npv += cashFlows[j] / factor;
      dnpv -= j * cashFlows[j] / (factor * (1 + rate));
    }

    const newRate = rate - npv / dnpv;
    
    if (Math.abs(newRate - rate) < precision) {
      return newRate;
    }
    
    rate = newRate;
  }

  return rate;
}
