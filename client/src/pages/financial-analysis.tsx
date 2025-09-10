import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfitLossTable, CashFlowTable, CogsTable } from "@/components/financial-tables";
import { calculateFinancialAnalysis, type FinancialInputs, type CalculationResults } from "@/lib/financial-calculations";
import { formatCurrency, formatPercentage, parseCurrency } from "@/lib/currency-utils";
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
    setInputValues(prev => ({ ...prev, [field]: value }));
    
    if (field === 'customerName') {
      setInputs(prev => ({ ...prev, [field]: value }));
    } else if (field === 'contractPeriod') {
      const numValue = parseInt(value) || 0;
      setInputs(prev => ({ ...prev, [field]: numValue }));
    } else {
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
      ['WACC', '17.8%'],
      ['Tax', '11%'],
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
                      17.8%
                    </div>
                  </div>
                  <div>
                    <Label className="block text-sm text-muted-foreground">Tax</Label>
                    <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium" data-testid="tax-value">
                      11%
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
                    <Input
                      type="text"
                      id="investment"
                      placeholder="Rp 0"
                      value={inputValues.investmentCost}
                      onChange={(e) => handleInputChange('investmentCost', e.target.value)}
                      className="currency-input"
                      data-testid="input-investment"
                    />
                  </div>
                  <div>
                    <Label htmlFor="revenue" className="block text-sm font-medium text-foreground mb-2">
                      Pendapatan per Bulan
                    </Label>
                    <Input
                      type="text"
                      id="revenue"
                      placeholder="Rp 0"
                      value={inputValues.monthlyRevenue}
                      onChange={(e) => handleInputChange('monthlyRevenue', e.target.value)}
                      className="currency-input"
                      data-testid="input-revenue"
                    />
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
                    <Input
                      type="text"
                      id="otc-cost"
                      placeholder="Rp 0"
                      value={inputValues.otcCost}
                      onChange={(e) => handleInputChange('otcCost', e.target.value)}
                      className="currency-input"
                      data-testid="input-otc-cost"
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
                        50% | ({formatCurrency(results.totalOpex)})
                      </div>
                      <div className="text-sm space-y-1 mt-2">
                        <div>Biaya Marketing: 30% ({formatCurrency(results.marketingCost)})</div>
                        <div>Biaya Operasional: 20% ({formatCurrency(results.operationalCost)})</div>
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

            {/* Feasibility Analysis */}
            <Card>
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="text-lg font-semibold">Feasibility Analysis</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-green-800">NPV (Net Present Value)</h3>
                          <p className="text-sm text-green-600 mt-1">Nilai sekarang dari arus kas masa depan</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-800 positive-metric" data-testid="npv-value">
                            {formatCurrency(results.npv)}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            results.npv > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`} data-testid="npv-status">
                            {results.npv > 0 ? 'Layak' : 'Tidak Layak'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-blue-800">IRR (Internal Rate of Return)</h3>
                          <p className="text-sm text-blue-600 mt-1">Tingkat pengembalian internal investasi</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-800 positive-metric" data-testid="irr-value">
                            {formatPercentage(results.irr)}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            results.irr > 17.8 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`} data-testid="irr-status">
                            {results.irr > 17.8 ? 'Layak' : 'Tidak Layak'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Interpretation</h3>
                    <div className="space-y-3 text-sm">
                      <div className={`p-4 rounded-lg border ${
                        results.npv > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className={`font-medium mb-1 ${
                          results.npv > 0 ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {results.npv > 0 ? '✓ NPV Positif' : '✗ NPV Negatif'}
                        </div>
                        <p className={results.npv > 0 ? 'text-green-700' : 'text-red-700'}>
                          {results.npv > 0 
                            ? 'Investasi menghasilkan nilai lebih besar dari biaya modal, proyek layak dilakukan.'
                            : 'Investasi tidak menghasilkan nilai yang cukup, proyek tidak layak dilakukan.'
                          }
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg border ${
                        results.irr > 17.8 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className={`font-medium mb-1 ${
                          results.irr > 17.8 ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {results.irr > 17.8 ? '✓ IRR > WACC' : '✗ IRR < WACC'}
                        </div>
                        <p className={results.irr > 17.8 ? 'text-green-700' : 'text-red-700'}>
                          IRR ({formatPercentage(results.irr)}) {results.irr > 17.8 ? 'lebih besar' : 'lebih kecil'} dari WACC (17.8%), 
                          {results.irr > 17.8 ? ' menunjukkan tingkat pengembalian yang menarik.' : ' menunjukkan tingkat pengembalian yang tidak memadai.'}
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="font-medium text-blue-800 mb-1">Payback Period</div>
                        <div className="text-2xl font-bold text-blue-800 mb-2" data-testid="payback-period">
                          {results.paybackPeriod.years} tahun {results.paybackPeriod.months} bulan
                        </div>
                        <p className="text-blue-700 text-sm">
                          Investasi akan kembali dalam {results.paybackPeriod.totalMonths} bulan
                        </p>
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