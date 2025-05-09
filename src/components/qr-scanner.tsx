"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, QrcodeErrorCallback, QrcodeSuccessCallback } from 'html5-qrcode';
import type { Html5QrcodeResult } from 'html5-qrcode/esm/html5-qrcode-result';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScanLine, AlertTriangle, MapPin, TriangleAlert } from 'lucide-react'; 
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { InventoryItem } from '@/app/page';


// Define the structure expected from the QR code JSON
interface QrData {
  id: string;
  name: string;
  expiryDate?: string | null;
  unitCost?: number | null;
  unitPrice?: number | null;
  supplierId?: string | null;
  purchaseDate?: string | null;
}

interface QrScannerProps {
  inventoryItems: InventoryItem[];
  setInventoryItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}


const QrScanner: React.FC<QrScannerProps> = ({ inventoryItems, setInventoryItems }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [lastScannedData, setLastScannedData] = useState<QrData | null>(null);
  const [decodedDataType, setDecodedDataType] = useState<string | null>(null);
  const [itemToLocateId, setItemToLocateId] = useState<string | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [currentLocationInput, setCurrentLocationInput] = useState('');

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const qrcodeRegionId = "html5qr-code-full-region";

  // Effect for camera permission and stream acquisition
  useEffect(() => {
    let streamInstance: MediaStream | null = null;

    const getCameraPermission = async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        console.warn("Camera access requires a browser environment with mediaDevices support.");
        setHasCameraPermission(false);
        return;
      }
      try {
        streamInstance = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        setMediaStream(streamInstance);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setMediaStream(null);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use the scanner.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach(track => track.stop());
      }
      setMediaStream(null); // Clear the stream state on unmount
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // toast is stable, effect runs once on mount for permission

  // Effect for attaching stream to video element
  useEffect(() => {
    if (hasCameraPermission && mediaStream && videoRef.current) {
      if (!isScanning) { // Only set srcObject if not actively scanning with library
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.error("Error playing video preview:", e));
      }
    }
    // Cleanup srcObject when mediaStream is no longer valid or component unmounts
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [hasCameraPermission, mediaStream, isScanning]);


  // Effect for scanner cleanup
   useEffect(() => {
    return () => {
      const currentScanner = scannerRef.current;
      if (currentScanner) {
          currentScanner.clear().catch(e => console.warn("Error clearing scanner on unmount:", e));
          scannerRef.current = null;
          const scannerElement = document.getElementById(qrcodeRegionId);
          if (scannerElement) scannerElement.innerHTML = ''; // Clear content
      }
      setIsScanning(false); 
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const onScanSuccess: QrcodeSuccessCallback = (decodedText, decodedResult: Html5QrcodeResult) => {
    console.log(`Scan result: ${decodedText}`, decodedResult);
    setLastScannedData(null);
    setDecodedDataType(typeof decodedText);
    const currentDate = new Date().toISOString().split('T')[0];

    try {
      const parsedData: QrData = JSON.parse(decodedText);

      if (!parsedData || typeof parsedData.id !== 'string' || typeof parsedData.name !== 'string') {
        throw new Error("Invalid QR code data format. Expected JSON with 'id' and 'name'.");
      }
      // Validate optional numeric fields if present
      if (parsedData.unitCost !== undefined && parsedData.unitCost !== null && typeof parsedData.unitCost !== 'number') {
        throw new Error("Invalid QR code data format. 'unitCost' must be a number if present.");
      }
       if (parsedData.unitPrice !== undefined && parsedData.unitPrice !== null && typeof parsedData.unitPrice !== 'number') {
        throw new Error("Invalid QR code data format. 'unitPrice' must be a number if present.");
      }
      // Validate optional string fields (dates, supplierId)
      if (parsedData.expiryDate !== undefined && parsedData.expiryDate !== null && typeof parsedData.expiryDate !== 'string') {
        throw new Error("Invalid QR code data format. 'expiryDate' must be a string if present.");
      }
      if (parsedData.supplierId !== undefined && parsedData.supplierId !== null && typeof parsedData.supplierId !== 'string') {
        throw new Error("Invalid QR code data format. 'supplierId' must be a string if present.");
      }
       if (parsedData.purchaseDate !== undefined && parsedData.purchaseDate !== null && typeof parsedData.purchaseDate !== 'string') {
        throw new Error("Invalid QR code data format. 'purchaseDate' must be a string if present.");
      }


      setLastScannedData(parsedData);

      let currentItemLocation: string | null = null;
      setInventoryItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(item => item.id === parsedData.id);

        if (existingItemIndex > -1) {
          currentItemLocation = prevItems[existingItemIndex].location;
           toast({
            title: "Item Found",
            description: `Increased quantity for ${parsedData.name} (ID: ${parsedData.id}). Assign/Update location next.`,
          });
          return prevItems.map((item, index) =>
            index === existingItemIndex
              ? { 
                  ...item, 
                  quantity: item.quantity + 1, 
                  lastMovementDate: currentDate,
                  // Optionally update other details if QR has newer info, e.g. new expiry
                  expiryDate: parsedData.expiryDate ?? item.expiryDate,
                  unitCost: parsedData.unitCost ?? item.unitCost,
                  unitPrice: parsedData.unitPrice ?? item.unitPrice,
                  supplierId: parsedData.supplierId ?? item.supplierId,
                  purchaseDate: parsedData.purchaseDate ?? item.purchaseDate,
                } 
              : item
          );
        } else {
           toast({
            title: "New Item Added",
            description: `${parsedData.name} (ID: ${parsedData.id}) added. Assign location next.`,
          });
          const newItem: InventoryItem = {
            id: parsedData.id,
            name: parsedData.name,
            quantity: 1,
            location: null, // Will be set via dialog
            expiryDate: parsedData.expiryDate || null,
            unitCost: parsedData.unitCost, // undefined if not present
            unitPrice: parsedData.unitPrice, // undefined if not present
            supplierId: parsedData.supplierId, // undefined if not present
            purchaseDate: parsedData.purchaseDate || currentDate, // Default to today if not in QR
            status: 'In Stock', 
            dateAdded: currentDate,
            lastMovementDate: currentDate,
          };
          return [...prevItems, newItem];
        }
      });

      setItemToLocateId(parsedData.id);
      setCurrentLocationInput(currentItemLocation || '');
      setIsLocationDialogOpen(true);

    } catch (error: any) {
      console.error("Error parsing QR code data:", error);
      setLastScannedData(null);
      setDecodedDataType(null);
      toast({
        variant: "destructive",
        title: "Scan Error",
        description: error.message || "Could not read data from QR code. Ensure it contains valid JSON with 'id', 'name', and optionally 'unitCost' (number), 'unitPrice' (number), 'expiryDate' (string), 'supplierId' (string), 'purchaseDate' (string).",
      });
    }
  };


  const onScanFailure: QrcodeErrorCallback = (error) => {
     // Ignore common "not found" or "parse error" messages that occur frequently during scanning adjustments
     if (error.toLowerCase().includes("qrcode scan region") || error.toLowerCase().includes("qr code parse error") || error.toLowerCase().includes("not found")) {
       return; 
     }
     console.warn(`QR scan failure: ${error}`);
  };


  const startScan = () => {
    if (isScanning || scannerRef.current || hasCameraPermission !== true) {
      if (hasCameraPermission !== true) {
          toast({ title: "Camera required", description: "Please grant camera access first.", variant: "destructive"});
      }
      return;
    }
    
    setLastScannedData(null);
    setDecodedDataType(null);

    const targetElement = document.getElementById(qrcodeRegionId);
    if (!targetElement) {
        console.error(`QR Code scanner target element with ID '${qrcodeRegionId}' not found.`);
        toast({ title: "Scanner Error", description: "Could not find scanner display area. Try again.", variant: "destructive" });
        setIsScanning(false);
        return;
    }
    
    // Hide manual video preview if it was visible
    if (videoRef.current) videoRef.current.style.display = 'none';
    targetElement.style.display = 'block'; 
    targetElement.innerHTML = ''; 
    setIsScanning(true);


    requestAnimationFrame(() => { 
      try {
        if (scannerRef.current) { 
            scannerRef.current.clear().catch(e => console.warn("Error clearing existing scanner:", e));
            scannerRef.current = null;
        }

        const html5QrcodeScanner = new Html5QrcodeScanner(
          qrcodeRegionId,
          { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true, supportedScanTypes: [] },
          false 
        );

        scannerRef.current = html5QrcodeScanner;
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);

      } catch (error: any) {
        console.error("Error initializing/rendering QR Code scanner:", error);
        toast({
          title: "Scanner Error",
          description: `Could not initialize scanner: ${error.message || error}. Try refreshing.`,
          variant: "destructive",
        });
        setIsScanning(false);
        if (targetElement) targetElement.style.display = 'none';
        if (videoRef.current) videoRef.current.style.display = 'block'; // Show manual preview again
        scannerRef.current = null; 
      }
    });
  };


 const stopScan = () => {
    const scanner = scannerRef.current;
    if (scanner) {
        scannerRef.current = null; 

        const scannerElement = document.getElementById(qrcodeRegionId);
        const isLikelyRunning = scannerElement && scannerElement.innerHTML !== '' && getComputedStyle(scannerElement).display !== 'none';


        if(isLikelyRunning){
            scanner.clear()
                .then(() => {
                    console.log("QR Scanner stopped successfully.");
                    if (scannerElement) scannerElement.style.display = 'none'; 
                })
                .catch(error => {
                    if (!error.message.toLowerCase().includes("scanner already cleared") && 
                        !error.message.toLowerCase().includes("element not found") &&
                        !error.message.toLowerCase().includes("camera not found") &&
                        !error.message.toLowerCase().includes("video source is not running"))
                     {
                        console.error("Failed to clear html5-qrcode scanner.", error);
                        toast({
                            title: "Scanner Error",
                            description: "Could not stop the scanner cleanly.",
                            variant: "destructive",
                        });
                    } else {
                         console.log("Scanner clear() called but it was already stopped/cleared or element/camera missing.");
                    }
                }).finally(() => {
                     if (isScanning) setIsScanning(false); 
                     if (scannerElement) scannerElement.style.display = 'none';
                     // Show manual video preview again if permission is granted
                     if (videoRef.current && hasCameraPermission) videoRef.current.style.display = 'block';
                });
        } else {
             if (isScanning) setIsScanning(false); 
             if (scannerElement) scannerElement.style.display = 'none';
             if (videoRef.current && hasCameraPermission) videoRef.current.style.display = 'block';
             console.log("Attempted to stop scan, but scanner wasn't actively running, was already cleared, or element was hidden.");
        }
    } else {
        if (isScanning) setIsScanning(false);
        const scannerElement = document.getElementById(qrcodeRegionId);
        if (scannerElement) scannerElement.style.display = 'none';
        if (videoRef.current && hasCameraPermission) videoRef.current.style.display = 'block';
        console.log("Attempted to stop scan, but no active scanner instance found.");
    }
};

  const handleSaveLocation = () => {
    if (!itemToLocateId) return;

    setInventoryItems(prevItems =>
      prevItems.map(item =>
        item.id === itemToLocateId
          ? { ...item, location: currentLocationInput.trim() || null }
          : item
      )
    );

    toast({
      title: "Location Updated",
      description: `Location set to "${currentLocationInput.trim() || 'N/A'}" for item ID ${itemToLocateId}.`,
    });

    setIsLocationDialogOpen(false);
    setItemToLocateId(null);
    setCurrentLocationInput('');
  };

  const handleCloseDialog = () => {
    setIsLocationDialogOpen(false);
    setItemToLocateId(null);
    setCurrentLocationInput('');
     toast({
        title: "Location Update Cancelled",
        variant: "default",
        description: "No location was assigned or updated for the last scanned item.",
    });
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-primary" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>
          Scan QR codes to add/update inventory. Ensure QR contains JSON with 'id', 'name', and optionally other fields like 'unitCost', 'unitPrice', 'supplierId', 'purchaseDate'.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-y-auto p-4">
         <div className="relative mb-4 w-full aspect-video rounded-md overflow-hidden bg-muted flex items-center justify-center border">
            {/* This div is where the Html5QrcodeScanner will render its UI when active */}
            <div id={qrcodeRegionId} className="absolute inset-0 z-10" style={{display: isScanning ? 'block' : 'none'}}></div>
            
            {/* Manual video preview: shown when not actively scanning AND camera permission exists */}
            <video 
                ref={videoRef} 
                className="w-full h-full object-cover" 
                autoPlay 
                muted 
                playsInline
                style={{display: !isScanning && hasCameraPermission === true ? 'block' : 'none' }}
            />

            {/* Overlay text messages */}
            {!isScanning && hasCameraPermission === true && (
                 <div className="absolute inset-0 flex items-center justify-center text-white bg-black/40 pointer-events-none">
                     Camera ready. Click Start Scan.
                 </div>
            )}
            {hasCameraPermission === null && !isScanning && (
                <p className="text-muted-foreground">Checking camera permissions...</p>
            )}
            {hasCameraPermission === false && !isScanning && (
                <p className="text-destructive-foreground bg-destructive/80 p-4 rounded">Camera access denied or unavailable.</p>
            )}
             {isScanning && !scannerRef.current?.isScanning && ( // scannerRef.current?.isScanning might not be reliable immediately
                 <p className="absolute bottom-2 left-2 text-white bg-black/50 px-2 py-1 rounded text-xs z-20">Initializing scanner...</p>
             )}
        </div>

         {hasCameraPermission === false && (
            <Alert variant="destructive" className="mb-4 shrink-0">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Camera permission was denied or is unavailable. Please allow camera access in your browser settings and refresh the page to use the scanner.
              </AlertDescription>
            </Alert>
         )}

         {lastScannedData && !isScanning && !isLocationDialogOpen && (
          <Alert className="mt-4 border-primary/50 bg-primary/5 shrink-0">
             <ScanLine className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">Last Scan Details</AlertTitle>
            <AlertDescription>
              ID: {lastScannedData.id} <br />
              Name: {lastScannedData.name} <br />
              {lastScannedData.expiryDate && `Expiry: ${lastScannedData.expiryDate}`} <br />
              {lastScannedData.unitCost !== undefined && lastScannedData.unitCost !== null && `Unit Cost: $${lastScannedData.unitCost.toFixed(2)}`} <br />
              {lastScannedData.unitPrice !== undefined && lastScannedData.unitPrice !== null && `Unit Price: $${lastScannedData.unitPrice.toFixed(2)}`} <br />
              {lastScannedData.supplierId && `Supplier ID: ${lastScannedData.supplierId}`} <br />
              {lastScannedData.purchaseDate && `Purchase Date: ${lastScannedData.purchaseDate}`} <br />
              Data Type: {decodedDataType || 'N/A'}
              <p className="mt-2 text-muted-foreground italic">Location assignment was pending or cancelled.</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-auto pt-4 flex justify-center gap-4 shrink-0">
          {!isScanning ? (
            <Button
                onClick={startScan}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={hasCameraPermission !== true}
                >
              <ScanLine className="mr-2 h-4 w-4" /> Start Scan
            </Button>
          ) : (
            <Button
                onClick={stopScan}
                variant="destructive"
                >
              Stop Scan
            </Button>
          )}
        </div>

        <Dialog open={isLocationDialogOpen} onOpenChange={ (open) => !open && handleCloseDialog() }>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"> <MapPin className="h-5 w-5 text-primary"/> Assign Location</DialogTitle>
              <DialogDescription>
                Enter the location for item: <strong>{inventoryItems.find(item => item.id === itemToLocateId)?.name || 'N/A'}</strong> (ID: {itemToLocateId}). Leave blank for no location.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Location
                </Label>
                <Input
                  id="location"
                  value={currentLocationInput}
                  onChange={(e) => setCurrentLocationInput(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Aisle 3, Shelf B"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
               <DialogClose asChild>
                  <Button type="button" variant="secondary" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
               </DialogClose>
              <Button type="button" onClick={handleSaveLocation}>Save Location</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
};

export default QrScanner;

    