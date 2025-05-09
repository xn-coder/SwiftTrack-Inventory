import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, CalendarDays, Info, Clock, TrendingUp } from 'lucide-react'; // Added TrendingUp
import type { InventoryItem } from '@/app/page'; // Adjust path as needed
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


interface InventoryDashboardProps {
  inventoryItems: InventoryItem[];
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ inventoryItems }) => {
  const getStatusVariant = (status: string, quantity: number, abcCategory?: 'A' | 'B' | 'C'): "default" | "secondary" | "destructive" | "outline" => {
     let derivedStatus = status;
     // Ensure explicit status check for 'Expired' before quantity checks
     if (isExpired(inventoryItems.find(item => item.status === status)?.expiryDate || null)) { // Need to find the item to check its expiry
        derivedStatus = 'Expired';
     } else if (quantity <= 5) derivedStatus = 'Critical';
     else if (quantity <= 20) derivedStatus = 'Low Stock';
     else derivedStatus = 'In Stock';


    switch (derivedStatus.toLowerCase()) {
      case 'in stock':
        return abcCategory === 'A' ? 'default' : abcCategory === 'B' ? 'secondary' : 'outline';
      case 'low stock':
        return 'secondary';
      case 'critical':
        return 'destructive';
      case 'expired':
        return 'outline'; 
      default:
        return 'outline';
    }
  };
  
  const getAbcCategoryBadgeVariant = (category?: 'A' | 'B' | 'C'): "default" | "secondary" | "destructive" | "outline" => {
    switch (category) {
        case 'A': return 'destructive'; 
        case 'B': return 'secondary'; 
        case 'C': return 'outline';   
        default: return 'outline';
    }
  }


  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(expiryDate) < today;
  };

  const isNearExpiry = (expiryDate: string | null, nearExpiryDays: number = 30) => {
    if (!expiryDate || isExpired(expiryDate)) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= nearExpiryDays && diffDays >= 0;
  };

  const getEffectiveStatus = (item: InventoryItem): string => {
     if (isExpired(item.expiryDate)) return 'Expired';
     if (item.quantity <= 5) return 'Critical';
     if (item.quantity <= 20) return 'Low Stock'; 
     return 'In Stock';
  }
  
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const sortedItems = [...inventoryItems].sort((a, b) => {
    const aEffectiveStatus = getEffectiveStatus(a);
    const bEffectiveStatus = getEffectiveStatus(b);

    const statusOrder: { [key: string]: number } = {
      'Expired': 1,
      'Critical': 2,
      'Low Stock': 3,
      'In Stock': 4,
    };

    if (statusOrder[aEffectiveStatus] < statusOrder[bEffectiveStatus]) return -1;
    if (statusOrder[aEffectiveStatus] > statusOrder[bEffectiveStatus]) return 1;
    
    const abcOrder: { [key: string]: number } = { 'A': 1, 'B': 2, 'C': 3 };
    if (a.abcCategory && b.abcCategory) {
        if (abcOrder[a.abcCategory] < abcOrder[b.abcCategory]) return -1;
        if (abcOrder[a.abcCategory] > abcOrder[b.abcCategory]) return 1;
    } else if (a.abcCategory) {
        return -1; 
    } else if (b.abcCategory) {
        return 1;
    }


    if (a.expiryDate && b.expiryDate) {
        const dateA = new Date(a.expiryDate).getTime();
        const dateB = new Date(b.expiryDate).getTime();
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
    } else if (a.expiryDate) {
        return -1;
    } else if (b.expiryDate) {
        return 1;
    }
    
    const lastMoveA = a.lastMovementDate ? new Date(a.lastMovementDate).getTime() : new Date(a.dateAdded).getTime();
    const lastMoveB = b.lastMovementDate ? new Date(b.lastMovementDate).getTime() : new Date(b.dateAdded).getTime();
    if (lastMoveA > lastMoveB) return -1; // Newer movement first
    if (lastMoveA < lastMoveB) return 1;


    return a.name.localeCompare(b.name);
  });

  // Simulated ML Prediction for top selling products
  // This is a placeholder. Real ML would involve a model and more complex data.
  // For now, let's pick items that moved recently, are 'A' or 'B' category, and have decent stock.
  const predictedTopSellers = [...inventoryItems]
    .filter(item => !isExpired(item.expiryDate) && item.quantity > 5 && (item.abcCategory === 'A' || item.abcCategory === 'B'))
    .sort((a, b) => {
      const lastMoveA = a.lastMovementDate ? new Date(a.lastMovementDate).getTime() : 0;
      const lastMoveB = b.lastMovementDate ? new Date(b.lastMovementDate).getTime() : 0;
      // Prioritize recently moved items
      if (lastMoveB !== lastMoveA) return lastMoveB - lastMoveA;
      // Then prioritize 'A' category
      if (a.abcCategory === 'A' && b.abcCategory !== 'A') return -1;
      if (b.abcCategory === 'A' && a.abcCategory !== 'A') return 1;
      // Then by quantity (higher first)
      return b.quantity - a.quantity;
    })
    .slice(0, 3);


  return (
    <div className="flex flex-col gap-4 h-full">
       <Card className="flex-shrink-0">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Predicted Top Sellers
          </CardTitle>
          <CardDescription>
            Top 3 products predicted to sell well based on current data (simulated).
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-y-auto p-4">
          {predictedTopSellers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Not enough data for prediction.</p>
          ) : (
            <ul className="space-y-3">
              {predictedTopSellers.map((item, index) => (
                <li key={item.id} className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">{index + 1}. {item.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {item.id} &bull; Qty: {item.quantity} &bull; Cat: {item.abcCategory || 'N/A'}</p>
                  </div>
                  <Badge variant={getAbcCategoryBadgeVariant(item.abcCategory)}>{item.abcCategory}</Badge>
                </li>
              ))}
            </ul>
          )}
           <p className="text-xs text-muted-foreground mt-4 italic">
              Note: This is a simplified prediction. A real-world ML model would use historical sales data, trends, seasonality, and other factors.
            </p>
        </CardContent>
      </Card>

      <Card className="flex-grow flex flex-col min-h-0"> {/* Added min-h-0 for flexbox sizing */}
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Inventory Overview
          </CardTitle>
          <CardDescription>
            Real-time view of inventory items, quantities, locations, and ABC categorization.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-4">
          {inventoryItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No inventory items yet. Scan a QR code to add items.</p>
          ) : (
          <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                      ABC
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                              <p className="text-sm">
                                  <strong className="text-destructive">A:</strong> High-value items. <br />
                                  <strong className="text-secondary-foreground">B:</strong> Medium-value items. <br />
                                  <strong className="text-muted-foreground">C:</strong> Low-value items.
                              </p>
                          </TooltipContent>
                      </Tooltip>
                  </div>
                </TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Last Movement</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map((item) => {
                const effectiveStatus = getEffectiveStatus(item);
                const itemIsExpired = isExpired(item.expiryDate);
                const itemIsNearExpiry = isNearExpiry(item.expiryDate);

                return (
                  <TableRow
                      key={item.id}
                      className={
                          itemIsExpired ? 'bg-destructive/10 hover:bg-destructive/20'
                          : itemIsNearExpiry ? 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/40'
                          : item.abcCategory === 'A' && effectiveStatus === 'In Stock' ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                          : 'hover:bg-muted/50'
                      }
                      data-testid={`inventory-item-${item.id}`}
                  >
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-center">
                          {item.abcCategory ? (
                            <Badge variant={getAbcCategoryBadgeVariant(item.abcCategory)} className="text-xs">
                                {item.abcCategory}
                            </Badge>
                          ) : (
                              <span className="text-muted-foreground text-xs italic">N/A</span>
                          )}
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell>
                          <div className="flex items-center gap-1">
                              {item.location ? (
                                  <>
                                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                      <span className="truncate">{item.location}</span>
                                  </>
                              ) : (
                                  <span className="text-muted-foreground italic">N/A</span>
                              )}
                          </div>
                      </TableCell>
                      <TableCell>
                      {item.expiryDate ? (
                          <div className="flex items-center gap-1">
                          <CalendarDays className={`h-4 w-4 shrink-0 ${
                              itemIsExpired ? 'text-destructive'
                              : itemIsNearExpiry ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-muted-foreground'}`}
                          />
                          <span className={`${
                              itemIsExpired ? 'text-destructive font-semibold'
                              : itemIsNearExpiry ? 'text-yellow-700 dark:text-yellow-300 font-medium'
                              : ''}`}>
                              {formatDate(item.expiryDate)}
                          </span>
                          </div>
                      ) : (
                          <span className="text-muted-foreground">N/A</span>
                      )}
                      </TableCell>
                      <TableCell>
                        {item.lastMovementDate ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{formatDate(item.lastMovementDate)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                      <Badge variant={getStatusVariant(effectiveStatus, item.quantity, item.abcCategory)} className="whitespace-nowrap">
                          {effectiveStatus}
                      </Badge>
                      </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </TooltipProvider>
        )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryDashboard;
