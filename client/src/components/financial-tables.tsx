import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercentage } from "@/lib/currency-utils";
import { YearlyProjection, CashFlowProjection, CogsProjection, OpexProjection, CalculationResults } from "@/lib/financial-calculations";

interface ProfitLossTableProps {
  projections: YearlyProjection[];
}

export function ProfitLossTable({ projections }: ProfitLossTableProps) {
  const totals = {
    revenue: projections.reduce((sum, p) => sum + p.revenue, 0),
    badDebt: projections.reduce((sum, p) => sum + p.badDebt, 0),
    opex: projections.reduce((sum, p) => sum + p.opex, 0),
    ebitda: projections.reduce((sum, p) => sum + p.ebitda, 0),
    depreciation: projections.reduce((sum, p) => sum + p.depreciation, 0),
    ebit: projections.reduce((sum, p) => sum + p.ebit, 0),
    tax: projections.reduce((sum, p) => sum + p.tax, 0),
    netIncome: projections.reduce((sum, p) => sum + p.netIncome, 0),
  };

  return (
    <div className="overflow-x-auto">
      <Table className="w-full table-striped">
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="px-4 py-3 text-left font-medium text-foreground">Label</TableHead>
            <TableHead className="px-4 py-3 text-right font-medium text-foreground">Jumlah</TableHead>
            {projections.map((_, index) => (
              <TableHead key={index} className="px-4 py-3 text-right font-medium text-foreground">
                Tahun ke-{index}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">Revenue</TableCell>
            <TableCell className={`px-4 py-3 text-right ${totals.revenue < 0 ? 'text-red-600' : ''}`} data-testid="total-revenue">{formatCurrency(totals.revenue)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right ${p.revenue < 0 ? 'text-red-600' : ''}`} data-testid={`revenue-year-${index}`}>
                {formatCurrency(p.revenue)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">Bad Debt</TableCell>
            <TableCell className={`px-4 py-3 text-right ${totals.badDebt < 0 ? 'text-red-600' : ''}`} data-testid="total-bad-debt">{formatCurrency(totals.badDebt)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right ${p.badDebt < 0 ? 'text-red-600' : ''}`} data-testid={`bad-debt-year-${index}`}>
                {formatCurrency(p.badDebt)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">OPEX</TableCell>
            <TableCell className={`px-4 py-3 text-right ${totals.opex < 0 ? 'text-red-600' : ''}`} data-testid="total-opex">{formatCurrency(totals.opex)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right ${p.opex < 0 ? 'text-red-600' : ''}`} data-testid={`opex-year-${index}`}>
                {formatCurrency(p.opex)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">EBITDA</TableCell>
            <TableCell className={`px-4 py-3 text-right ${totals.ebitda < 0 ? 'text-red-600' : 'positive-metric'}`} data-testid="total-ebitda">{formatCurrency(totals.ebitda)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right ${p.ebitda < 0 ? 'text-red-600' : ''}`} data-testid={`ebitda-year-${index}`}>
                {formatCurrency(p.ebitda)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">Depresiasi</TableCell>
            <TableCell className={`px-4 py-3 text-right ${totals.depreciation < 0 ? 'text-red-600' : ''}`} data-testid="total-depreciation">{formatCurrency(totals.depreciation)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right ${p.depreciation < 0 ? 'text-red-600' : ''}`} data-testid={`depreciation-year-${index}`}>
                {formatCurrency(p.depreciation)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">EBIT</TableCell>
            <TableCell className={`px-4 py-3 text-right ${totals.ebit < 0 ? 'text-red-600' : 'positive-metric'}`} data-testid="total-ebit">{formatCurrency(totals.ebit)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right ${p.ebit < 0 ? 'text-red-600' : ''}`} data-testid={`ebit-year-${index}`}>
                {formatCurrency(p.ebit)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">Pajak</TableCell>
            <TableCell className={`px-4 py-3 text-right ${totals.tax < 0 ? 'text-red-600' : ''}`} data-testid="total-tax">{formatCurrency(totals.tax)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right ${p.tax < 0 ? 'text-red-600' : ''}`} data-testid={`tax-year-${index}`}>
                {formatCurrency(p.tax)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow className="border-t-2 border-primary">
            <TableCell className="px-4 py-3 font-bold">Net Income</TableCell>
            <TableCell className={`px-4 py-3 text-right font-bold ${totals.netIncome < 0 ? 'text-red-600' : 'positive-metric'}`} data-testid="total-net-income">
              {formatCurrency(totals.netIncome)}
            </TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right font-bold ${p.netIncome < 0 ? 'text-red-600' : ''}`} data-testid={`net-income-year-${index}`}>
                {formatCurrency(p.netIncome)}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

interface CashFlowTableProps {
  projections: CashFlowProjection[];
}

export function CashFlowTable({ projections }: CashFlowTableProps) {
  const totals = {
    netIncome: projections.reduce((sum, p) => sum + p.netIncome, 0),
    addBackDepreciation: projections.reduce((sum, p) => sum + p.addBackDepreciation, 0),
    totalCashInflow: projections.reduce((sum, p) => sum + p.totalCashInflow, 0),
    capex: projections.reduce((sum, p) => sum + p.capex, 0),
    netCashFlow: projections.reduce((sum, p) => sum + p.netCashFlow, 0),
    cumulativeCashFlow: projections.length > 0 ? projections[projections.length - 1].cumulativeCashFlow : 0,
  };

  return (
    <div className="overflow-x-auto">
      <Table className="w-full table-striped">
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="px-4 py-3 text-left font-medium text-foreground">Label</TableHead>
            <TableHead className="px-4 py-3 text-right font-medium text-foreground">Jumlah</TableHead>
            {projections.map((_, index) => (
              <TableHead key={index} className="px-4 py-3 text-right font-medium text-foreground">
                Tahun ke-{index}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">Net Income</TableCell>
            <TableCell className={`px-4 py-3 text-right ${totals.netIncome < 0 ? 'text-red-600' : ''}`} data-testid="cf-total-net-income">{formatCurrency(totals.netIncome)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right ${p.netIncome < 0 ? 'text-red-600' : ''}`} data-testid={`cf-net-income-year-${index}`}>
                {formatCurrency(p.netIncome)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">Add Back Depresiasi</TableCell>
            <TableCell className={`px-4 py-3 text-right ${totals.addBackDepreciation < 0 ? 'text-red-600' : ''}`} data-testid="cf-total-depreciation">{formatCurrency(totals.addBackDepreciation)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right ${p.addBackDepreciation < 0 ? 'text-red-600' : ''}`} data-testid={`cf-depreciation-year-${index}`}>
                {formatCurrency(p.addBackDepreciation)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">TOTAL CASH INFLOW</TableCell>
            <TableCell className={`px-4 py-3 text-right font-bold ${totals.totalCashInflow < 0 ? 'text-red-600' : ''}`} data-testid="cf-total-inflow">{formatCurrency(totals.totalCashInflow)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right font-bold ${p.totalCashInflow < 0 ? 'text-red-600' : ''}`} data-testid={`cf-inflow-year-${index}`}>
                {formatCurrency(p.totalCashInflow)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">CAPEX</TableCell>
            <TableCell className={`px-4 py-3 text-right ${totals.capex < 0 ? 'text-red-600' : ''}`} data-testid="cf-total-capex">{formatCurrency(totals.capex)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right ${p.capex < 0 ? 'text-red-600' : ''}`} data-testid={`cf-capex-year-${index}`}>
                {formatCurrency(p.capex)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow className="border-t-2 border-primary">
            <TableCell className="px-4 py-3 font-bold">Net Cash Flow</TableCell>
            <TableCell className={`px-4 py-3 text-right font-bold ${totals.netCashFlow < 0 ? 'text-red-600' : 'positive-metric'}`} data-testid="cf-total-net-flow">
              {formatCurrency(totals.netCashFlow)}
            </TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className="px-4 py-3 text-right font-bold" data-testid={`cf-net-flow-year-${index}`}>
                <span className={p.netCashFlow < 0 ? "text-red-600" : "positive-metric"}>
                  {formatCurrency(p.netCashFlow)}
                </span>
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-bold">Cum Cash Flow</TableCell>
            <TableCell className={`px-4 py-3 text-right font-bold ${totals.cumulativeCashFlow < 0 ? 'text-red-600' : 'positive-metric'}`} data-testid="cf-total-cumulative">
              {formatCurrency(totals.cumulativeCashFlow)}
            </TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className="px-4 py-3 text-right font-bold" data-testid={`cf-cumulative-year-${index}`}>
                <span className={p.cumulativeCashFlow < 0 ? "text-red-600" : "positive-metric"}>
                  {formatCurrency(p.cumulativeCashFlow)}
                </span>
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

// COGS Table Component
interface CogsTableProps {
  projections: CogsProjection[];
}

export function CogsTable({ projections }: CogsTableProps) {
  const totals = {
    otcCogs: projections.reduce((sum, p) => sum + p.otcCogs, 0),
    monthlyCogs: projections.reduce((sum, p) => sum + p.monthlyCogs, 0),
    totalCogs: projections.reduce((sum, p) => sum + p.totalCogs, 0),
  };

  return (
    <div className="overflow-x-auto">
      <Table className="w-full table-striped">
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="px-4 py-3 text-left font-medium text-foreground">Label</TableHead>
            <TableHead className="px-4 py-3 text-right font-medium text-foreground">Jumlah</TableHead>
            {projections.map((_, index) => (
              <TableHead key={index} className="px-4 py-3 text-right font-medium text-foreground">
                Tahun ke-{index}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">COGS OTC</TableCell>
            <TableCell className={`px-4 py-3 text-right ${totals.otcCogs < 0 ? 'text-red-600' : ''}`} data-testid="cogs-total-otc">{formatCurrency(totals.otcCogs)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right ${p.otcCogs < 0 ? 'text-red-600' : ''}`} data-testid={`cogs-otc-year-${index}`}>
                {formatCurrency(p.otcCogs)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">COGS Bulanan</TableCell>
            <TableCell className={`px-4 py-3 text-right ${totals.monthlyCogs < 0 ? 'text-red-600' : ''}`} data-testid="cogs-total-monthly">{formatCurrency(totals.monthlyCogs)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right ${p.monthlyCogs < 0 ? 'text-red-600' : ''}`} data-testid={`cogs-monthly-year-${index}`}>
                {formatCurrency(p.monthlyCogs)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow className="border-t-2 border-primary">
            <TableCell className="px-4 py-3 font-bold text-primary">Total COGS</TableCell>
            <TableCell className={`px-4 py-3 text-right font-bold ${totals.totalCogs < 0 ? 'text-red-600' : 'text-primary'}`} data-testid="cogs-total-all">{formatCurrency(totals.totalCogs)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right font-bold ${p.totalCogs < 0 ? 'text-red-600' : 'text-primary'}`} data-testid={`cogs-total-year-${index}`}>
                {formatCurrency(p.totalCogs)}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

// OPEX Table Component
interface OpexTableProps {
  projections: OpexProjection[];
}

export function OpexTable({ projections }: OpexTableProps) {
  const totals = {
    marketingCost: projections.reduce((sum, p) => sum + p.marketingCost, 0),
    operationalCost: projections.reduce((sum, p) => sum + p.operationalCost, 0),
    totalOpex: projections.reduce((sum, p) => sum + p.totalOpex, 0),
  };

  return (
    <div className="overflow-x-auto">
      <Table className="w-full table-striped">
        <TableHeader className="bg-primary text-primary-foreground">
          <TableRow>
            <TableHead className="px-4 py-3 text-left font-medium">Label</TableHead>
            <TableHead className="px-4 py-3 text-right font-medium">Jumlah</TableHead>
            {projections.map((_, index) => (
              <TableHead key={index} className="px-4 py-3 text-right font-medium">
                Tahun ke-{index}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">Marketing Cost</TableCell>
            <TableCell className={`px-4 py-3 text-right ${totals.marketingCost < 0 ? 'text-red-600' : ''}`} data-testid="opex-total-marketing">{formatCurrency(totals.marketingCost)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right ${p.marketingCost < 0 ? 'text-red-600' : ''}`} data-testid={`opex-marketing-year-${index}`}>
                {formatCurrency(p.marketingCost)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">Operational Cost</TableCell>
            <TableCell className={`px-4 py-3 text-right ${totals.operationalCost < 0 ? 'text-red-600' : ''}`} data-testid="opex-total-operational">{formatCurrency(totals.operationalCost)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right ${p.operationalCost < 0 ? 'text-red-600' : ''}`} data-testid={`opex-operational-year-${index}`}>
                {formatCurrency(p.operationalCost)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow className="border-t-2 border-primary">
            <TableCell className="px-4 py-3 font-bold text-primary">Total OPEX</TableCell>
            <TableCell className={`px-4 py-3 text-right font-bold ${totals.totalOpex < 0 ? 'text-red-600' : 'text-primary'}`} data-testid="opex-total-all">{formatCurrency(totals.totalOpex)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className={`px-4 py-3 text-right font-bold ${p.totalOpex < 0 ? 'text-red-600' : 'text-primary'}`} data-testid={`opex-total-year-${index}`}>
                {formatCurrency(p.totalOpex)}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

// Revenue & P&L Summary Table Component
interface PLSummaryTableProps {
  results: CalculationResults;
}

export function PLSummaryTable({ results }: PLSummaryTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table className="w-full table-striped">
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="px-4 py-3 text-left font-medium text-foreground w-1/3">Metrics</TableHead>
            <TableHead className="px-4 py-3 text-center font-medium text-foreground">Total</TableHead>
            {results.yearlyProjections.slice(1).map((_, index) => (
              <TableHead key={index} className="px-4 py-3 text-center font-medium text-foreground">
                Tahun {index + 1}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="px-4 py-3 font-semibold bg-muted">Revenue</TableCell>
            <TableCell className="px-4 py-3 text-center" data-testid="pl-revenue-total">{formatCurrency(results.totalRevenue)}</TableCell>
            {results.yearlyProjections.slice(1).map((proj, index) => (
              <TableCell key={index} className="px-4 py-3 text-center" data-testid={`pl-revenue-year-${index + 1}`}>
                {formatCurrency(proj.revenue)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-semibold">Direct Cost (COGS)</TableCell>
            <TableCell className="px-4 py-3 text-center" data-testid="pl-cogs-total">{formatCurrency(results.totalCogs)}</TableCell>
            {results.cogsProjections.slice(1).map((cogs, index) => (
              <TableCell key={index} className="px-4 py-3 text-center" data-testid={`pl-cogs-year-${index + 1}`}>
                {formatCurrency(cogs.totalCogs)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-semibold">Depresiasi</TableCell>
            <TableCell className="px-4 py-3 text-center" data-testid="pl-depreciation-total">{formatCurrency(results.yearlyProjections.reduce((sum, proj) => sum + proj.depreciation, 0))}</TableCell>
            {results.yearlyProjections.slice(1).map((proj, index) => (
              <TableCell key={index} className="px-4 py-3 text-center" data-testid={`pl-depreciation-year-${index + 1}`}>
                {formatCurrency(proj.depreciation)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow className="bg-muted">
            <TableCell className="px-4 py-3 font-semibold">Gross Profit (GP)</TableCell>
            <TableCell className="px-4 py-3 text-center font-semibold" data-testid="pl-gross-profit-total">{formatCurrency(results.grossProfit)}</TableCell>
            {results.yearlyProjections.slice(1).map((proj, index) => {
              const yearlyGrossProfit = proj.revenue - (results.cogsProjections[index + 1]?.totalCogs || 0);
              return (
                <TableCell key={index} className="px-4 py-3 text-center font-semibold" data-testid={`pl-gross-profit-year-${index + 1}`}>
                  {formatCurrency(yearlyGrossProfit)}
                </TableCell>
              );
            })}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-semibold">GP Margin</TableCell>
            <TableCell 
              className="px-4 py-3 text-center" 
              colSpan={1 + results.yearlyProjections.slice(1).length}
              data-testid="pl-gp-margin-total"
            >
              30%
            </TableCell>
          </TableRow>
          <TableRow className="bg-muted">
            <TableCell className="px-4 py-3 font-semibold">Net Income (NI)</TableCell>
            <TableCell className="px-4 py-3 text-center font-semibold" data-testid="pl-net-income-total">{formatCurrency(results.totalNetIncome)}</TableCell>
            {results.yearlyProjections.slice(1).map((proj, index) => (
              <TableCell key={index} className="px-4 py-3 text-center font-semibold" data-testid={`pl-net-income-year-${index + 1}`}>
                {formatCurrency(proj.netIncome)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-semibold">NI Margin</TableCell>
            <TableCell className="px-4 py-3 text-center" data-testid="pl-ni-margin-total">{formatPercentage(results.netIncomeMargin)}</TableCell>
            {results.yearlyProjections.slice(1).map((proj, index) => {
              const margin = proj.revenue > 0 ? (proj.netIncome / proj.revenue) * 100 : 0;
              return (
                <TableCell key={index} className="px-4 py-3 text-center" data-testid={`pl-ni-margin-year-${index + 1}`}>
                  {formatPercentage(margin)}
                </TableCell>
              );
            })}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

// Cash Flow Summary Table Component
interface CashFlowSummaryTableProps {
  results: CalculationResults;
}

export function CashFlowSummaryTable({ results }: CashFlowSummaryTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table className="w-full table-striped">
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="px-4 py-3 text-left font-medium text-foreground w-1/3">Cash Flow Metrics</TableHead>
            <TableHead className="px-4 py-3 text-center font-medium text-foreground">Total</TableHead>
            {results.cashFlowProjections.slice(1).map((_, index) => (
              <TableHead key={index} className="px-4 py-3 text-center font-medium text-foreground">
                Tahun {index + 1}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="px-4 py-3 font-semibold">EBIT+ (after tax)</TableCell>
            <TableCell className="px-4 py-3 text-center" data-testid="cf-ebit-total">
              {formatCurrency(results.cashFlowProjections.reduce((sum, proj) => sum + proj.totalCashInflow, 0))}
            </TableCell>
            {results.cashFlowProjections.slice(1).map((cf, index) => (
              <TableCell key={index} className="px-4 py-3 text-center" data-testid={`cf-ebit-year-${index + 1}`}>
                {formatCurrency(cf.totalCashInflow)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-semibold">Investment (CAPEX)</TableCell>
            <TableCell className="px-4 py-3 text-center" data-testid="cf-investment-total">
              {formatCurrency(results.cashFlowProjections.reduce((sum, proj) => sum + proj.capex, 0))}
            </TableCell>
            {results.cashFlowProjections.slice(1).map((cf, index) => (
              <TableCell key={index} className="px-4 py-3 text-center" data-testid={`cf-investment-year-${index + 1}`}>
                {formatCurrency(cf.capex)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow className="bg-muted">
            <TableCell className="px-4 py-3 font-semibold">Free Cash Flow</TableCell>
            <TableCell className="px-4 py-3 text-center font-semibold" data-testid="cf-free-cashflow-total">
              {formatCurrency(results.cashFlowProjections.reduce((sum, proj) => sum + proj.netCashFlow, 0))}
            </TableCell>
            {results.cashFlowProjections.slice(1).map((cf, index) => (
              <TableCell key={index} className="px-4 py-3 text-center font-semibold" data-testid={`cf-free-cashflow-year-${index + 1}`}>
                <span className={cf.netCashFlow < 0 ? "text-red-600" : "text-green-600"}>
                  {formatCurrency(cf.netCashFlow)}
                </span>
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-semibold">WACC Discount Rate</TableCell>
            <TableCell 
              className="px-4 py-3 text-center" 
              colSpan={1 + results.cashFlowProjections.slice(1).length}
              data-testid="cf-wacc-rate"
            >
              15%
            </TableCell>
          </TableRow>
          <TableRow className="border-t-2 border-primary">
            <TableCell className="px-4 py-3 font-bold">NPV</TableCell>
            <TableCell className={`px-4 py-3 text-center font-bold ${results.npv > 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="cf-npv-value">
              {formatCurrency(results.npv)}
            </TableCell>
            {results.cashFlowProjections.slice(1).map((_, index) => (
              <TableCell key={index} className="px-4 py-3 text-center" data-testid={`cf-npv-year-${index + 1}`}>
                -
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-bold">IRR</TableCell>
            <TableCell className={`px-4 py-3 text-center font-bold ${results.irr > 15 ? 'text-green-600' : 'text-red-600'}`} data-testid="cf-irr-value">
              {formatPercentage(results.irr)}
            </TableCell>
            {results.cashFlowProjections.slice(1).map((_, index) => (
              <TableCell key={index} className="px-4 py-3 text-center" data-testid={`cf-irr-year-${index + 1}`}>
                -
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-bold">Payback Period</TableCell>
            <TableCell className="px-4 py-3 text-center font-bold" data-testid="cf-payback-value">
              {results.paybackPeriod.years} tahun {results.paybackPeriod.months} bulan
            </TableCell>
            {results.cashFlowProjections.slice(1).map((_, index) => (
              <TableCell key={index} className="px-4 py-3 text-center" data-testid={`cf-payback-year-${index + 1}`}>
                -
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

// Feasibility Analysis Table Component
interface FeasibilityAnalysisTableProps {
  results: CalculationResults;
}

export function FeasibilityAnalysisTable({ results }: FeasibilityAnalysisTableProps) {
  const npvStatus = results.npv > 0 ? 'Layak' : 'Tidak Layak';
  const irrStatus = results.irr > 15 ? 'Layak' : 'Tidak Layak';
  
  return (
    <div className="overflow-x-auto">
      <Table className="w-full table-striped">
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="px-4 py-3 text-left font-medium text-foreground w-1/4">Metrics</TableHead>
            <TableHead className="px-4 py-3 text-right font-medium text-foreground w-1/2">Value</TableHead>
            <TableHead className="px-4 py-3 text-center font-medium text-foreground w-1/4">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">NPV</TableCell>
            <TableCell className="px-4 py-3 text-right font-medium" data-testid="feasibility-npv-value">
              {formatCurrency(results.npv)}
            </TableCell>
            <TableCell className="px-4 py-3 text-center" data-testid="feasibility-npv-status">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                results.npv > 0 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {npvStatus}
              </span>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">IRR</TableCell>
            <TableCell className="px-4 py-3 text-right font-medium" data-testid="feasibility-irr-value">
              {formatPercentage(results.irr)}
            </TableCell>
            <TableCell className="px-4 py-3 text-center" data-testid="feasibility-irr-status">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                results.irr > 15 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {irrStatus}
              </span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
