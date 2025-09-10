export interface FinancialInputs {
  customerName: string;
  investmentCost: number;
  monthlyRevenue: number;
  contractPeriod: number;
  otcCost: number;
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

export interface CogsProjection {
  year: number;
  otcCogs: number;
  monthlyCogs: number;
  totalCogs: number;
}

export interface PaybackPeriod {
  years: number;
  months: number;
  totalMonths: number;
}

export interface CalculationResults {
  totalRevenue: number;
  otcRevenue: number;
  monthlyTotal: number;
  otcCogs: number;
  monthlyCogs: number;
  totalCogs: number;
  costIBL: number;
  costOBL: number;
  totalOpex: number;
  marketingCost: number;
  operationalCost: number;
  yearlyProjections: YearlyProjection[];
  cashFlowProjections: CashFlowProjection[];
  cogsProjections: CogsProjection[];
  npv: number;
  irr: number;
  paybackPeriod: PaybackPeriod;
  isViable: boolean;
}

// Constants
const WACC = 0.178; // 17.8%
const TAX_RATE = 0.11; // 11%
const BAD_DEBT_RATE = 0.05; // 5%
const MARKETING_RATE = 0.30; // 30%
const OPERATIONAL_RATE = 0.20; // 20%
const DEPRECIATION_YEARS = 6;

export function calculateFinancialAnalysis(inputs: FinancialInputs): CalculationResults {
  const { investmentCost, monthlyRevenue, contractPeriod, otcCost } = inputs;

  // Basic calculations
  const otcRevenue = monthlyRevenue * 2.5; // OTC is 2.5x monthly
  const monthlyTotal = monthlyRevenue * contractPeriod;
  const totalRevenue = otcRevenue + monthlyTotal;

  // COGS calculations (70% of price)
  const otcCogs = otcRevenue * 0.7;
  const monthlyCogs = monthlyTotal * 0.7;
  const totalCogs = otcCogs + monthlyCogs;

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

  // COGS projections
  const cogsProjections: CogsProjection[] = [];
  
  for (let year = 0; year <= 6; year++) {
    let yearlyOtcCogs = 0;
    let yearlyMonthlyCogs = 0;
    
    if (year === 0) {
      yearlyOtcCogs = otcCogs;
    } else if (year <= Math.ceil(contractPeriod / 12)) {
      const yearlyMonthlyRevenue = Math.min(monthlyRevenue * 12, monthlyTotal - (monthlyRevenue * 12 * (year - 1)));
      yearlyMonthlyCogs = yearlyMonthlyRevenue * 0.7;
    }
    
    const yearlyTotalCogs = yearlyOtcCogs + yearlyMonthlyCogs;
    
    cogsProjections.push({
      year,
      otcCogs: yearlyOtcCogs,
      monthlyCogs: yearlyMonthlyCogs,
      totalCogs: yearlyTotalCogs,
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
  
  // Payback Period calculation
  const paybackPeriod = calculatePaybackPeriod(cashFlowProjections);

  return {
    totalRevenue,
    otcRevenue,
    monthlyTotal,
    otcCogs,
    monthlyCogs,
    totalCogs,
    costIBL,
    costOBL,
    totalOpex,
    marketingCost,
    operationalCost,
    yearlyProjections,
    cashFlowProjections,
    cogsProjections,
    npv,
    irr: irr * 100, // Convert to percentage
    paybackPeriod,
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

function calculatePaybackPeriod(cashFlowProjections: CashFlowProjection[]): PaybackPeriod {
  let cumulativeCashFlow = 0;
  
  for (let i = 0; i < cashFlowProjections.length; i++) {
    cumulativeCashFlow += cashFlowProjections[i].netCashFlow;
    
    if (cumulativeCashFlow >= 0) {
      // If we reach break-even in the first year
      if (i === 0) {
        return { years: 0, months: 0, totalMonths: 0 };
      }
      
      // Calculate the exact payback period using interpolation
      const previousCumulativeCashFlow = cumulativeCashFlow - cashFlowProjections[i].netCashFlow;
      const currentYearCashFlow = cashFlowProjections[i].netCashFlow;
      
      // Calculate how much of the current year is needed to reach break-even
      const fractionOfYear = Math.abs(previousCumulativeCashFlow) / currentYearCashFlow;
      const totalYears = (i - 1) + fractionOfYear;
      
      const years = Math.floor(totalYears);
      const months = Math.round((totalYears - years) * 12);
      const totalMonths = Math.round(totalYears * 12);
      
      return { years, months, totalMonths };
    }
  }
  
  // If payback period is longer than the projection period
  return { years: 6, months: 12, totalMonths: 84 };
}
