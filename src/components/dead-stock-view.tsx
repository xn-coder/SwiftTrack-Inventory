"use client";

import React from 'react';
import type { InventoryItem } from '@/app/page';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Archive, CalendarDays, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface DeadStockViewProps {
  inventoryItems: InventoryItem[];
}

const DEAD_STOCK_DAYS_THRESHOLD = 90; // Items not moved in 90 days
const DEAD_STOCK_MIN_QUANTITY = 1; // Minimum quantity to be considered for dead stock

const DeadStockView: React.FC<DeadStockViewProps> = ({ inventoryItems }) => {

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const daysSince = (dateString?: string | null): number | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isItemExpired = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(expiryDate) < today;
  };

  const deadStockItems = inventoryItems.filter(item => {
    const daysSinceLastMovement = daysSince(item.lastMovementDate || item.dateAdded);
    const isExpired = item.expiryDate ? isItemExpired(item.expiryDate) : false;
    
    // An item is dead stock if:
    // 1. It hasn't moved for more than DEAD_STOCK_DAYS_THRESHOLD days.
    // 2. Its quantity is at least DEAD_STOCK_MIN_QUANTITY.
    // 3. It's not already expired (expired items are handled in notifications).
    //    (We might still want to see them here, but typically dead stock refers to usable but non-moving items)
    return (
      daysSinceLastMovement !== null &&
      daysSinceLastMovement > DEAD_STOCK_DAYS_THRESHOLD &&
      item.quantity >= DEAD_STOCK_MIN_QUANTITY &&
      !isExpired
    );
  }).sort((a, b) => {
    const daysA = daysSince(a.lastMovementDate || a.dateAdded) || 0;
    const daysB = daysSince(b.lastMovementDate || b.dateAdded) || 0;
    return daysB - daysA; // Show oldest non-moving items first
  });

  return (
    <TooltipProvider>
      <Card className="h-full flex flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" />
            Dead Stock Identification
          </CardTitle>
          <CardDescription>
            Items that have not moved for over {DEAD_STOCK_DAYS_THRESHOLD} days and have a quantity of at least {DEAD_STOCK_MIN_QUANTITY}.
            This helps identify slow-moving inventory to prevent overstocking.
            <Tooltip>
                <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help inline-block ml-1" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">
                        Dead stock refers to items that haven't been sold or used for an extended period.
                        These items tie up capital and warehouse space. Regularly reviewing dead stock can help in making decisions like discounts, donations, or disposal.
                    </p>
                </TooltipContent>
            </Tooltip>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-4">
          {deadStockItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No dead stock items identified based on current criteria.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead>Last Movement</TableHead>
                  <TableHead className="text-center">Days Inactive</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadStockItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                        {formatDate(item.lastMovementDate || item.dateAdded)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                        <Badge variant="secondary">{daysSince(item.lastMovementDate || item.dateAdded)} days</Badge>
                    </TableCell>
                    <TableCell>{item.location || 'N/A'}</TableCell>
                    <TableCell className="text-right">${(item.unitCost || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">${((item.quantity || 0) * (item.unitCost || 0)).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default DeadStockView;