
"use client"

import React from 'react';
import type { InventoryItem } from '@/app/page';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PieChart as PieChartIcon, BarChart3, Info } from 'lucide-react'; // Renamed PieChart to PieChartIcon to avoid conflict
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  PieChart, // Actual Recharts PieChart component
  Pie,      // Recharts Pie series component
  BarChart, // Actual Recharts BarChart component
  Bar,      // Recharts Bar series component
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip, // Alias for Recharts Tooltip
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Tooltip as ShadTooltip,
  TooltipContent as ShadTooltipContent,
  TooltipProvider as ShadTooltipProvider,
  TooltipTrigger as ShadTooltipTrigger,
} from "@/components/ui/tooltip"


interface AbcAnalysisViewProps {
  inventoryItems: InventoryItem[];
}

const AbcAnalysisView: React.FC<AbcAnalysisViewProps> = ({ inventoryItems }) => {
  const categoryCounts = { A: 0, B: 0, C: 0 };
  const categoryValue = { A: 0, B: 0, C: 0 };
  
  let totalValue = 0;

  inventoryItems.forEach(item => {
    const itemValue = (item.quantity || 0) * (item.unitCost || 0);
    totalValue += itemValue;
    if (item.abcCategory) {
      categoryCounts[item.abcCategory]++;
      categoryValue[item.abcCategory] += itemValue;
    }
  });

  const pieData = [
    { name: 'Category A', value: categoryCounts.A, fill: 'hsl(var(--destructive))' },
    { name: 'Category B', value: categoryCounts.B, fill: 'hsl(var(--secondary-foreground))' },
    { name: 'Category C', value: categoryCounts.C, fill: 'hsl(var(--muted-foreground))' },
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'Category A', value: categoryValue.A, percentage: totalValue > 0 ? (categoryValue.A / totalValue) * 100 : 0, fill: 'hsl(var(--destructive))' },
    { name: 'Category B', value: categoryValue.B, percentage: totalValue > 0 ? (categoryValue.B / totalValue) * 100 : 0, fill: 'hsl(var(--secondary-foreground))' },
    { name: 'Category C', value: categoryValue.C, percentage: totalValue > 0 ? (categoryValue.C / totalValue) * 100 : 0, fill: 'hsl(var(--muted-foreground))' },
  ].filter(d => d.value > 0);
  
  const chartConfig = {
    items: { label: "Items", color: "hsl(var(--chart-1))" },
    value: { label: "Value", color: "hsl(var(--chart-2))" },
    A: { label: "Category A", color: "hsl(var(--destructive))" },
    B: { label: "Category B", color: "hsl(var(--secondary-foreground))" },
    C: { label: "Category C", color: "hsl(var(--muted-foreground))" },
  } satisfies React.ComponentProps<typeof ChartContainer>["config"];

  const getAbcCategoryBadgeVariant = (category?: 'A' | 'B' | 'C'): "default" | "secondary" | "destructive" | "outline" => {
    switch (category) {
        case 'A': return 'destructive';
        case 'B': return 'secondary';
        case 'C': return 'outline';
        default: return 'outline';
    }
  }

  const sortedItemsForTable = [...inventoryItems].sort((a, b) => {
    const abcOrder: { [key: string]: number } = { 'A': 1, 'B': 2, 'C': 3 };
    if (a.abcCategory && b.abcCategory) {
        if (abcOrder[a.abcCategory] < abcOrder[b.abcCategory]) return -1;
        if (abcOrder[a.abcCategory] > abcOrder[b.abcCategory]) return 1;
    } else if (a.abcCategory) {
        return -1;
    } else if (b.abcCategory) {
        return 1;
    }
    const valA = (a.quantity || 0) * (a.unitCost || 0);
    const valB = (b.quantity || 0) * (b.unitCost || 0);
    return valB - valA; // Sort by consumption value descending if ABC is same or not present
  });

  return (
    <ShadTooltipProvider>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 h-full">
      <Card className="lg:col-span-4 h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            ABC Analysis Details
          </CardTitle>
          <CardDescription>
            Inventory items categorized by consumption value (Quantity x Unit Cost).
             <ShadTooltip>
                <ShadTooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help inline-block ml-1" />
                </ShadTooltipTrigger>
                <ShadTooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">
                        <strong className="text-destructive">A:</strong> High-value items (Top 80% total consumption value). <br />
                        <strong className="text-secondary-foreground">B:</strong> Medium-value items (Next 15% total consumption value). <br />
                        <strong className="text-muted-foreground">C:</strong> Low-value items (Remaining 5% total consumption value).
                    </p>
                </ShadTooltipContent>
            </ShadTooltip>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-4">
          {inventoryItems.length === 0 ? (
             <p className="text-muted-foreground text-center py-4">No inventory data for ABC analysis.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Category</TableHead>
                  <TableHead className="text-right">Consumption Value</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItemsForTable.map((item) => (
                  <TableRow key={item.id} className={
                    item.abcCategory === 'A' ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' :
                    item.abcCategory === 'B' ? 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30' :
                    'hover:bg-muted/50'
                  }>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-center">
                      {item.abcCategory ? (
                        <Badge variant={getAbcCategoryBadgeVariant(item.abcCategory)}>{item.abcCategory}</Badge>
                      ) : (
                         <Badge variant="outline">N/A</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">${((item.quantity || 0) * (item.unitCost || 0)).toFixed(2)}</TableCell>
                    <TableCell className="text-right">${(item.unitCost || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-center">{item.quantity || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="lg:col-span-3 flex flex-col gap-4 h-full">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" /> Item Count by Category
            </CardTitle>
            <CardDescription>Distribution of inventory items across ABC categories.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center p-2">
            {pieData.length > 0 ? (
              <ChartContainer config={chartConfig} className="aspect-square max-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
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
                              {`${pieData[index].name.split(' ')[1]}: ${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                      }}
                    >
                      {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
                <p className="text-muted-foreground text-center py-4">No data for chart.</p>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Consumption Value by Category
            </CardTitle>
            <CardDescription>Distribution of total consumption value across ABC categories.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center p-2">
            {barData.length > 0 ? (
                <ChartContainer config={chartConfig} className="aspect-video max-h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} layout="vertical" margin={{ left: 10, right:30 }}>
                            <CartesianGrid horizontal={false} vertical={true} strokeDasharray="3 3" />
                            <XAxis type="number" hide/>
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => value.split(" ")[1]}/>
                             <RechartsTooltip
                                cursor={{fill: 'hsl(var(--muted)/0.3)'}}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm min-w-[120px]">
                                            <div className="grid grid-cols-2 gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                {data.name}
                                                </span>
                                                <span className="font-bold text-foreground">
                                                ${data.value.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                Percentage
                                                </span>
                                                <span className="font-bold text-foreground">
                                                {data.percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                            </div>
                                        </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="value" name="Consumption Value" radius={4}>
                                {barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                             <ChartLegend content={<ChartLegendContent nameKey="name"/>} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            ) : (
                <p className="text-muted-foreground text-center py-4">No data for chart.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </ShadTooltipProvider>
  );
};

export default AbcAnalysisView;


    