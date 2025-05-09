import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Clock, TriangleAlert } from 'lucide-react'; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { InventoryItem } from '@/app/page';


interface NotificationsProps {
  inventoryItems: InventoryItem[];
  lowStockThreshold?: number; 
  nearExpiryDays?: number; 
}

const Notifications: React.FC<NotificationsProps> = ({
    inventoryItems,
    lowStockThreshold = 20, 
    nearExpiryDays = 30, 
}) => {

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    return new Date(expiryDate) < today;
  };

  const isNearExpiry = (expiryDate: string | null): boolean => {
    if (!expiryDate || isExpired(expiryDate)) return false; 
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= nearExpiryDays && diffDays >= 0;
  };

  const lowStockItems = inventoryItems.filter(
    item => !isExpired(item.expiryDate) && item.quantity > 0 && item.quantity <= lowStockThreshold
  );

  const expiringItems = inventoryItems.filter(item => isNearExpiry(item.expiryDate) || isExpired(item.expiryDate));

   expiringItems.sort((a, b) => {
      const aExpired = isExpired(a.expiryDate);
      const bExpired = isExpired(b.expiryDate);
      if (aExpired && !bExpired) return -1;
      if (!aExpired && bExpired) return 1;
      const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
      const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
      return dateA - dateB;
   });


  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Notifications & Alerts
        </CardTitle>
         <CardDescription>
          Important updates regarding inventory levels and expiration dates.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
         {lowStockItems.length > 0 && (
            <div>
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
                  <TriangleAlert className="h-5 w-5 text-yellow-600 dark:text-yellow-400"/>
                  Low Stock Alerts (≤ {lowStockThreshold})
                </h3>
                 {lowStockItems.map((item) => (
                    <Alert key={`${item.id}-low`} variant="default" className="mb-2 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800">
                    <TriangleAlert className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertTitle>Low Stock: {item.name} ({item.id})</AlertTitle>
                    <AlertDescription>
                        Current quantity ({item.quantity}) is at or below the threshold ({lowStockThreshold}). Consider reordering. Location: {item.location || 'N/A'}.
                    </AlertDescription>
                    </Alert>
                ))}
            </div>
         )}

        {expiringItems.length > 0 && (
             <div>
                 <h3 className="text-lg font-medium mb-2 flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
                     <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400"/> Expiration Alerts (≤ {nearExpiryDays} Days or Expired)
                 </h3>
                {expiringItems.map((item) => {
                    const expired = isExpired(item.expiryDate);
                    return (
                        <Alert key={`${item.id}-expiry`} variant={expired ? "destructive" : "default"} className={`mb-2 ${!expired ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800' : ''}`}>
                        {expired ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                        <AlertTitle>{expired ? 'Expired:' : 'Nearing Expiry:'} {item.name} ({item.id})</AlertTitle>
                        <AlertDescription>
                        {expired ?
                            `Item expired on ${formatDate(item.expiryDate)}. Please remove from stock.` :
                            `Item will expire on ${formatDate(item.expiryDate)}. Plan accordingly.`
                        }
                        Location: {item.location || 'N/A'}.
                        </AlertDescription>
                        </Alert>
                    );
                 })}
             </div>
        )}

        {lowStockItems.length === 0 && expiringItems.length === 0 && (
             <p className="text-muted-foreground italic text-center py-4">No active low stock or expiration alerts.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default Notifications;