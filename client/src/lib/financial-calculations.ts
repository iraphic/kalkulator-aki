export interface ServiceEntry {
  serviceDetails: string;
  monthlyCost: number;
  activationCost: number;
}

export interface FinancialInputs {
  customerName: string;
  investmentCost: number;
  contractPeriod: number;
  services: ServiceEntry[];
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

export interface OpexProjection {
  year: number;
  marketingCost: number;
  operationalCost: number;
  totalOpex: number;
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
  grossProfit: number;
  grossProfitMargin: number;
  totalNetIncome: number;
  netIncomeMargin: number;
  yearlyProjections: YearlyProjection[];
  cashFlowProjections: CashFlowProjection[];
  cogsProjections: CogsProjection[];
  opexProjections: OpexProjection[];
  npv: number;
  irr: number;
  paybackPeriod: PaybackPeriod;
  isViable: boolean;
}

// Constants
const WACC = 0.15; // 15%
const TAX_RATE = 0.22; // 22%
const BAD_DEBT_RATE = 0.05; // 5%
const MARKETING_RATE = 0.30; // 30%
const OPERATIONAL_RATE = 0.20; // 20%
const CAPEX_ADDITIONAL = 0.007; // 0.70% for unexpected costs

export function calculateFinancialAnalysis(inputs: FinancialInputs): CalculationResults {
  const { investmentCost, contractPeriod, services } = inputs;

  // Calculate aggregated values from services
  const monthlyRevenue = services.reduce((sum, service) => sum + service.monthlyCost, 0);
  const otcCost = services.reduce((sum, service) => sum + service.activationCost, 0);

  // Basic calculations
  const otcRevenue = otcCost; // Use actual OTC cost from user input
  const monthlyTotal = monthlyRevenue * contractPeriod;
  const totalRevenue = otcRevenue + monthlyTotal;

  // COGS calculations (70% of price)
  const otcCogs = otcRevenue * 0.7;
  const monthlyCogs = monthlyTotal * 0.7;
  const totalCogs = otcCogs + monthlyCogs;

  // Costs
  const costIBL = totalRevenue; // Same as revenue for IBL
  const costOBL = 0; // No OBL costs
  
  // OPEX calculations will be computed per year, totals will be calculated later

  // Depreciation - based on actual CAPEX including additional costs
  // Calculate depreciation period based on contract period (in years, rounded up)
  // Guard against division by zero when contractPeriod is 0
  const depreciationPeriod = contractPeriod > 0 ? Math.ceil(contractPeriod / 12) : 1;
  const actualCapex = investmentCost * (1 + CAPEX_ADDITIONAL);
  const annualDepreciation = actualCapex / depreciationPeriod;

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
    // OPEX will be calculated separately and stored in opexProjections
    let yearlyOpex = 0;
    const ebitda = yearlyRevenue - badDebt - yearlyOpex;
    const depreciation = year === 0 || year > depreciationPeriod ? 0 : annualDepreciation;
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

  // OPEX projections - calculate per year based on actual revenue
  const opexProjections: OpexProjection[] = [];
  
  for (let year = 0; year <= 6; year++) {
    let yearlyMarketingCost = 0;
    let yearlyOperationalCost = 0;
    
    if (year === 0) {
      // Year 0: No marketing cost, operational cost on OTC revenue only
      yearlyOperationalCost = otcRevenue * OPERATIONAL_RATE;
    } else if (year <= Math.ceil(contractPeriod / 12)) {
      // Calculate this year's monthly revenue portion
      const yearlyMonthlyRevenue = Math.min(monthlyRevenue * 12, monthlyTotal - (monthlyRevenue * 12 * (year - 1)));
      // Get total yearly revenue (which could include both monthly and remaining revenue)
      const yearlyTotalRevenue = yearlyProjections[year].revenue;
      
      // Marketing cost: 30% of monthly revenue portion only
      yearlyMarketingCost = yearlyMonthlyRevenue * MARKETING_RATE;
      // Operational cost: 20% of total yearly revenue
      yearlyOperationalCost = yearlyTotalRevenue * OPERATIONAL_RATE;
    }
    
    const yearlyTotalOpex = yearlyMarketingCost + yearlyOperationalCost;
    
    opexProjections.push({
      year,
      marketingCost: yearlyMarketingCost,
      operationalCost: yearlyOperationalCost,
      totalOpex: yearlyTotalOpex,
    });
  }

  // Update yearly projections with calculated OPEX and COGS values
  for (let i = 0; i < yearlyProjections.length; i++) {
    const opexValue = opexProjections[i].totalOpex;
    const cogsValue = cogsProjections[i].totalCogs;
    
    yearlyProjections[i].opex = opexValue;
    
    // Calculate EBITDA correctly: Revenue - BadDebt - COGS - OPEX
    // This follows the standard P&L format: Revenue → Gross Profit (after COGS) → EBITDA (after OPEX)
    yearlyProjections[i].ebitda = yearlyProjections[i].revenue - yearlyProjections[i].badDebt - cogsValue - opexValue;
    
    // Recalculate EBIT
    yearlyProjections[i].ebit = yearlyProjections[i].ebitda - yearlyProjections[i].depreciation;
    
    // Recalculate tax - only apply tax if EBIT is positive
    yearlyProjections[i].tax = yearlyProjections[i].ebit > 0 ? yearlyProjections[i].ebit * TAX_RATE : 0;
    
    // Calculate Net Income using new formula: Total Revenue − COGS − Depreciation − (OPEX + Tax)
    yearlyProjections[i].netIncome = yearlyProjections[i].revenue - cogsValue - yearlyProjections[i].depreciation - opexValue - yearlyProjections[i].tax;
  }

  // Calculate totals from projections
  const totalOpex = opexProjections.reduce((sum, p) => sum + p.totalOpex, 0);
  const marketingCost = opexProjections.reduce((sum, p) => sum + p.marketingCost, 0);
  const operationalCost = opexProjections.reduce((sum, p) => sum + p.operationalCost, 0);

  // Cash flow projections
  const cashFlowProjections: CashFlowProjection[] = [];
  let cumulativeCashFlow = 0;

  for (let year = 0; year <= 6; year++) {
    const projection = yearlyProjections[year];
    const capex = year === 0 ? investmentCost * (1 + CAPEX_ADDITIONAL) : 0;
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

  // Calculate profit and margin metrics
  const grossProfit = totalRevenue - totalCogs;
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  
  // Calculate total net income from all years
  const totalNetIncome = yearlyProjections.reduce((sum, projection) => sum + projection.netIncome, 0);
  const netIncomeMargin = totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0;

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
    grossProfit,
    grossProfitMargin,
    totalNetIncome,
    netIncomeMargin,
    yearlyProjections,
    cashFlowProjections,
    cogsProjections,
    opexProjections,
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
