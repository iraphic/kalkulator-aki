import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercentage } from "@/lib/currency-utils";
import { YearlyProjection, CashFlowProjection } from "@/lib/financial-calculations";

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
            <TableCell className="px-4 py-3 text-right" data-testid="total-revenue">{formatCurrency(totals.revenue)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className="px-4 py-3 text-right" data-testid={`revenue-year-${index}`}>
                {formatCurrency(p.revenue)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">Bad Debt</TableCell>
            <TableCell className="px-4 py-3 text-right" data-testid="total-bad-debt">{formatCurrency(totals.badDebt)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className="px-4 py-3 text-right" data-testid={`bad-debt-year-${index}`}>
                {formatCurrency(p.badDebt)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">OPEX</TableCell>
            <TableCell className="px-4 py-3 text-right" data-testid="total-opex">{formatCurrency(totals.opex)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className="px-4 py-3 text-right" data-testid={`opex-year-${index}`}>
                {formatCurrency(p.opex)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">EBITDA</TableCell>
            <TableCell className="px-4 py-3 text-right positive-metric" data-testid="total-ebitda">{formatCurrency(totals.ebitda)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className="px-4 py-3 text-right" data-testid={`ebitda-year-${index}`}>
                {formatCurrency(p.ebitda)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">Depresiasi</TableCell>
            <TableCell className="px-4 py-3 text-right" data-testid="total-depreciation">{formatCurrency(totals.depreciation)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className="px-4 py-3 text-right" data-testid={`depreciation-year-${index}`}>
                {formatCurrency(p.depreciation)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">EBIT</TableCell>
            <TableCell className="px-4 py-3 text-right positive-metric" data-testid="total-ebit">{formatCurrency(totals.ebit)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className="px-4 py-3 text-right" data-testid={`ebit-year-${index}`}>
                {formatCurrency(p.ebit)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">Pajak</TableCell>
            <TableCell className="px-4 py-3 text-right" data-testid="total-tax">{formatCurrency(totals.tax)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className="px-4 py-3 text-right" data-testid={`tax-year-${index}`}>
                {formatCurrency(p.tax)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow className="border-t-2 border-primary">
            <TableCell className="px-4 py-3 font-bold">Net Income</TableCell>
            <TableCell className="px-4 py-3 text-right font-bold positive-metric" data-testid="total-net-income">
              {formatCurrency(totals.netIncome)}
            </TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className="px-4 py-3 text-right font-bold" data-testid={`net-income-year-${index}`}>
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
            <TableCell className="px-4 py-3 text-right" data-testid="cf-total-net-income">{formatCurrency(totals.netIncome)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className="px-4 py-3 text-right" data-testid={`cf-net-income-year-${index}`}>
                {formatCurrency(p.netIncome)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">Add Back Depresiasi</TableCell>
            <TableCell className="px-4 py-3 text-right" data-testid="cf-total-depreciation">{formatCurrency(totals.addBackDepreciation)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className="px-4 py-3 text-right" data-testid={`cf-depreciation-year-${index}`}>
                {formatCurrency(p.addBackDepreciation)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">TOTAL CASH INFLOW</TableCell>
            <TableCell className="px-4 py-3 text-right font-bold" data-testid="cf-total-inflow">{formatCurrency(totals.totalCashInflow)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className="px-4 py-3 text-right font-bold" data-testid={`cf-inflow-year-${index}`}>
                {formatCurrency(p.totalCashInflow)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="px-4 py-3 font-medium">CAPEX</TableCell>
            <TableCell className="px-4 py-3 text-right" data-testid="cf-total-capex">{formatCurrency(totals.capex)}</TableCell>
            {projections.map((p, index) => (
              <TableCell key={index} className="px-4 py-3 text-right" data-testid={`cf-capex-year-${index}`}>
                {formatCurrency(p.capex)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow className="border-t-2 border-primary">
            <TableCell className="px-4 py-3 font-bold">Net Cash Flow</TableCell>
            <TableCell className="px-4 py-3 text-right font-bold positive-metric" data-testid="cf-total-net-flow">
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
            <TableCell className="px-4 py-3 text-right font-bold"></TableCell>
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
