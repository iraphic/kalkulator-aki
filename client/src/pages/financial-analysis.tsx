import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";
import { CogsTable, OpexTable, PLSummaryTable, CashFlowSummaryTable, NPVAnalysisTable, FeasibilityAnalysisTable } from "@/components/financial-tables";
import { calculateFinancialAnalysis, type FinancialInputs, type CalculationResults } from "@/lib/financial-calculations";
import { formatCurrency, formatPercentage, parseCurrency, formatInputCurrency, stripCurrencyPrefix } from "@/lib/currency-utils";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function FinancialAnalysis() {
  const [inputs, setInputs] = useState<FinancialInputs>({
    customerName: "",
    investmentCost: 0,
    monthlyRevenue: 0,
    contractPeriod: 0,
    otcCost: 0,
    serviceDetails: "",
  });

  const [results, setResults] = useState<CalculationResults | null>(null);
  const [inputValues, setInputValues] = useState({
    customerName: "",
    investmentCost: "",
    monthlyRevenue: "",
    contractPeriod: "",
    otcCost: "",
    serviceDetails: "",
  });

  const [periodType, setPeriodType] = useState<string>("");
  const [customPeriod, setCustomPeriod] = useState<string>("");


  const handleInputChange = (field: keyof FinancialInputs, value: string) => {
    if (field === 'customerName' || field === 'serviceDetails') {
      setInputValues(prev => ({ ...prev, [field]: value }));
      setInputs(prev => ({ ...prev, [field]: value }));
    } else if (field === 'contractPeriod') {
      setInputValues(prev => ({ ...prev, [field]: value }));
      const numValue = parseInt(value) || 0;
      setInputs(prev => ({ ...prev, [field]: numValue }));
    } else {
      // For currency fields, format the display value with thousands separators
      const formattedValue = formatInputCurrency(value);
      setInputValues(prev => ({ ...prev, [field]: formattedValue }));
      const numValue = parseCurrency(value);
      setInputs(prev => ({ ...prev, [field]: numValue }));
    }
  };

  const handlePeriodTypeChange = (value: string) => {
    setPeriodType(value);
    if (value !== 'custom') {
      const months = parseInt(value);
      setInputValues(prev => ({ ...prev, contractPeriod: months.toString() }));
      setInputs(prev => ({ ...prev, contractPeriod: months }));
      setCustomPeriod("");
    }
  };

  const handleCustomPeriodChange = (value: string) => {
    setCustomPeriod(value);
    setInputValues(prev => ({ ...prev, contractPeriod: value }));
    const numValue = parseInt(value) || 0;
    setInputs(prev => ({ ...prev, contractPeriod: numValue }));
  };

  const calculateAnalysis = () => {
    if (inputs.customerName.trim() !== "" && inputs.investmentCost > 0 && inputs.monthlyRevenue > 0 && inputs.contractPeriod > 0 && inputs.otcCost >= 0) {
      const calculatedResults = calculateFinancialAnalysis(inputs);
      setResults(calculatedResults);
    }
  };

  const exportToExcel = (results: CalculationResults, inputs: FinancialInputs) => {
    const wb = XLSX.utils.book_new();
    
    // Input Summary Sheet
    const inputData = [
      ['Parameter', 'Nilai'],
      ['Nama Pelanggan', inputs.customerName],
      ['Biaya Investasi (BOQ)', formatCurrency(inputs.investmentCost)],
      ['Pendapatan per Bulan', formatCurrency(inputs.monthlyRevenue)],
      ['Periode (Bulan)', inputs.contractPeriod],
      ['Biaya OTC', formatCurrency(inputs.otcCost)],
      ['WACC', '15%'],
      ['Tax', '22%'],
      ['', ''],
      ['Hasil Perhitungan', ''],
      ['Total Revenue', formatCurrency(results.totalRevenue)],
      ['OTC Revenue', formatCurrency(results.otcRevenue)],
      ['Monthly Total', formatCurrency(results.monthlyTotal)],
      ['Cost IBL', formatCurrency(results.costIBL)],
      ['Cost OBL', formatCurrency(results.costOBL)],
      ['Total OPEX', formatCurrency(results.totalOpex)],
      ['NPV', formatCurrency(results.npv)],
      ['IRR', formatPercentage(results.irr)],
      ['Payback Period', `${results.paybackPeriod.years} tahun ${results.paybackPeriod.months} bulan`]
    ];
    
    const wsInput = XLSX.utils.aoa_to_sheet(inputData);
    XLSX.utils.book_append_sheet(wb, wsInput, 'Input & Summary');
    
    // COGS Sheet (matching CogsTable)
    const cogsHeaders = ['Label', 'Jumlah', ...results.cogsProjections.map((_, i) => `Tahun ke-${i}`)];
    const cogsData = [
      cogsHeaders,
      ['COGS OTC', formatCurrency(results.cogsProjections.reduce((sum, p) => sum + p.otcCogs, 0)), ...results.cogsProjections.map(p => formatCurrency(p.otcCogs))],
      ['COGS Bulanan', formatCurrency(results.cogsProjections.reduce((sum, p) => sum + p.monthlyCogs, 0)), ...results.cogsProjections.map(p => formatCurrency(p.monthlyCogs))],
      ['Total COGS', formatCurrency(results.cogsProjections.reduce((sum, p) => sum + p.totalCogs, 0)), ...results.cogsProjections.map(p => formatCurrency(p.totalCogs))]
    ];
    
    const wsCogs = XLSX.utils.aoa_to_sheet(cogsData);
    XLSX.utils.book_append_sheet(wb, wsCogs, 'COGS');
    
    // OPEX Breakdown Sheet (matching OpexTable)
    const opexHeaders = ['Label', 'Jumlah', ...results.opexProjections.map((_, i) => `Tahun ke-${i}`)];
    const opexData = [
      opexHeaders,
      ['Marketing Cost', formatCurrency(results.opexProjections.reduce((sum, p) => sum + p.marketingCost, 0)), ...results.opexProjections.map(p => formatCurrency(p.marketingCost))],
      ['Operational Cost', formatCurrency(results.opexProjections.reduce((sum, p) => sum + p.operationalCost, 0)), ...results.opexProjections.map(p => formatCurrency(p.operationalCost))],
      ['Total OPEX', formatCurrency(results.opexProjections.reduce((sum, p) => sum + p.totalOpex, 0)), ...results.opexProjections.map(p => formatCurrency(p.totalOpex))]
    ];
    
    const wsOpex = XLSX.utils.aoa_to_sheet(opexData);
    XLSX.utils.book_append_sheet(wb, wsOpex, 'OPEX Breakdown');
    
    // Revenue & P&L Summary Sheet (matching PLSummaryTable)
    const plSummaryHeaders = ['Metrics', 'Total', ...results.yearlyProjections.slice(1).map((_, i) => `Tahun ${i + 1}`)];
    
    // Calculate totals excluding year 0 to match web interface columns
    const revenueTotal = results.yearlyProjections.slice(1).reduce((sum, p) => sum + p.revenue, 0);
    const cogsTotal = results.cogsProjections.slice(1).reduce((sum, p) => sum + p.totalCogs, 0);
    const depreciationTotal = results.yearlyProjections.slice(1).reduce((sum, p) => sum + p.depreciation, 0);
    const grossProfitTotal = revenueTotal - cogsTotal;
    const netIncomeTotal = results.yearlyProjections.slice(1).reduce((sum, p) => sum + p.netIncome, 0);
    const grossMarginTotal = revenueTotal > 0 ? (grossProfitTotal / revenueTotal) : 0;
    const niMarginTotal = revenueTotal > 0 ? (netIncomeTotal / revenueTotal) : 0;
    
    const plSummaryData = [
      plSummaryHeaders,
      ['Revenue', formatCurrency(revenueTotal), ...results.yearlyProjections.slice(1).map(p => formatCurrency(p.revenue))],
      ['Direct Cost (COGS)', formatCurrency(cogsTotal), ...results.cogsProjections.slice(1).map(p => formatCurrency(p.totalCogs))],
      ['Depresiasi', formatCurrency(depreciationTotal), ...results.yearlyProjections.slice(1).map(p => formatCurrency(p.depreciation))],
      ['Gross Profit (GP)', formatCurrency(grossProfitTotal), ...results.yearlyProjections.slice(1).map((proj, index) => {
        const yearlyGrossProfit = proj.revenue - (results.cogsProjections[index + 1]?.totalCogs || 0);
        return formatCurrency(yearlyGrossProfit);
      })],
      ['GP Margin', formatPercentage(grossMarginTotal), ...results.yearlyProjections.slice(1).map((proj, index) => {
        const yearlyRevenue = proj.revenue;
        const yearlyCogs = results.cogsProjections[index + 1]?.totalCogs || 0;
        const yearlyGrossProfit = yearlyRevenue - yearlyCogs;
        const yearlyMargin = yearlyRevenue > 0 ? (yearlyGrossProfit / yearlyRevenue) : 0;
        return formatPercentage(yearlyMargin);
      })],
      ['Net Income (NI)', formatCurrency(netIncomeTotal), ...results.yearlyProjections.slice(1).map(p => formatCurrency(p.netIncome))],
      ['NI Margin', formatPercentage(niMarginTotal), ...results.yearlyProjections.slice(1).map((proj) => {
        const margin = proj.revenue > 0 ? (proj.netIncome / proj.revenue) : 0;
        return formatPercentage(margin);
      })]
    ];
    
    const wsPLSummary = XLSX.utils.aoa_to_sheet(plSummaryData);
    XLSX.utils.book_append_sheet(wb, wsPLSummary, 'Revenue & PL Summary');
    
    // Cash Flow Summary Sheet (matching CashFlowSummaryTable)
    const calculatePVOfFCF = (fcf: number, year: number, discountRate: number = 0.15) => {
      if (year === 0) return fcf;
      return fcf / Math.pow(1 + discountRate, year);
    };
    
    const cfSummaryHeaders = ['Cash Flow Metrics', 'Total', ...results.cashFlowProjections.slice(1).map((_, i) => `Tahun ${i + 1}`)];
    
    // Calculate totals excluding year 0 to match web interface columns
    const cashInflowTotal = results.cashFlowProjections.slice(1).reduce((sum, proj) => sum + proj.totalCashInflow, 0);
    const capexTotal = results.cashFlowProjections.slice(1).reduce((sum, proj) => sum + proj.capex, 0);
    const fcfTotal = results.cashFlowProjections.slice(1).reduce((sum, proj) => sum + proj.netCashFlow, 0);
    const pvFCFTotal = results.cashFlowProjections.slice(1).reduce((sum, proj) => sum + calculatePVOfFCF(proj.netCashFlow, proj.year), 0);
    
    const cfSummaryData = [
      cfSummaryHeaders,
      ['EBIT+ (after tax)', formatCurrency(cashInflowTotal), ...results.cashFlowProjections.slice(1).map(cf => formatCurrency(cf.totalCashInflow))],
      ['Investment (CAPEX)', formatCurrency(capexTotal), ...results.cashFlowProjections.slice(1).map(cf => formatCurrency(cf.capex))],
      ['Free Cash Flow', formatCurrency(fcfTotal), ...results.cashFlowProjections.slice(1).map(cf => formatCurrency(cf.netCashFlow))],
      ['WACC Discount Rate', '15%', ...results.cashFlowProjections.slice(1).map(() => '15%')],
      ['PV (Present Value) of FCF', formatCurrency(pvFCFTotal), ...results.cashFlowProjections.slice(1).map(cf => formatCurrency(calculatePVOfFCF(cf.netCashFlow, cf.year)))]
    ];
    
    const wsCFSummary = XLSX.utils.aoa_to_sheet(cfSummaryData);
    XLSX.utils.book_append_sheet(wb, wsCFSummary, 'Cash Flow Summary');
    
    // Detailed Profit & Loss Sheet (matching ProfitLossTable)
    const plHeaders = ['Label', 'Jumlah', ...results.yearlyProjections.map((_, i) => `Tahun ke-${i}`)];
    const plData = [
      plHeaders,
      ['Revenue', formatCurrency(results.yearlyProjections.reduce((sum, p) => sum + p.revenue, 0)), ...results.yearlyProjections.map(p => formatCurrency(p.revenue))],
      ['Bad Debt', formatCurrency(results.yearlyProjections.reduce((sum, p) => sum + p.badDebt, 0)), ...results.yearlyProjections.map(p => formatCurrency(p.badDebt))],
      ['OPEX', formatCurrency(results.yearlyProjections.reduce((sum, p) => sum + p.opex, 0)), ...results.yearlyProjections.map(p => formatCurrency(p.opex))],
      ['EBITDA', formatCurrency(results.yearlyProjections.reduce((sum, p) => sum + p.ebitda, 0)), ...results.yearlyProjections.map(p => formatCurrency(p.ebitda))],
      ['Depresiasi', formatCurrency(results.yearlyProjections.reduce((sum, p) => sum + p.depreciation, 0)), ...results.yearlyProjections.map(p => formatCurrency(p.depreciation))],
      ['EBIT', formatCurrency(results.yearlyProjections.reduce((sum, p) => sum + p.ebit, 0)), ...results.yearlyProjections.map(p => formatCurrency(p.ebit))],
      ['Pajak', formatCurrency(results.yearlyProjections.reduce((sum, p) => sum + p.tax, 0)), ...results.yearlyProjections.map(p => formatCurrency(p.tax))],
      ['Net Income', formatCurrency(results.yearlyProjections.reduce((sum, p) => sum + p.netIncome, 0)), ...results.yearlyProjections.map(p => formatCurrency(p.netIncome))]
    ];
    
    const wsPL = XLSX.utils.aoa_to_sheet(plData);
    XLSX.utils.book_append_sheet(wb, wsPL, 'Detailed PL');
    
    // Detailed Cash Flow Sheet (matching CashFlowTable)
    const cfHeaders = ['Label', 'Jumlah', ...results.cashFlowProjections.map((_, i) => `Tahun ke-${i}`)];
    const cfData = [
      cfHeaders,
      ['Net Income', formatCurrency(results.cashFlowProjections.reduce((sum, p) => sum + p.netIncome, 0)), ...results.cashFlowProjections.map(p => formatCurrency(p.netIncome))],
      ['Add Back Depresiasi', formatCurrency(results.cashFlowProjections.reduce((sum, p) => sum + p.addBackDepreciation, 0)), ...results.cashFlowProjections.map(p => formatCurrency(p.addBackDepreciation))],
      ['TOTAL CASH INFLOW', formatCurrency(results.cashFlowProjections.reduce((sum, p) => sum + p.totalCashInflow, 0)), ...results.cashFlowProjections.map(p => formatCurrency(p.totalCashInflow))],
      ['CAPEX', formatCurrency(results.cashFlowProjections.reduce((sum, p) => sum + p.capex, 0)), ...results.cashFlowProjections.map(p => formatCurrency(p.capex))],
      ['Net Cash Flow', formatCurrency(results.cashFlowProjections.reduce((sum, p) => sum + p.netCashFlow, 0)), ...results.cashFlowProjections.map(p => formatCurrency(p.netCashFlow))],
      ['Cum Cash Flow', formatCurrency(results.cashFlowProjections.length > 0 ? results.cashFlowProjections[results.cashFlowProjections.length - 1].cumulativeCashFlow : 0), ...results.cashFlowProjections.map(p => formatCurrency(p.cumulativeCashFlow))]
    ];
    
    const wsCF = XLSX.utils.aoa_to_sheet(cfData);
    XLSX.utils.book_append_sheet(wb, wsCF, 'Detailed Cash Flow');
    
    // NPV Analysis Sheet (matching NPVAnalysisTable)
    const npvAnalysisHeaders = ['Analisis Kelayakan', 'Nilai', ...results.cashFlowProjections.slice(1).map((_, i) => `Tahun ${i + 1}`)];
    const npvAnalysisData = [
      npvAnalysisHeaders,
      ['NPV', formatCurrency(results.npv), ...results.cashFlowProjections.slice(1).map(() => '-')],
      ['IRR', formatPercentage(results.irr), ...results.cashFlowProjections.slice(1).map(() => '-')],
      ['Payback Period', `${results.paybackPeriod.years} tahun ${results.paybackPeriod.months} bulan`, ...results.cashFlowProjections.slice(1).map(() => '-')]
    ];
    
    const wsNPVAnalysis = XLSX.utils.aoa_to_sheet(npvAnalysisData);
    XLSX.utils.book_append_sheet(wb, wsNPVAnalysis, 'NPV Analysis');
    
    // Feasibility Analysis Sheet (matching FeasibilityAnalysisTable)
    const npvStatus = results.npv > 0 ? 'Layak' : 'Tidak Layak';
    const irrStatus = results.irr >= 0.15 ? 'Layak' : 'Tidak Layak';
    
    const feasibilityData = [
      ['Metrics', 'Value', 'Status'],
      ['NPV', formatCurrency(results.npv), npvStatus],
      ['IRR', formatPercentage(results.irr), irrStatus],
      ['', '', ''],
      ['Kesimpulan', '', ''],
      ['Kelayakan Investasi', results.isViable ? 'LAYAK' : 'TIDAK LAYAK', results.isViable ? 'Investasi direkomendasikan' : 'Investasi tidak direkomendasikan']
    ];
    
    const wsFeasibility = XLSX.utils.aoa_to_sheet(feasibilityData);
    XLSX.utils.book_append_sheet(wb, wsFeasibility, 'Feasibility Analysis');
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'Analisis_Kelayakan_Investasi.xlsx');
  };


  useEffect(() => {
    if (inputs.customerName.trim() !== "" && inputs.investmentCost > 0 && inputs.monthlyRevenue > 0 && inputs.contractPeriod > 0 && inputs.otcCost >= 0) {
      calculateAnalysis();
    }
  }, [inputs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="page-title">
            Analisis Kelayakan Investasi
          </h1>
          <p className="text-muted-foreground">Sistem Perhitungan Finansial untuk Evaluasi Proyek</p>
        </div>

        {/* Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Parameter Input</CardTitle>
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-toggle-fixed-params"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Parameter Tetap
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 sm:w-96">
                  <SheetHeader className="mb-6">
                    <SheetTitle>Parameter Tetap</SheetTitle>
                    <SheetDescription>Parameter perhitungan yang digunakan dalam analisis</SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-120px)]">
                    <div className="space-y-4 pr-4">
                      <div>
                        <Label className="block text-sm text-muted-foreground mb-2">WACC (Discount Rate)</Label>
                        <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium" data-testid="wacc-value">
                          15%
                        </div>
                      </div>
                      <div>
                        <Label className="block text-sm text-muted-foreground mb-2">Tax Rate</Label>
                        <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium" data-testid="tax-value">
                          22%
                        </div>
                      </div>
                      <div>
                        <Label className="block text-sm text-muted-foreground mb-2">COGS Margin</Label>
                        <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium" data-testid="cogs-margin-value">
                          70%
                        </div>
                      </div>
                      <div>
                        <Label className="block text-sm text-muted-foreground mb-2">Bad Debt Rate</Label>
                        <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium" data-testid="bad-debt-value">
                          5%
                        </div>
                      </div>
                      <div>
                        <Label className="block text-sm text-muted-foreground mb-2">Depreciation Period</Label>
                        <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium" data-testid="depreciation-value">
                          5 Tahun
                        </div>
                      </div>
                      <div>
                        <Label className="block text-sm text-muted-foreground mb-2">Marketing Cost Rate</Label>
                        <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium" data-testid="marketing-cost-value">
                          30%
                        </div>
                      </div>
                      <div>
                        <Label className="block text-sm text-muted-foreground mb-2">Operational Cost Rate</Label>
                        <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium" data-testid="operational-cost-value">
                          20%
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </CardHeader>
          <CardContent>
            {/* Variable Inputs Section */}
            <div>
              <h3 className="font-medium text-foreground mb-4">Input Variabel</h3>
              
              {/* 3x3 Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Row 1: Nama Pelanggan | Total BOQ Biaya Investasi | Periode Kontrak */}
                <div>
                  <Label htmlFor="customer-name" className="block text-sm font-medium text-foreground mb-2">
                    Nama Pelanggan
                  </Label>
                  <Input
                    type="text"
                    id="customer-name"
                    placeholder="Masukkan nama pelanggan"
                    value={inputValues.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    className="w-full"
                    data-testid="input-customer-name"
                  />
                </div>

                <div>
                  <Label htmlFor="investment" className="block text-sm font-medium text-foreground mb-2">
                    Total BOQ Biaya Investasi
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                    <Input
                      type="text"
                      id="investment"
                      placeholder="0"
                      value={inputValues.investmentCost}
                      onChange={(e) => handleInputChange('investmentCost', e.target.value)}
                      className="currency-input pl-8"
                      data-testid="input-investment"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="period" className="block text-sm font-medium text-foreground mb-2">
                    Periode Kontrak
                  </Label>
                  <div className="space-y-2">
                    <Select value={periodType} onValueChange={handlePeriodTypeChange} data-testid="input-period">
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih periode kontrak" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 Bulan</SelectItem>
                        <SelectItem value="24">24 Bulan</SelectItem>
                        <SelectItem value="36">36 Bulan</SelectItem>
                        <SelectItem value="48">48 Bulan</SelectItem>
                        <SelectItem value="60">60 Bulan</SelectItem>
                        <SelectItem value="72">72 Bulan</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {periodType === 'custom' && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="0"
                          value={customPeriod}
                          onChange={(e) => handleCustomPeriodChange(e.target.value)}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">bulan</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Jenis & Detail Layanan | Biaya Bulanan | Biaya Aktivasi */}
                <div>
                  <Label htmlFor="service-details" className="block text-sm font-medium text-foreground mb-2">
                    Jenis & Detail Layanan
                  </Label>
                  <Input
                    type="text"
                    id="service-details"
                    placeholder="Contoh : Astinet 100 Mbps"
                    value={inputValues.serviceDetails}
                    onChange={(e) => handleInputChange('serviceDetails', e.target.value)}
                    className="w-full"
                    data-testid="input-service-details"
                  />
                </div>

                <div>
                  <Label htmlFor="revenue" className="block text-sm font-medium text-foreground mb-2">
                    Biaya Bulanan
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                    <Input
                      type="text"
                      id="revenue"
                      placeholder="0"
                      value={inputValues.monthlyRevenue}
                      onChange={(e) => handleInputChange('monthlyRevenue', e.target.value)}
                      className="currency-input pl-8"
                      data-testid="input-revenue"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="otc-cost" className="block text-sm font-medium text-foreground mb-2">
                    Biaya Aktivasi
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                    <Input
                      type="text"
                      id="otc-cost"
                      placeholder="0"
                      value={inputValues.otcCost}
                      onChange={(e) => handleInputChange('otcCost', e.target.value)}
                      className="currency-input pl-8"
                      data-testid="input-otc-cost"
                    />
                  </div>
                </div>

                {/* Row 3: Button | Total Revenue Bulanan | Total Biaya Aktivasi */}
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="default"
                    className="w-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-slate-800 text-white font-medium"
                    data-testid="button-add-service"
                  >
                    ⊕ Tambah Layanan Lainnya
                  </Button>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">
                    Total Revenue Bulanan
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                    <Input
                      type="text"
                      value={inputs.monthlyRevenue > 0 ? formatCurrency(inputs.monthlyRevenue) : formatCurrency(0)}
                      readOnly
                      className="currency-input pl-8 bg-muted/30 text-muted-foreground cursor-not-allowed"
                      data-testid="display-total-monthly-revenue"
                    />
                  </div>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">
                    Total Biaya Aktivasi
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                    <Input
                      type="text"
                      value={inputs.otcCost > 0 ? formatCurrency(inputs.otcCost) : formatCurrency(0)}
                      readOnly
                      className="currency-input pl-8 bg-muted/30 text-muted-foreground cursor-not-allowed"
                      data-testid="display-total-activation-cost"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Excel Download Button - Moved to Top */}
            {results && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex justify-center">
                  <Button 
                    onClick={() => exportToExcel(results, inputs)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium flex items-center gap-2"
                    data-testid="button-export-excel"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm2 4h8v2H6V6zm0 4h8v2H6v-2zm0 4h8v2H6v-2z"/>
                    </svg>
                    Download Excel
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Results Section */}
        {results && (
          <div className="space-y-8">
            {/* General Information */}
            <Card>
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="text-lg font-semibold">Informasi Umum</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Revenue (Bruto)</span>
                      <div className="text-right">
                        <div className="font-medium" data-testid="info-total-revenue">
                          Total: <span className="font-bold">{formatCurrency(results.totalRevenue)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">OTC: {formatCurrency(results.otcRevenue)}</div>
                        <div className="text-sm text-muted-foreground">
                          Bulanan: {formatCurrency(inputs.monthlyRevenue)} x {inputs.contractPeriod} bulan = {formatCurrency(results.monthlyTotal)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">COGS (70% dari harga)</span>
                      <div className="text-right">
                        <div className="font-medium" data-testid="info-total-cogs">
                          Total: <span className="font-bold">{formatCurrency(results.totalCogs)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">OTC: {formatCurrency(results.otcCogs)}</div>
                        <div className="text-sm text-muted-foreground">
                          Bulanan: {formatCurrency(results.monthlyCogs)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Cost IBL</span>
                      <div className="text-right">
                        <div className="font-medium" data-testid="info-cost-ibl">
                          Total: <span className="font-bold">{formatCurrency(results.costIBL)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">OTC Akhir: {formatCurrency(results.otcRevenue)}</div>
                        <div className="text-sm text-muted-foreground">
                          Bulanan Akhir: {formatCurrency(inputs.monthlyRevenue)} x {inputs.contractPeriod} = {formatCurrency(results.monthlyTotal)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Cost OBL</span>
                      <div className="text-right">
                        <div className="font-medium" data-testid="info-cost-obl">
                          Total: <span className="font-bold">{formatCurrency(results.costOBL)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">OTC: Rp 0</div>
                        <div className="text-sm text-muted-foreground">Bulanan: Rp 0 x {inputs.contractPeriod} = Rp 0</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-accent p-4 rounded-md">
                      <div className="text-sm text-muted-foreground mb-2">OPEX (Operasional + Marketing)</div>
                      <div className="font-bold text-lg" data-testid="info-opex">
                        Total: ({formatCurrency(results.totalOpex)})
                      </div>
                      <div className="text-sm space-y-1 mt-2">
                        <div>Biaya Marketing: 30% dari revenue bulanan ({formatCurrency(results.marketingCost)})</div>
                        <div>Biaya Operasional: 20% dari total revenue ({formatCurrency(results.operationalCost)})</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* COGS Projection Table */}
            <Card>
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="text-lg font-semibold">Tabel Proyeksi COGS (Cost of Goods Sold)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CogsTable projections={results.cogsProjections} />
              </CardContent>
            </Card>

            {/* OPEX Projection Table */}
            <Card>
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="text-lg font-semibold">Tabel Proyeksi OPEX (Operating Expenses)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <OpexTable projections={results.opexProjections} />
              </CardContent>
            </Card>


            {/* Financial Summary Form */}
            <Card>
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="text-lg font-semibold">Ringkasan Analisis Keuangan</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Nilai CAPEX (Cost) */}
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">
                      Nilai CAPEX (Cost)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                      <Input
                        type="text"
                        value={formatCurrency(inputs.investmentCost).replace(/^Rp\s*/, '')}
                        readOnly
                        className="currency-input pl-8 bg-muted"
                        data-testid="output-capex"
                      />
                    </div>
                  </div>

                  {/* Nilai COGS and Nilai OPEX - side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-sm font-medium text-foreground mb-2">
                        Nilai COGS
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                        <Input
                          type="text"
                          value={formatCurrency(results.totalCogs).replace(/^Rp\s*/, '')}
                          readOnly
                          className="currency-input pl-8 bg-muted"
                          data-testid="output-cogs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-foreground mb-2">
                        Nilai OPEX
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                        <Input
                          type="text"
                          value={formatCurrency(results.totalOpex).replace(/^Rp\s*/, '')}
                          readOnly
                          className="currency-input pl-8 bg-muted"
                          data-testid="output-opex"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Estimasi Revenue */}
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">
                      Estimasi Revenue
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                      <Input
                        type="text"
                        value={formatCurrency(results.totalRevenue).replace(/^Rp\s*/, '')}
                        readOnly
                        className="currency-input pl-8 bg-muted"
                        data-testid="output-revenue"
                      />
                    </div>
                  </div>

                  {/* Gross Profit and Gross Profit Margin - side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-sm font-medium text-foreground mb-2">
                        Gross Profit
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                        <Input
                          type="text"
                          value={stripCurrencyPrefix(formatCurrency(results.grossProfit))}
                          readOnly
                          className="currency-input pl-8 bg-muted"
                          data-testid="output-gross-profit"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-foreground mb-2">
                        Gross Profit Margin
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={formatPercentage(results.grossProfitMargin).replace('%', '')}
                          readOnly
                          className="pr-8 bg-muted"
                          data-testid="output-gross-profit-margin"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Income and Net Income Margin - side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-sm font-medium text-foreground mb-2">
                        Net Income
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                        <Input
                          type="text"
                          value={stripCurrencyPrefix(formatCurrency(results.totalNetIncome))}
                          readOnly
                          className="currency-input pl-8 bg-muted"
                          data-testid="output-net-income"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-foreground mb-2">
                        Net Income Margin
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={formatPercentage(results.netIncomeMargin).replace('%', '')}
                          readOnly
                          className="pr-8 bg-muted"
                          data-testid="output-net-income-margin"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">%</span>
                      </div>
                    </div>
                  </div>

                  {/* NPV */}
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">
                      NPV
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                      <Input
                        type="text"
                        value={stripCurrencyPrefix(formatCurrency(results.npv))}
                        readOnly
                        className={`currency-input pl-8 ${results.npv > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                        data-testid="output-npv"
                      />
                    </div>
                  </div>

                  {/* Jangka Waktu, IRR, and Payback Period - three fields in one row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="block text-sm font-medium text-foreground mb-2">
                        Jangka Waktu
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={inputs.contractPeriod.toString()}
                          readOnly
                          className="pr-16 bg-muted"
                          data-testid="output-period"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Month</span>
                      </div>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-foreground mb-2">
                        IRR
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={formatPercentage(results.irr).replace('%', '')}
                          readOnly
                          className={`pr-8 ${results.irr >= 0.15 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                          data-testid="output-irr"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-foreground mb-2">
                        Payback Period
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={`${results.paybackPeriod.years}.${results.paybackPeriod.months}`}
                          readOnly
                          className="pr-16 bg-muted"
                          data-testid="output-payback-period"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Month</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Summary */}
                  <div className="mt-8 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border">
                    <h3 className="font-semibold text-foreground mb-3">Status Kelayakan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-3 rounded-md border ${
                        results.npv > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className={`font-medium text-sm ${
                          results.npv > 0 ? 'text-green-800' : 'text-red-800'
                        }`}>
                          NPV: {results.npv > 0 ? 'Layak' : 'Tidak Layak'}
                        </div>
                      </div>
                      <div className={`p-3 rounded-md border ${
                        results.irr >= 0.15 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className={`font-medium text-sm ${
                          results.irr >= 0.15 ? 'text-green-800' : 'text-red-800'
                        }`}>
                          IRR: {results.irr >= 0.15 ? 'Layak' : 'Tidak Layak'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Revenue & P&L Summary Table */}
            <Card>
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="text-lg font-semibold">Revenue & P&L Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <PLSummaryTable results={results} />
              </CardContent>
            </Card>

            {/* Cash Flow Summary Table */}
            <Card>
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="text-lg font-semibold">Cash Flow Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CashFlowSummaryTable results={results} />
              </CardContent>
            </Card>

            {/* NPV Analysis Table */}
            <Card>
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="text-lg font-semibold">Analisis NPV, IRR & Payback Period</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <NPVAnalysisTable results={results} />
              </CardContent>
            </Card>

            {/* Feasibility Analysis Table */}
            <Card>
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="text-lg font-semibold">Feasibility Analysis</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <FeasibilityAnalysisTable results={results} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}