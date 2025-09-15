import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfitLossTable, CashFlowTable, CogsTable } from "@/components/financial-tables";
import { calculateFinancialAnalysis, type FinancialInputs, type CalculationResults } from "@/lib/financial-calculations";
import { formatCurrency, formatPercentage, parseCurrency, formatInputCurrency } from "@/lib/currency-utils";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function FinancialAnalysis() {
  const [inputs, setInputs] = useState<FinancialInputs>({
    customerName: "",
    investmentCost: 0,
    monthlyRevenue: 0,
    contractPeriod: 0,
    otcCost: 0,
  });

  const [results, setResults] = useState<CalculationResults | null>(null);
  const [inputValues, setInputValues] = useState({
    customerName: "",
    investmentCost: "",
    monthlyRevenue: "",
    contractPeriod: "",
    otcCost: "",
  });

  const handleInputChange = (field: keyof FinancialInputs, value: string) => {
    if (field === 'customerName') {
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
    
    // Profit & Loss Sheet
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
    XLSX.utils.book_append_sheet(wb, wsPL, 'Profit & Loss');
    
    // Cash Flow Sheet
    const cfHeaders = ['Label', 'Jumlah', ...results.cashFlowProjections.map((_, i) => `Tahun ke-${i}`)];
    const cfData = [
      cfHeaders,
      ['Net Income', formatCurrency(results.cashFlowProjections.reduce((sum, p) => sum + p.netIncome, 0)), ...results.cashFlowProjections.map(p => formatCurrency(p.netIncome))],
      ['Add Back Depresiasi', formatCurrency(results.cashFlowProjections.reduce((sum, p) => sum + p.addBackDepreciation, 0)), ...results.cashFlowProjections.map(p => formatCurrency(p.addBackDepreciation))],
      ['TOTAL CASH INFLOW', formatCurrency(results.cashFlowProjections.reduce((sum, p) => sum + p.totalCashInflow, 0)), ...results.cashFlowProjections.map(p => formatCurrency(p.totalCashInflow))],
      ['CAPEX', formatCurrency(results.cashFlowProjections.reduce((sum, p) => sum + p.capex, 0)), ...results.cashFlowProjections.map(p => formatCurrency(p.capex))],
      ['Net Cash Flow', formatCurrency(results.cashFlowProjections.reduce((sum, p) => sum + p.netCashFlow, 0)), ...results.cashFlowProjections.map(p => formatCurrency(p.netCashFlow))],
      ['Cum Cash Flow', '', ...results.cashFlowProjections.map(p => formatCurrency(p.cumulativeCashFlow))]
    ];
    
    const wsCF = XLSX.utils.aoa_to_sheet(cfData);
    XLSX.utils.book_append_sheet(wb, wsCF, 'Cash Flow');
    
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
            <CardTitle className="text-xl font-semibold">Parameter Input</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Fixed Parameters */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Parameter Tetap</h3>
                <div className="space-y-2">
                  <div>
                    <Label className="block text-sm text-muted-foreground">WACC</Label>
                    <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium" data-testid="wacc-value">
                      15%
                    </div>
                  </div>
                  <div>
                    <Label className="block text-sm text-muted-foreground">Tax</Label>
                    <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium" data-testid="tax-value">
                      22%
                    </div>
                  </div>
                </div>
              </div>

              {/* User Inputs */}
              <div className="lg:col-span-3">
                <h3 className="font-medium text-foreground mb-4">Input Variabel</h3>
                
                {/* Customer Name Input */}
                <div className="mb-6">
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="investment" className="block text-sm font-medium text-foreground mb-2">
                      Biaya Investasi (BOQ)
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
                    <Label htmlFor="revenue" className="block text-sm font-medium text-foreground mb-2">
                      Pendapatan per Bulan
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
                    <Label htmlFor="period" className="block text-sm font-medium text-foreground mb-2">
                      Periode (Bulan)
                    </Label>
                    <Input
                      type="number"
                      id="period"
                      placeholder="0"
                      value={inputValues.contractPeriod}
                      onChange={(e) => handleInputChange('contractPeriod', e.target.value)}
                      data-testid="input-period"
                    />
                  </div>
                  <div>
                    <Label htmlFor="otc-cost" className="block text-sm font-medium text-foreground mb-2">
                      Biaya OTC
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

            {/* Profit & Loss Projection Table */}
            <Card>
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="text-lg font-semibold">Tabel Proyeksi Profit & Loss (Terformat)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ProfitLossTable projections={results.yearlyProjections} />
              </CardContent>
            </Card>

            {/* Cash Flow Projection */}
            <Card>
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="text-lg font-semibold">Cash Flow Projection</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CashFlowTable projections={results.cashFlowProjections} />
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
                        value={formatCurrency(inputs.investmentCost).replace('Rp ', '')}
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
                          value={formatCurrency(results.totalCogs).replace('Rp ', '')}
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
                          value={formatCurrency(results.totalOpex).replace('Rp ', '')}
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
                        value={formatCurrency(results.totalRevenue).replace('Rp ', '')}
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
                          value={formatCurrency(results.grossProfit).replace('Rp ', '')}
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
                          value={formatCurrency(results.totalNetIncome).replace('Rp ', '')}
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
                        value={formatCurrency(results.npv).replace('Rp ', '')}
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
                          className={`pr-8 ${results.irr > 15 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
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
                        results.irr > 15 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className={`font-medium text-sm ${
                          results.irr > 15 ? 'text-green-800' : 'text-red-800'
                        }`}>
                          IRR: {results.irr > 15 ? 'Layak' : 'Tidak Layak'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}