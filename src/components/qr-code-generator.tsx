
"use client";

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Grid } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface QrData {
  id: string;
  name: string;
  expiryDate?: string | null;
  unitCost?: number | null;
  unitPrice?: number | null; // Added unitPrice
  supplierId?: string | null; // Added supplierId
  purchaseDate?: string | null; // Added purchaseDate
}

const QrCodeGenerator: React.FC = () => {
  const [itemId, setItemId] = useState<string>('QR12345');
  const [itemName, setItemName] = useState<string>('Wireless Mouse');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [unitCost, setUnitCost] = useState<string>('15.00');
  const [unitPrice, setUnitPrice] = useState<string>('29.99'); // Default unit price
  const [supplierId, setSupplierId] = useState<string>('SUP001');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [qrValue, setQrValue] = useState<string>('');
  const { toast } = useToast();

  const generateQrCode = React.useCallback(() => {
     if (!itemId || !itemName) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter at least Item ID and Item Name.",
      });
      setQrValue('');
      return;
    }

    const cost = parseFloat(unitCost);
    const price = parseFloat(unitPrice);

    if (unitCost && isNaN(cost)) {
        toast({
            variant: "destructive",
            title: "Invalid Unit Cost",
            description: "Please enter a valid number for Unit Cost or leave it blank.",
        });
        setQrValue('');
        return;
    }
    if (unitPrice && isNaN(price)) {
        toast({
            variant: "destructive",
            title: "Invalid Unit Price",
            description: "Please enter a valid number for Unit Price or leave it blank.",
        });
        setQrValue('');
        return;
    }


    const dataToEncode: QrData = {
      id: itemId.trim(),
      name: itemName.trim(),
      expiryDate: expiryDate ? expiryDate.trim() : null,
      unitCost: unitCost ? (isNaN(cost) ? null : cost) : null,
      unitPrice: unitPrice ? (isNaN(price) ? null : price) : null,
      supplierId: supplierId ? supplierId.trim() : null,
      purchaseDate: purchaseDate ? purchaseDate.trim() : null,
    };
    try {
        const jsonString = JSON.stringify(dataToEncode);
        setQrValue(jsonString);
         toast({
            title: "QR Code Generated",
            description: `Encoded data for ${itemName}.`,
         });
    } catch (error) {
         console.error("Error stringifying data:", error);
         toast({
            variant: "destructive",
            title: "Encoding Error",
            description: "Could not generate QR code due to a data error.",
         });
         setQrValue('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, itemName, expiryDate, unitCost, unitPrice, supplierId, purchaseDate, toast]); 

   useEffect(() => {
     generateQrCode();
   }, [generateQrCode]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Grid className="h-5 w-5 text-primary" />
          QR Code Generator (for Testing)
        </CardTitle>
        <CardDescription>
          Enter item details to generate a QR code. Include Unit Cost/Price for profit margins, Supplier ID, and Purchase Date for other reports.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
            <Label htmlFor="item-id">Item ID:</Label>
            <Input
                id="item-id"
                type="text"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                placeholder="e.g., QR12345"
            />
            </div>
            <div className="space-y-2">
            <Label htmlFor="item-name">Item Name:</Label>
            <Input
                id="item-name"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Wireless Mouse"
            />
            </div>
             <div className="space-y-2">
            <Label htmlFor="unit-cost">Unit Cost (Optional):</Label>
            <Input
                id="unit-cost"
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="e.g., 15.00"
                step="0.01"
            />
            </div>
            <div className="space-y-2">
            <Label htmlFor="unit-price">Unit Price (Optional):</Label>
            <Input
                id="unit-price"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="e.g., 29.99"
                step="0.01"
            />
            </div>
            <div className="space-y-2">
            <Label htmlFor="expiry-date">Expiry Date (Optional):</Label>
            <Input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
            />
            </div>
            <div className="space-y-2">
            <Label htmlFor="supplier-id">Supplier ID (Optional):</Label>
            <Input
                id="supplier-id"
                type="text"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                placeholder="e.g., SUP001"
            />
            </div>
            <div className="space-y-2">
            <Label htmlFor="purchase-date">Purchase Date (Optional):</Label>
            <Input
                id="purchase-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
            />
            </div>
        </div>

        <Button onClick={generateQrCode} className="shrink-0 self-start">Generate QR Code</Button>

        {qrValue && (
          <div className="mt-4 flex flex-col items-center space-y-2 p-4 border rounded-md bg-muted/20 shrink-0">
            <QRCode value={qrValue} size={160} level={"H"} includeMargin={true} renderAs="svg" />
            <p className="text-sm text-muted-foreground">Scan this code</p>
            <p className="text-xs text-muted-foreground break-all max-w-md text-center">Data: {qrValue}</p>
          </div>
        )}
         <div className="flex-grow"></div>
      </CardContent>
    </Card>
  );
};

export default QrCodeGenerator;
