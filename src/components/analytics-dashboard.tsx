"use client";

import React, { useMemo } from 'react';
import type { InventoryItem } from '@/app/page';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, DollarSign, Info, RefreshCw, PieChart as PieChartIcon } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line
} from 'recharts';
import {
  Tooltip as ShadTooltip,
  TooltipContent as ShadTooltipContent,
  TooltipProvider as ShadTooltipProvider,
  TooltipTrigger as ShadTooltipTrigger,
} from "@/components/ui/tooltip";

interface AnalyticsDashboardProps {
  inventoryItems: InventoryItem[];
}

// Constants for calculations (can be configurable)
const CARRYING_COST_PERCENTAGE = 0.20; // 20% of average inventory value
const PERIOD_DAYS_FOR_TURNOVER = 365; // Annual turnover

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ inventoryItems }) => {
  
  const chartConfig = {
    stockTurnover: { label: "Stock Turnover", color: "hsl(var(--chart-1))" },
    salesVelocity: { label: "Sales Velocity (Units/Day)", color: "hsl(var(--chart-2))" },
    carryingCost: { label: "Carrying Cost ($)", color: "hsl(var(--chart-3))" },
    inventoryValue: { label: "Inventory Value ($)", color: "hsl(var(--chart-4))" },
    categoryA: { label: "Category A", color: "hsl(var(--destructive))" },
    categoryB: { label: "Category B", color: "hsl(var(--secondary-foreground))" },
    categoryC: { label: "Category C", color: "hsl(var(--muted-foreground))" },
  } satisfies React.ComponentProps<typeof ChartContainer>["config"];

  const analyticsData = useMemo(() => {
    if (!inventoryItems || inventoryItems.length === 0) {
      return {
        totalInventoryValue: 0,
        averageInventoryValue: 0,
        costOfGoodsSold: 0, // Simplified: Value of items moved out in last N days
        stockTurnoverRate: 0,
        salesVelocityData: [],
        totalCarryingCost: 0,
        categoryValueDistribution: [],
        overallSalesVelocity: 0,
      };
    }

    let totalInventoryValue = 0;
    let costOfGoodsSold = 0;
    const salesVelocityData: { name: string; velocity: number; value: number }[] = [];
    const categoryValue: { [key: string]: number } = { A: 0, B: 0, C: 0 };
    let totalUnitsSoldSimulated = 0;
    let daysInSystemTotal = 0;

    inventoryItems.forEach(item => {
      const itemValue = (item.unitCost || 0) * (item.quantity || 0);
      totalInventoryValue += itemValue;

      if (item.abcCategory) {
        categoryValue[item.abcCategory] += itemValue;
      }

      // Simulate sales velocity based on last movement (crude, needs better data for real scenario)
      // Assuming lastMovementDate marks a "sale" or significant usage
      const daysSinceAdded = item.dateAdded ? (new Date().getTime() - new Date(item.dateAdded).getTime()) / (1000 * 3600 * 24) : 0;
      const daysSinceLastMovement = item.lastMovementDate ? (new Date().getTime() - new Date(item.lastMovementDate).getTime()) / (1000 * 3600 * 24) : 0;
      
      // A very simplified COGS and Sales Velocity model
      // If an item moved in the last 30 days, consider its value as COGS for this period
      // And calculate velocity based on its quantity and how long it's been in stock or moved
      const activityPeriod = Math.max(1, daysSinceAdded); // Avoid division by zero
      
      // If quantity changed, assume it was sold/used
      // This is a placeholder; real sales data is needed
      const quantitySoldSimulated = item.quantity < 50 ? 50 - item.quantity : 1; // Highly simplified
      if (daysSinceLastMovement <= 30 && daysSinceLastMovement > 0) {
         costOfGoodsSold += (item.unitCost || 0) * quantitySoldSimulated; 
         totalUnitsSoldSimulated += quantitySoldSimulated;
      }
      daysInSystemTotal += activityPeriod;


      // For individual item sales velocity
      const itemVelocity = quantitySoldSimulated / Math.max(1, daysSinceLastMovement || activityPeriod); // units/day
      if(itemVelocity > 0 && item.name.length < 20) { // Only show reasonable velocities for brevity
        salesVelocityData.push({ name: item.name, velocity: parseFloat(itemVelocity.toFixed(2)), value: itemValue });
      }
    });
    
    const averageInventoryValue = totalInventoryValue / 2; // Simplified average (Beginning + End / 2), here just using current/2
    const stockTurnoverRate = costOfGoodsSold > 0 && averageInventoryValue > 0 ? costOfGoodsSold / averageInventoryValue : 0;
    const totalCarryingCost = averageInventoryValue * CARRYING_COST_PERCENTAGE;
    
    const overallSalesVelocity = totalUnitsSoldSimulated / Math.max(1, daysInSystemTotal / inventoryItems.length); // Avg units/day


    const categoryValueDistribution = [
      { name: 'Category A', value: categoryValue.A, fill: chartConfig.categoryA.color },
      { name: 'Category B', value: categoryValue.B, fill: chartConfig.categoryB.color },
      { name: 'Category C', value: categoryValue.C, fill: chartConfig.categoryC.color },
    ].filter(d => d.value > 0);

    salesVelocityData.sort((a,b) => b.velocity - a.velocity);


    return {
      totalInventoryValue,
      averageInventoryValue,
      costOfGoodsSold,
      stockTurnoverRate: parseFloat(stockTurnoverRate.toFixed(2)),
      salesVelocityData: salesVelocityData.slice(0,10), // Top 10 for chart
      totalCarryingCost: parseFloat(totalCarryingCost.toFixed(2)),
      categoryValueDistribution,
      overallSalesVelocity: parseFloat(overallSalesVelocity.toFixed(2)),
    };
  }, [inventoryItems, chartConfig]);

  const kpiCards = [
    { title: "Total Inventory Value", value: `$${analyticsData.totalInventoryValue.toFixed(2)}`, icon: DollarSign, description: "Current market value of all stock.", tooltip: "Sum of (Unit Cost * Quantity) for all items." },
    { title: "Stock Turnover Rate", value: analyticsData.stockTurnoverRate.toString(), icon: RefreshCw, description: "Times inventory is sold/used in a period.", tooltip: "COGS / Average Inventory. Higher is generally better. (Annualized estimate)" },
    { title: "Avg. Sales Velocity", value: `${analyticsData.overallSalesVelocity} units/day`, icon: TrendingUp, description: "Average units moved per day.", tooltip: "Total units sold (simulated) / Average days items are in stock. Higher indicates faster sales." },
    { title: "Estimated Carrying Cost", value: `$${analyticsData.totalCarryingCost.toFixed(2)}`, icon: DollarSign, description: `Cost of holding inventory (${(CARRYING_COST_PERCENTAGE * 100).toFixed(0)}% of Avg. Value).`, tooltip: "Costs include storage, insurance, obsolescence, etc. (Annualized estimate)" },
  ];

  return (
    <ShadTooltipProvider>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(kpi => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {kpi.description}
                <ShadTooltip>
                    <ShadTooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help inline-block ml-1" />
                    </ShadTooltipTrigger>
                    <ShadTooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{kpi.tooltip}</p>
                    </ShadTooltipContent>
                </ShadTooltip>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="lg:col-span-4 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Sales Velocity (Top Items)
            </CardTitle>
            <CardDescription>Units moved per day for the fastest-selling items (simulated).</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center p-2">
            {analyticsData.salesVelocityData.length > 0 ? (
              <ChartContainer config={chartConfig} className="aspect-video max-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.salesVelocityData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip 
                        contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                        labelStyle={{color: 'hsl(var(--foreground))'}}
                        itemStyle={{color: chartConfig.salesVelocity.color}}
                        formatter={(value: number, name: string) => [`${value} units/day`, name === 'velocity' ? 'Sales Velocity' : name]}
                    />
                    <Bar dataKey="velocity" name="Sales Velocity" fill={chartConfig.salesVelocity.color} radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-4">Insufficient data for sales velocity chart.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-primary" /> Inventory Value by ABC Category
                </CardTitle>
                <CardDescription>Distribution of total inventory value by ABC category.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center p-2">
                {analyticsData.categoryValueDistribution.length > 0 ? (
                <ChartContainer config={chartConfig} className="aspect-square max-h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={analyticsData.categoryValueDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-medium">
                                {`${name.split(' ')[1]}: ${(percent * 100).toFixed(0)}%`}
                                </text>
                            );
                        }}
                        >
                        {analyticsData.categoryValueDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill as string} stroke={entry.fill as string} />
                        ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                        <ChartTooltip 
                            contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                            formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                        />
                    </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
                ) : (
                    <p className="text-muted-foreground text-center py-4">No ABC category data for chart.</p>
                )}
            </CardContent>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader>
            <CardTitle>Note on Analytics</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                The analytics displayed are based on simplified calculations and mock data. For accurate, real-world insights, integration with actual sales records, purchase orders, and more detailed inventory movement data is necessary. Sales velocity, COGS, and stock turnover are estimated based on available mock data fields like `lastMovementDate` and `quantity`.
            </p>
        </CardContent>
      </Card>
    </ShadTooltipProvider>
  );
};

export default AnalyticsDashboard;
