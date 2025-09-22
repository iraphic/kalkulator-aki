import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings } from "lucide-react";
import { CogsTable, OpexTable, PLSummaryTable, CashFlowSummaryTable, NPVAnalysisTable, FeasibilityAnalysisTable } from "@/components/financial-tables";
import { calculateFinancialAnalysis, type FinancialInputs, type CalculationResults, type Service } from "@/lib/financial-calculations";
import { formatCurrency, formatPercentage, parseCurrency, formatInputCurrency, stripCurrencyPrefix } from "@/lib/currency-utils";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function FinancialAnalysis() {
  const [inputs, setInputs] = useState<FinancialInputs>({
    customerName: "",
    investmentCost: 0,
    contractPeriod: 0,
    services: [{
      id: "1",
      serviceDetails: "",
      monthlyRevenue: 0,
      otcCost: 0,
      bandwidth: "",
      quantity: 0,
      unit: "",
    }],
  });

  const [results, setResults] = useState<CalculationResults | null>(null);
  const [inputValues, setInputValues] = useState({
    customerName: "",
    investmentCost: "",
    contractPeriod: "",
    services: [{
      id: "1",
      serviceDetails: "",
      monthlyRevenue: "",
      otcCost: "",
      bandwidth: "",
      quantity: "",
      unit: "",
    }],
  });

  const [periodType, setPeriodType] = useState<string>("");
  const [customPeriod, setCustomPeriod] = useState<string>("");


  const handleInputChange = (field: keyof Pick<FinancialInputs, 'customerName' | 'investmentCost' | 'contractPeriod'>, value: string) => {
    if (field === 'customerName') {
      setInputValues(prev => ({ ...prev, [field]: value }));
      setInputs(prev => ({ ...prev, [field]: value }));
    } else if (field === 'contractPeriod') {
      setInputValues(prev => ({ ...prev, [field]: value }));
      const numValue = parseInt(value) || 0;
      setInputs(prev => ({ ...prev, [field]: numValue }));
    } else if (field === 'investmentCost') {
      // For currency fields, format the display value with thousands separators
      const formattedValue = formatInputCurrency(value);
      setInputValues(prev => ({ ...prev, [field]: formattedValue }));
      const numValue = parseCurrency(value);
      setInputs(prev => ({ ...prev, [field]: numValue }));
    }
  };

  const handleServiceChange = (serviceId: string, field: keyof Service, value: string) => {
    // Update display values
    setInputValues(prev => ({
      ...prev,
      services: prev.services.map(service =>
        service.id === serviceId
          ? {
              ...service,
              [field]: (field === 'serviceDetails' || field === 'bandwidth' || field === 'unit') 
                ? value 
                : field === 'quantity'
                  ? value // quantity is displayed as string in input
                  : formatInputCurrency(value) // monthlyRevenue and otcCost
            }
          : service
      )
    }));

    // Update actual values
    setInputs(prev => ({
      ...prev,
      services: prev.services.map(service =>
        service.id === serviceId
          ? {
              ...service,
              [field]: (field === 'serviceDetails' || field === 'bandwidth' || field === 'unit')
                ? value 
                : field === 'quantity'
                  ? parseInt(value) || 0 // quantity is stored as number
                  : parseCurrency(value) // monthlyRevenue and otcCost
            }
          : service
      )
    }));
  };

  const addService = () => {
    const newId = Date.now().toString();
    const newService = {
      id: newId,
      serviceDetails: "",
      monthlyRevenue: 0,
      otcCost: 0,
      bandwidth: "",
      quantity: 0,
      unit: "",
    };
    const newServiceDisplay = {
      id: newId,
      serviceDetails: "",
      monthlyRevenue: "",
      otcCost: "",
      bandwidth: "",
      quantity: "",
      unit: "",
    };

    setInputs(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }));
    setInputValues(prev => ({
      ...prev,
      services: [...prev.services, newServiceDisplay]
    }));
  };

  const removeService = (serviceId: string) => {
    setInputs(prev => ({
      ...prev,
      services: prev.services.filter(service => service.id !== serviceId)
    }));
    setInputValues(prev => ({
      ...prev,
      services: prev.services.filter(service => service.id !== serviceId)
    }));
  };

  // Calculate totals for display
  const totalMonthlyRevenue = inputs.services.reduce((sum, service) => sum + service.monthlyRevenue, 0);
  const totalOtcCost = inputs.services.reduce((sum, service) => sum + service.otcCost, 0);

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
    const hasValidServices = inputs.services.length > 0 && inputs.services.some(service => 
      service.serviceDetails.trim() !== "" && (service.monthlyRevenue > 0 || service.otcCost > 0)
    );
    
    if (inputs.customerName.trim() !== "" && inputs.investmentCost > 0 && inputs.contractPeriod > 0 && hasValidServices) {
      const calculatedResults = calculateFinancialAnalysis(inputs);
      setResults(calculatedResults);
    }
  };

  const exportToExcel = (results: CalculationResults, inputs: FinancialInputs) => {
    const wb = XLSX.utils.book_new();
    
    // Calculate totals for services
    const totalMonthlyRevenue = inputs.services.reduce((sum, service) => sum + service.monthlyRevenue, 0);
    const totalOtcCost = inputs.services.reduce((sum, service) => sum + service.otcCost, 0);
    
    // Get current date for the cover sheet
    const currentDate = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Determine feasibility status for cover sheet
    const coverIrrStatus = results.irr >= 15 ? 'Feasible' : 'Not Feasible';
    const coverNpvStatus = results.npv > 0 ? 'Feasible' : 'Not Feasible';
    const recommendation = results.isViable ? 'Layak untuk diimplementasikan' : 'Tidak layak untuk diimplementasikan';
    
    // ===== SHEET 1: BUSINESS PLAN COVER SHEET =====
    const coverSheetData = [
      ['BUSINESS PLAN'],
      ['PT ...'],
      [''],
      ['C.TEL.1111/YN 000/R2W-C0100000/2025'],
      ['BO. 001/CAPEX BOARO/ AGUSTUS / 2025'],
      [''],
      [''],
      ['Nama/NIK', 'Jabatan', 'Tanggal', 'Tanda Tangan'],
      ['Dibuat Oleh', inputs.customerName, currentDate, ''],
      ['Diperiksa Oleh', 'Manager Vital Business Services/atara/Generilam', currentDate, ''],
      ['Disetujui Oleh', 'SMF RSO 1 TREG 2', currentDate, ''],
      [''],
      ['Resumen:'],
      ['Total Investasi', formatCurrency(inputs.investmentCost)],
      ['Pendapatan PSB', formatCurrency(results.otcRevenue)],
      ['Pendapatan Abonemen IBL', `${formatCurrency(totalMonthlyRevenue)} /bulan`],
      ['IRR', `${formatPercentage(results.irr)} ${coverIrrStatus}`],
      ['NPV', `${formatCurrency(results.npv)} ${coverNpvStatus}`],
      ['PAYBACK PERIODE', `${results.paybackPeriod.years} years ${results.paybackPeriod.months} months`],
      [''],
      ['Catatan:', ''],
      ['Rekomendasi:', recommendation]
    ];
    
    const wsCoverSheet = XLSX.utils.aoa_to_sheet(coverSheetData);
    
    // Apply formatting to the cover sheet
    // Set column widths
    wsCoverSheet['!cols'] = [
      { wch: 25 }, // Column A
      { wch: 35 }, // Column B
      { wch: 15 }, // Column C
      { wch: 15 }  // Column D
    ];
    
    // Merge cells for header
    if (!wsCoverSheet['!merges']) wsCoverSheet['!merges'] = [];
    wsCoverSheet['!merges'].push(
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // BUSINESS PLAN
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // PT ...
      { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, // Document number
      { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, // Subtitle
      { s: { r: 12, c: 0 }, e: { r: 12, c: 1 } }, // Resumen
      { s: { r: 20, c: 1 }, e: { r: 20, c: 3 } }, // Catatan space
      { s: { r: 21, c: 1 }, e: { r: 21, c: 3 } }  // Rekomendasi space
    );
    
    XLSX.utils.book_append_sheet(wb, wsCoverSheet, 'BUSINESS PLAN');
    
    // ===== SHEET 2: Detail Layanan (keep as is) =====
    const serviceDetailsData = [
      ['Detail Layanan - Input Komponen Layanan'],
      [''],
      ['No.', 'Jenis & Detail Layanan', 'Biaya Bulanan', 'Biaya Aktivasi (OTC)', 'Subtotal Bulanan', 'Subtotal OTC'],
      ...inputs.services.map((service, index) => [
        index + 1,
        service.serviceDetails || `Layanan ${index + 1}`,
        formatCurrency(service.monthlyRevenue),
        formatCurrency(service.otcCost),
        formatCurrency(service.monthlyRevenue),
        formatCurrency(service.otcCost)
      ]),
      [''],
      ['RINGKASAN TOTAL'],
      ['Total Layanan', inputs.services.length, '', '', '', ''],
      ['Total Biaya Bulanan', '', formatCurrency(totalMonthlyRevenue), '', formatCurrency(totalMonthlyRevenue), ''],
      ['Total Biaya Aktivasi (OTC)', '', '', formatCurrency(totalOtcCost), '', formatCurrency(totalOtcCost)],
      [''],
      ['KETERANGAN:'],
      ['• Biaya Bulanan: Pendapatan recurring per bulan dari layanan'],
      ['• Biaya Aktivasi (OTC): One Time Cost untuk aktivasi layanan'],
      ['• Subtotal: Kontribusi masing-masing layanan terhadap total pendapatan'],
      [''],
      ['PARAMETER PERHITUNGAN:'],
      ['• Periode Kontrak:', `${inputs.contractPeriod} bulan`],
      ['• Total Revenue (Lifetime):', formatCurrency(results.totalRevenue)],
      ['• OTC Revenue:', formatCurrency(results.otcRevenue)],
      ['• Monthly Revenue Total:', formatCurrency(results.monthlyTotal)]
    ];
    
    const wsServiceDetails = XLSX.utils.aoa_to_sheet(serviceDetailsData);
    XLSX.utils.book_append_sheet(wb, wsServiceDetails, 'Detail Layanan');
    
    // ===== SHEET 2: COGS+Opex+Ringkasan Analisis (combined sheet) =====
    const cogsOpexAnalysisData = [
      ['COGS+OPEX+RINGKASAN ANALISIS'],
      [''],
      
      // Parameter Input Section
      ['=== PARAMETER INPUT UTAMA ==='],
      ['Parameter', 'Nilai'],
      ['Nama Pelanggan', inputs.customerName],
      ['Biaya Investasi (BOQ)', formatCurrency(inputs.investmentCost)],
      ['Periode Kontrak (Bulan)', inputs.contractPeriod],
      ['Jumlah Layanan', inputs.services.length],
      ['Total Pendapatan per Bulan', formatCurrency(totalMonthlyRevenue)],
      ['Total Biaya Aktivasi (OTC)', formatCurrency(totalOtcCost)],
      [''],
      
      // Fixed Parameters Section
      ['=== PARAMETER TETAP PERHITUNGAN ==='],
      ['WACC (Discount Rate)', '15%'],
      ['Tax Rate', '22%'],
      ['COGS Margin', '70%'],
      ['Bad Debt Rate', '5%'],
      ['Depreciation Period', '5 Tahun'],
      ['Marketing Cost Rate', '30%'],
      ['Operational Cost Rate', '20%'],
      [''],
      
      // COGS Projection Section
      ['=== PROYEKSI COGS ==='],
      ['Label', 'Total', ...results.cogsProjections.map((_, i) => `Tahun ke-${i}`)],
      ['COGS OTC', formatCurrency(results.cogsProjections.reduce((sum, p) => sum + p.otcCogs, 0)), ...results.cogsProjections.map(p => formatCurrency(p.otcCogs))],
      ['COGS Bulanan', formatCurrency(results.cogsProjections.reduce((sum, p) => sum + p.monthlyCogs, 0)), ...results.cogsProjections.map(p => formatCurrency(p.monthlyCogs))],
      ['Total COGS', formatCurrency(results.cogsProjections.reduce((sum, p) => sum + p.totalCogs, 0)), ...results.cogsProjections.map(p => formatCurrency(p.totalCogs))],
      [''],
      
      // OPEX Projection Section
      ['=== PROYEKSI OPEX ==='],
      ['Label', 'Total', ...results.opexProjections.map((_, i) => `Tahun ke-${i}`)],
      ['Marketing Cost', formatCurrency(results.opexProjections.reduce((sum, p) => sum + p.marketingCost, 0)), ...results.opexProjections.map(p => formatCurrency(p.marketingCost))],
      ['Operational Cost', formatCurrency(results.opexProjections.reduce((sum, p) => sum + p.operationalCost, 0)), ...results.opexProjections.map(p => formatCurrency(p.operationalCost))],
      ['Total OPEX', formatCurrency(results.opexProjections.reduce((sum, p) => sum + p.totalOpex, 0)), ...results.opexProjections.map(p => formatCurrency(p.totalOpex))],
      [''],
      
      // Key Summary Metrics Section
      ['=== RINGKASAN UTAMA HASIL PERHITUNGAN ==='],
      ['Metric', 'Nilai'],
      ['Total Revenue (Lifetime)', formatCurrency(results.totalRevenue)],
      ['OTC Revenue', formatCurrency(results.otcRevenue)],
      ['Monthly Revenue Total', formatCurrency(results.monthlyTotal)],
      ['Cost IBL', formatCurrency(results.costIBL)],
      ['Cost OBL', formatCurrency(results.costOBL)],
      ['Total COGS', formatCurrency(results.cogsProjections.reduce((sum, p) => sum + p.totalCogs, 0))],
      ['Total OPEX', formatCurrency(results.totalOpex)],
      [''],
      
      // Quick Analysis Summary
      ['=== RINGKASAN ANALISIS KELAYAKAN ==='],
      ['NPV', formatCurrency(results.npv)],
      ['IRR', formatPercentage(results.irr)],
      ['Payback Period', `${results.paybackPeriod.years} tahun ${results.paybackPeriod.months} bulan`],
      ['Status Kelayakan', results.isViable ? 'LAYAK' : 'TIDAK LAYAK']
    ];
    
    const wsCogsOpexAnalysis = XLSX.utils.aoa_to_sheet(cogsOpexAnalysisData);
    XLSX.utils.book_append_sheet(wb, wsCogsOpexAnalysis, 'COGS+Opex+Ringkasan');
    
    // ===== SHEET 3: Revenue & P&L Summary (keep as is) =====
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
    XLSX.utils.book_append_sheet(wb, wsPLSummary, 'Revenue & P&L Summary');
    
    // ===== SHEET 4: Cash Flow Summary (keep as is) =====
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
    
    // ===== SHEET 5: Analisis NPV, IRR, Payback & Feasibility (combined sheet) =====
    const npvStatus = results.npv > 0 ? 'Layak' : 'Tidak Layak';
    const irrStatus = results.irr >= 0.15 ? 'Layak' : 'Tidak Layak';
    
    const npvFeasibilityData = [
      ['ANALISIS NPV, IRR, PAYBACK & FEASIBILITY'],
      [''],
      
      // NPV Analysis Section
      ['=== ANALISIS NPV, IRR & PAYBACK PERIOD ==='],
      ['Analisis Kelayakan', 'Nilai', 'Kriteria', 'Status', ...results.cashFlowProjections.slice(1).map((_, i) => `Tahun ${i + 1}`)],
      ['NPV', formatCurrency(results.npv), '> 0', npvStatus, ...results.cashFlowProjections.slice(1).map(() => '-')],
      ['IRR', formatPercentage(results.irr), '>= 15%', irrStatus, ...results.cashFlowProjections.slice(1).map(() => '-')],
      ['Payback Period', `${results.paybackPeriod.years} tahun ${results.paybackPeriod.months} bulan`, 'Semakin Pendek Semakin Baik', '-', ...results.cashFlowProjections.slice(1).map(() => '-')],
      [''],
      
      // Investment Cash Flow Breakdown for Analysis
      ['=== BREAKDOWN CASH FLOW UNTUK ANALISIS ==='],
      ['Tahun', 'Net Cash Flow', 'Cumulative Cash Flow', 'PV Factor (15%)', 'Present Value'],
      ['0', formatCurrency(-inputs.investmentCost), formatCurrency(-inputs.investmentCost), '1.000', formatCurrency(-inputs.investmentCost)],
      ...results.cashFlowProjections.slice(1).map((cf, index) => {
        const year = index + 1;
        const pvFactor = 1 / Math.pow(1.15, year);
        const presentValue = cf.netCashFlow * pvFactor;
        return [
          year.toString(),
          formatCurrency(cf.netCashFlow),
          formatCurrency(cf.cumulativeCashFlow),
          pvFactor.toFixed(3),
          formatCurrency(presentValue)
        ];
      }),
      [''],
      
      // Feasibility Analysis Section
      ['=== ANALISIS KELAYAKAN INVESTASI ==='],
      ['Metrics', 'Value', 'Threshold', 'Status', 'Keterangan'],
      ['NPV', formatCurrency(results.npv), '> Rp 0', npvStatus, npvStatus === 'Layak' ? 'Investasi menghasilkan nilai positif' : 'Investasi tidak menghasilkan nilai positif'],
      ['IRR', formatPercentage(results.irr), '>= 15%', irrStatus, irrStatus === 'Layak' ? 'Return melebihi cost of capital' : 'Return di bawah cost of capital'],
      ['Payback Period', `${results.paybackPeriod.years} tahun ${results.paybackPeriod.months} bulan`, 'Reasonable Period', '-', 'Waktu pengembalian modal investasi'],
      [''],
      
      // Investment Recommendation
      ['=== REKOMENDASI INVESTASI ==='],
      ['Aspek Penilaian', 'Hasil', 'Interpretasi'],
      ['Profitabilitas (NPV)', results.npv > 0 ? 'POSITIF' : 'NEGATIF', results.npv > 0 ? 'Investasi menguntungkan' : 'Investasi merugikan'],
      ['Efisiensi Return (IRR)', results.irr >= 0.15 ? 'MEMADAI' : 'TIDAK MEMADAI', results.irr >= 0.15 ? 'Return sesuai ekspektasi' : 'Return di bawah ekspektasi'],
      ['Risiko Waktu (Payback)', `${results.paybackPeriod.years} tahun ${results.paybackPeriod.months} bulan`, 'Waktu pengembalian investasi'],
      [''],
      ['KESIMPULAN AKHIR', '', ''],
      ['Status Kelayakan', results.isViable ? 'LAYAK' : 'TIDAK LAYAK', results.isViable ? 'Investasi direkomendasikan untuk dilaksanakan' : 'Investasi tidak direkomendasikan'],
      ['Tingkat Kepercayaan', results.npv > 0 && results.irr >= 0.15 ? 'TINGGI' : results.npv > 0 || results.irr >= 0.15 ? 'SEDANG' : 'RENDAH', 'Berdasarkan konsistensi indikator kelayakan'],
      ['Rekomendasi Tindakan', 
        results.isViable ? 'PROCEED' : 'REVIEW/REJECT', 
        results.isViable ? 'Lanjutkan ke tahap implementasi' : 'Tinjau ulang parameter atau tolak investasi']
    ];
    
    const wsNPVFeasibility = XLSX.utils.aoa_to_sheet(npvFeasibilityData);
    XLSX.utils.book_append_sheet(wb, wsNPVFeasibility, 'NPV, IRR & Feasibility');
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    
    // Generate filename with customer name or placeholder
    const customerNameForFile = inputs.customerName ? inputs.customerName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') : 'Nama_Customer';
    const filename = `AKI PT ${customerNameForFile}.xlsx`;
    
    saveAs(blob, filename);
  };


  useEffect(() => {
    const hasValidServices = inputs.services.length > 0 && inputs.services.some(service => 
      service.serviceDetails.trim() !== "" && (service.monthlyRevenue > 0 || service.otcCost > 0)
    );
    
    if (inputs.customerName.trim() !== "" && inputs.investmentCost > 0 && inputs.contractPeriod > 0 && hasValidServices) {
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

              </div>
              
              {/* Services Section */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground">Detail Layanan</h3>
                  <Button
                    type="button"
                    onClick={addService}
                    variant="default"
                    size="sm"
                    className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-slate-800 text-white font-medium"
                    data-testid="button-add-service"
                  >
                    ⊕ Tambah Layanan Lainnya
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {inputs.services.map((service, index) => (
                    <div key={service.id} className="border rounded-lg p-4 bg-white dark:bg-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm text-foreground">
                          Layanan {index + 1}
                        </h4>
                        {inputs.services.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeService(service.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            data-testid={`button-delete-service-${service.id}`}
                          >
                            🗑️ Hapus
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="block text-sm font-medium text-foreground mb-2">
                            Jenis & Detail Layanan
                          </Label>
                          <Input
                            type="text"
                            placeholder="Contoh : Astinet 100 Mbps"
                            value={inputValues.services.find(s => s.id === service.id)?.serviceDetails || ''}
                            onChange={(e) => handleServiceChange(service.id, 'serviceDetails', e.target.value)}
                            className="w-full"
                            data-testid={`input-service-details-${service.id}`}
                          />
                        </div>
                        
                        <div>
                          <Label className="block text-sm font-medium text-foreground mb-2">
                            BW (Bandwidth)
                          </Label>
                          <Input
                            type="text"
                            placeholder="Contoh: 100 Mbps"
                            value={inputValues.services.find(s => s.id === service.id)?.bandwidth || ''}
                            onChange={(e) => handleServiceChange(service.id, 'bandwidth', e.target.value)}
                            className="w-full"
                            data-testid={`input-bandwidth-${service.id}`}
                          />
                        </div>
                        
                        <div>
                          <Label className="block text-sm font-medium text-foreground mb-2">
                            Qty (Quantity)
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="1"
                            value={inputValues.services.find(s => s.id === service.id)?.quantity || ''}
                            onChange={(e) => handleServiceChange(service.id, 'quantity', e.target.value)}
                            className="w-full"
                            data-testid={`input-quantity-${service.id}`}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <Label className="block text-sm font-medium text-foreground mb-2">
                            Satuan
                          </Label>
                          <Input
                            type="text"
                            placeholder="Contoh: Unit/Link/Port"
                            value={inputValues.services.find(s => s.id === service.id)?.unit || ''}
                            onChange={(e) => handleServiceChange(service.id, 'unit', e.target.value)}
                            className="w-full"
                            data-testid={`input-unit-${service.id}`}
                          />
                        </div>
                        
                        <div>
                          <Label className="block text-sm font-medium text-foreground mb-2">
                            Biaya Bulanan
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                            <Input
                              type="text"
                              placeholder="0"
                              value={inputValues.services.find(s => s.id === service.id)?.monthlyRevenue || ''}
                              onChange={(e) => handleServiceChange(service.id, 'monthlyRevenue', e.target.value)}
                              className="currency-input pl-8"
                              data-testid={`input-monthly-revenue-${service.id}`}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label className="block text-sm font-medium text-foreground mb-2">
                            Biaya Aktivasi
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                            <Input
                              type="text"
                              placeholder="0"
                              value={inputValues.services.find(s => s.id === service.id)?.otcCost || ''}
                              onChange={(e) => handleServiceChange(service.id, 'otcCost', e.target.value)}
                              className="currency-input pl-8"
                              data-testid={`input-otc-cost-${service.id}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Totals Section */}
              <div className="mt-8">
                <h3 className="font-medium text-foreground mb-4">Total Keseluruhan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">
                      Total Revenue Bulanan
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                      <Input
                        type="text"
                        value={totalMonthlyRevenue > 0 ? stripCurrencyPrefix(formatCurrency(totalMonthlyRevenue)) : stripCurrencyPrefix(formatCurrency(0))}
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
                        value={totalOtcCost > 0 ? stripCurrencyPrefix(formatCurrency(totalOtcCost)) : stripCurrencyPrefix(formatCurrency(0))}
                        readOnly
                        className="currency-input pl-8 bg-muted/30 text-muted-foreground cursor-not-allowed"
                        data-testid="display-total-activation-cost"
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
                          Bulanan: {formatCurrency(totalMonthlyRevenue)} x {inputs.contractPeriod} bulan = {formatCurrency(results.monthlyTotal)}
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
                          Bulanan Akhir: {formatCurrency(totalMonthlyRevenue)} x {inputs.contractPeriod} = {formatCurrency(results.monthlyTotal)}
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

                  {/* Service Breakdown Table */}
                  <div className="mt-8">
                    <h3 className="font-semibold text-foreground mb-4">Detail Breakdown Layanan</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="border-r text-center font-semibold text-foreground">Layanan</TableHead>
                            <TableHead className="border-r text-center font-semibold text-foreground">BW</TableHead>
                            <TableHead className="border-r text-center font-semibold text-foreground">Qty</TableHead>
                            <TableHead className="border-r text-center font-semibold text-foreground">Satuan</TableHead>
                            <TableHead className="border-r text-center font-semibold text-foreground">OTC</TableHead>
                            <TableHead className="border-r text-center font-semibold text-foreground">MRC</TableHead>
                            <TableHead className="border-r text-center font-semibold text-foreground">Total OTC</TableHead>
                            <TableHead className="border-r text-center font-semibold text-foreground">Total MRC</TableHead>
                            <TableHead className="text-center font-semibold text-foreground">Total MRC {inputs.contractPeriod} Bulan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inputs.services.map((service, index) => (
                            <TableRow key={service.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"} data-testid={`service-row-${service.id}`}>
                              <TableCell className="border-r font-medium">{service.serviceDetails || `Layanan ${index + 1}`}</TableCell>
                              <TableCell className="border-r text-center" data-testid={`table-bandwidth-${service.id}`}>{service.bandwidth || "-"}</TableCell>
                              <TableCell className="border-r text-center" data-testid={`table-quantity-${service.id}`}>{service.quantity || "-"}</TableCell>
                              <TableCell className="border-r text-center" data-testid={`table-unit-${service.id}`}>{service.unit || "-"}</TableCell>
                              <TableCell className="border-r text-right font-mono">{formatCurrency(service.otcCost)}</TableCell>
                              <TableCell className="border-r text-right font-mono">{formatCurrency(service.monthlyRevenue)}</TableCell>
                              <TableCell className="border-r text-right font-mono">{formatCurrency(service.otcCost)}</TableCell>
                              <TableCell className="border-r text-right font-mono">{formatCurrency(service.monthlyRevenue)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(service.monthlyRevenue * inputs.contractPeriod)}</TableCell>
                            </TableRow>
                          ))}
                          
                          {/* Total (exc. PPN) Row */}
                          <TableRow className="bg-slate-100 border-t-2 border-slate-300">
                            <TableCell className="border-r font-bold text-foreground">Total (exc. PPN)</TableCell>
                            <TableCell className="border-r text-center text-muted-foreground">-</TableCell>
                            <TableCell className="border-r text-center text-muted-foreground">-</TableCell>
                            <TableCell className="border-r text-center text-muted-foreground">-</TableCell>
                            <TableCell className="border-r text-right font-mono font-bold">{formatCurrency(totalOtcCost)}</TableCell>
                            <TableCell className="border-r text-right font-mono font-bold">{formatCurrency(totalMonthlyRevenue)}</TableCell>
                            <TableCell className="border-r text-right font-mono font-bold">{formatCurrency(totalOtcCost)}</TableCell>
                            <TableCell className="border-r text-right font-mono font-bold">{formatCurrency(totalMonthlyRevenue)}</TableCell>
                            <TableCell className="text-right font-mono font-bold">{formatCurrency(totalMonthlyRevenue * inputs.contractPeriod)}</TableCell>
                          </TableRow>

                          {/* Total OTC + MRC xxx Bulan (exc. PPN) Row */}
                          <TableRow className="bg-blue-50 border-t border-blue-200">
                            <TableCell className="border-r font-bold text-blue-800" colSpan={8}>
                              Total OTC + MRC {inputs.contractPeriod} Bulan (exc. PPN)
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-blue-800">
                              {formatCurrency(totalOtcCost + (totalMonthlyRevenue * inputs.contractPeriod))}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
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