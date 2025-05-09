"use client";

import React, { useState, useMemo, useCallback } from 'react';
import type { InventoryItem } from '@/app/page';
import type { Supplier } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Filter, AlertCircle, Star } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ReportType = "profitMargins" | "stockAging" | "supplierPerformance";

interface ReportItemBase {
  id: string;
  name: string;
}
interface ProfitMarginReportItem extends ReportItemBase {
  unitCost: number;
  unitPrice: number;
  profitMarginAbsolute: number;
  profitMarginPercentage: number;
}
interface StockAgingReportItem extends ReportItemBase {
  purchaseDate: string;
  daysInStock: number;
  quantity: number;
  totalValue: number;
}
interface SupplierPerformanceReportItem {
  supplierId: string;
  supplierName: string;
  itemsSuppliedCount: number;
  totalPurchaseValue: number;
  averageLeadTime: number | null; // Days
  onTimeDeliveryRate: number | null; // Percentage
  qualityRating: number | null; // e.g. 1-5
}

const ReportsView: React.FC<{ inventoryItems: InventoryItem[], suppliers: Supplier[] }> = ({ inventoryItems, suppliers }) => {
  const [activeReport, setActiveReport] = useState<ReportType>("profitMargins");
  const { toast } = useToast();

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-CA'); // YYYY-MM-DD for easier sorting
  };

  const calculateDaysDifference = (dateString1: string, dateString2: string): number => {
    const date1 = new Date(dateString1);
    const date2 = new Date(dateString2);
    return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
  };
  
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const reportData = useMemo(() => {
    switch (activeReport) {
      case "profitMargins":
        return inventoryItems
          .filter(item => typeof item.unitCost === 'number' && typeof item.unitPrice === 'number')
          .map(item => {
            const unitCost = item.unitCost!;
            const unitPrice = item.unitPrice!;
            const profitMarginAbsolute = unitPrice - unitCost;
            const profitMarginPercentage = unitPrice > 0 ? (profitMarginAbsolute / unitPrice) * 100 : 0;
            return {
              id: item.id,
              name: item.name,
              unitCost,
              unitPrice,
              profitMarginAbsolute: parseFloat(profitMarginAbsolute.toFixed(2)),
              profitMarginPercentage: parseFloat(profitMarginPercentage.toFixed(2)),
            };
          })
          .sort((a,b) => b.profitMarginPercentage - a.profitMarginPercentage);

      case "stockAging":
        return inventoryItems
          .filter(item => item.purchaseDate)
          .map(item => {
            const daysInStock = calculateDaysDifference(item.purchaseDate!, todayStr);
            return {
              id: item.id,
              name: item.name,
              purchaseDate: formatDate(item.purchaseDate),
              daysInStock,
              quantity: item.quantity,
              totalValue: parseFloat(((item.unitCost || 0) * item.quantity).toFixed(2)),
            };
          })
          .sort((a,b) => b.daysInStock - a.daysInStock);

      case "supplierPerformance":
        const supplierDataMap = new Map<string, Partial<SupplierPerformanceReportItem> & { itemCount: number, totalValue: number, leadTimes: number[], onTimeCount: number, totalDeliveries: number }>();
        
        suppliers.forEach(sup => {
            supplierDataMap.set(sup.id, {
                supplierId: sup.id,
                supplierName: sup.name,
                itemCount: 0,
                totalValue: 0,
                leadTimes: [],
                onTimeCount: sup.onTimeDeliveryRate && sup.onTimeDeliveryRate > 0 ? Math.round(sup.onTimeDeliveryRate * 10) : 0, // Simulating based on existing rate
                totalDeliveries: sup.onTimeDeliveryRate && sup.onTimeDeliveryRate > 0 ? 10 : 0, // Simulating based on existing rate
                qualityRating: sup.performanceRating,
            });
        });

        inventoryItems.forEach(item => {
          if (item.supplierId) {
            let currentSupplierData = supplierDataMap.get(item.supplierId);
            if (!currentSupplierData) { // If supplierId in item but not in suppliers list (fallback)
                currentSupplierData = { supplierId: item.supplierId, supplierName: `Unknown (ID: ${item.supplierId})`, itemCount: 0, totalValue:0, leadTimes: [], onTimeCount:0, totalDeliveries:0, qualityRating: null };
                supplierDataMap.set(item.supplierId, currentSupplierData);
            }
            
            currentSupplierData.itemCount!++;
            currentSupplierData.totalValue! += (item.unitCost || 0) * item.quantity;
            // For a more realistic lead time and on-time rate, actual purchase order data would be needed.
            // Here we use the supplier's general lead time and on-time delivery rate.
            const supplierInfo = suppliers.find(s => s.id === item.supplierId);
            if (supplierInfo && supplierInfo.leadTimeDays) {
                currentSupplierData.leadTimes!.push(supplierInfo.leadTimeDays);
            }
          }
        });

        return Array.from(supplierDataMap.values()).map(supData => {
            const avgLeadTime = supData.leadTimes!.length > 0 ? supData.leadTimes!.reduce((a,b) => a + b, 0) / supData.leadTimes!.length : null;
            const onTimeRate = supData.totalDeliveries! > 0 ? (supData.onTimeCount! / supData.totalDeliveries!) * 100 : null;
            return {
                supplierId: supData.supplierId!,
                supplierName: supData.supplierName!,
                itemsSuppliedCount: supData.itemCount!,
                totalPurchaseValue: parseFloat(supData.totalValue!.toFixed(2)),
                averageLeadTime: avgLeadTime ? parseFloat(avgLeadTime.toFixed(1)) : null,
                onTimeDeliveryRate: onTimeRate ? parseFloat(onTimeRate.toFixed(1)) : null,
                qualityRating: supData.qualityRating || null,
            };
        }).sort((a,b) => (b.qualityRating || 0) - (a.qualityRating || 0) || b.totalPurchaseValue - a.totalPurchaseValue);
      default:
        return [];
    }
  }, [activeReport, inventoryItems, suppliers, todayStr, formatDate]);

  const handleDownload = useCallback((format: "pdf" | "excel") => {
    toast({
      title: `Download Report (${format.toUpperCase()})`,
      description: `Simulating download of ${activeReport} report as ${format}. This feature would require a backend service.`,
    });
    // In a real app, this would trigger an API call to generate and download the file.
    console.log(`Request to download ${activeReport} as ${format}`);
  }, [activeReport, toast]);
  
  const renderReportTable = () => {
    if (reportData.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No data available for this report.</p>;
    }
    switch (activeReport) {
      case "profitMargins":
        const profitMargins = reportData as ProfitMarginReportItem[];
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Margin ($)</TableHead>
                <TableHead className="text-right">Margin (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profitMargins.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${item.profitMarginAbsolute.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.profitMarginPercentage.toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      case "stockAging":
        const stockAging = reportData as StockAgingReportItem[];
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead className="text-center">Days In Stock</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockAging.map(item => (
                <TableRow key={item.id} className={item.daysInStock > 180 ? "bg-destructive/10" : item.daysInStock > 90 ? "bg-yellow-100 dark:bg-yellow-900/30" : ""}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.purchaseDate}</TableCell>
                  <TableCell className="text-center">{item.daysInStock}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.totalValue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      case "supplierPerformance":
        const supplierPerformance = reportData as SupplierPerformanceReportItem[];
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead className="text-center">Items Supplied</TableHead>
                <TableHead className="text-right">Total Purchase Value</TableHead>
                <TableHead className="text-center">Avg. Lead Time (Days)</TableHead>
                <TableHead className="text-center">On-Time Delivery (%)</TableHead>
                <TableHead className="text-center">Quality Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplierPerformance.map(sup => (
                <TableRow key={sup.supplierId}>
                  <TableCell className="font-medium">{sup.supplierName}</TableCell>
                  <TableCell className="text-center">{sup.itemsSuppliedCount}</TableCell>
                  <TableCell className="text-right">${sup.totalPurchaseValue.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{sup.averageLeadTime ?? 'N/A'}</TableCell>
                  <TableCell className="text-center">{sup.onTimeDeliveryRate ? `${sup.onTimeDeliveryRate}%` : 'N/A'}</TableCell>
                  <TableCell className="text-center">
                    {sup.qualityRating ? 
                        <div className="flex items-center justify-center">
                           {sup.qualityRating.toFixed(1)} <Star className="w-3 h-3 fill-yellow-400 text-yellow-500 ml-1"/>
                        </div>
                        : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      default:
        return null;
    }
  };
  
  const reportDescriptions: Record<ReportType, string> = {
    profitMargins: "Analyze profit margins for each inventory item based on unit cost and unit price.",
    stockAging: "Identify aging stock by tracking how long items have been in inventory since their purchase date.",
    supplierPerformance: "Evaluate supplier effectiveness based on metrics like items supplied, purchase value, lead time, and on-time delivery."
  };

  return (
    <TooltipProvider>
    <Card className="h-full flex flex-col">
      <CardHeader className="shrink-0">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Customizable Reports
            </CardTitle>
            <div className="flex gap-2 items-center">
                <Select value={activeReport} onValueChange={(value: ReportType) => setActiveReport(value)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="profitMargins">Profit Margins</SelectItem>
                    <SelectItem value="stockAging">Stock Aging</SelectItem>
                    <SelectItem value="supplierPerformance">Supplier Performance</SelectItem>
                </SelectContent>
                </Select>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => handleDownload('pdf')}>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download PDF</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Download as PDF (Simulated)</p></TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => handleDownload('excel')}>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download Excel</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Download as Excel (Simulated)</p></TooltipContent>
                </Tooltip>
            </div>
        </div>
        <CardDescription className="mt-2">{reportDescriptions[activeReport]}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-4">
        {renderReportTable()}
      </CardContent>
       <Card className="m-4 mt-0 p-4 border-dashed">
            <CardHeader className="p-0 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground"/> Automated Scheduled Reports
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <p className="text-sm text-muted-foreground">
                    This section simulates where users could configure automated reports.
                    In a full application, you could set up daily/weekly email delivery of PDF/Excel reports for selected data.
                    This functionality typically requires backend processing and email services.
                </p>
                <Button className="mt-2" size="sm" variant="outline" onClick={() => toast({ title: "Configuration Required", description: "Automated report scheduling would be configured here."})}>
                    Configure Scheduled Reports (Demo)
                </Button>
            </CardContent>
        </Card>
    </Card>
    </TooltipProvider>
  );
};

export default ReportsView;
