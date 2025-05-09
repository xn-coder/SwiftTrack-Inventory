
"use client"; 

import React, { useState, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { QrCode, LayoutDashboard, Bell, Grid, Package, PieChart, Archive, LineChart, FileText } from 'lucide-react'; 
import Link from 'next/link';
import InventoryDashboard from '@/components/inventory-dashboard';
import QrScanner from '@/components/qr-scanner';
import QrCodeGenerator from '@/components/qr-code-generator';
import Notifications from '@/components/notifications';
import AbcAnalysisView from '@/components/abc-analysis-view';
import DeadStockView from '@/components/dead-stock-view';
import AnalyticsDashboard from '@/components/analytics-dashboard'; // New component
import ReportsView from '@/components/reports-view'; // New component
import { calculateAbcAnalysis } from '@/lib/inventory-utils';
import type { Supplier } from '@/lib/types';
import { ThemeToggle } from "@/components/theme-toggle";

// Define the structure of the inventory item
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  location: string | null;
  expiryDate: string | null;
  status: string; 
  unitCost?: number;
  unitPrice?: number; // Added for profit margin calculation
  abcCategory?: 'A' | 'B' | 'C';
  dateAdded: string; 
  lastMovementDate?: string; 
  supplierId?: string; // For supplier performance
  purchaseDate?: string; // For stock aging and supplier performance
}

const today = new Date();
const getDateString = (offsetDays: number = 0): string => {
  const date = new Date(today);
  date.setDate(today.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

const mockSuppliers: Supplier[] = [
    { id: 'SUP001', name: 'Global Electronics Ltd.', contactEmail: 'sales@globalelec.com', performanceRating: 4.5, leadTimeDays: 14, onTimeDeliveryRate: 0.95 },
    { id: 'SUP002', name: 'Office Supreme Inc.', contactEmail: 'orders@officesupreme.com', performanceRating: 4.2, leadTimeDays: 7, onTimeDeliveryRate: 0.92 },
    { id: 'SUP003', name: 'Fresh Produce Co.', contactEmail: 'fresh@produceco.com', performanceRating: 4.8, leadTimeDays: 2, onTimeDeliveryRate: 0.98 },
    { id: 'SUP004', name: 'Tech Parts Direct', contactEmail: 'support@techparts.com', performanceRating: 3.9, leadTimeDays: 21, onTimeDeliveryRate: 0.88 },
];


// Mock initial data (can be fetched from API later)
const initialInventoryItems: InventoryItem[] = [
  { id: 'QR12345', name: 'Wireless Mouse', quantity: 5, location: 'Aisle 3, Shelf B', expiryDate: null, status: 'Critical', unitCost: 15.00, unitPrice: 29.99, dateAdded: getDateString(-100), lastMovementDate: getDateString(-5), supplierId: 'SUP001', purchaseDate: getDateString(-110) },
  { id: 'QR67890', name: 'Keyboard', quantity: 75, location: 'Aisle 1, Shelf A', expiryDate: null, status: 'In Stock', unitCost: 30.00, unitPrice: 59.99, dateAdded: getDateString(-200), lastMovementDate: getDateString(-10), supplierId: 'SUP001', purchaseDate: getDateString(-210) },
  { id: 'QR11223', name: 'Organic Milk', quantity: 20, location: 'Cold Storage 1', expiryDate: getDateString(15), status: 'Low Stock', unitCost: 2.00, unitPrice: 3.99, dateAdded: getDateString(-5), lastMovementDate: getDateString(-2), supplierId: 'SUP003', purchaseDate: getDateString(-7) },
  { id: 'QR44556', name: 'Printer Paper (Ream)', quantity: 500, location: 'Warehouse Back, Rack 5', expiryDate: null, status: 'In Stock', unitCost: 4.50, unitPrice: 8.99, dateAdded: getDateString(-365), lastMovementDate: getDateString(-120), supplierId: 'SUP002', purchaseDate: getDateString(-370)},
  { id: 'QR77889', name: 'Hand Sanitizer (500ml)', quantity: 3, location: 'Office Supply Closet', expiryDate: getDateString(20), status: 'Critical', unitCost: 3.00, unitPrice: 6.99, dateAdded: getDateString(-30), lastMovementDate: getDateString(-1), supplierId: 'SUP002', purchaseDate: getDateString(-35) },
  { id: 'QR00100', name: 'Laptop Stand', quantity: 150, location: 'Aisle 2, Shelf C', expiryDate: null, status: 'In Stock', unitCost: 25.00, unitPrice: 49.99, dateAdded: getDateString(-180), lastMovementDate: getDateString(-95), supplierId: 'SUP004', purchaseDate: getDateString(-190) },
  { id: 'QR00200', name: 'Coffee Beans (1kg)', quantity: 5, location: 'Pantry', expiryDate: getDateString(180), status: 'Critical', unitCost: 12.00, unitPrice: 24.99, dateAdded: getDateString(-60), lastMovementDate: getDateString(-3), supplierId: 'SUP003', purchaseDate: getDateString(-65) },
  { id: 'QR00300', name: 'Office Chair', quantity: 10, location: 'Storage Room', expiryDate: null, status: 'Low Stock', unitCost: 90.00, unitPrice: 179.99, dateAdded: getDateString(-400), lastMovementDate: getDateString(-150), supplierId: 'SUP004', purchaseDate: getDateString(-410) },
  { id: 'QR00400', name: 'External SSD 1TB', quantity: 30, location: 'Tech Storage', expiryDate: null, status: 'In Stock', unitCost: 70.00, unitPrice: 119.99, dateAdded: getDateString(-90), lastMovementDate: getDateString(-30), supplierId: 'SUP001', purchaseDate: getDateString(-95) },
  { id: 'QR00500', name: 'Notebooks (Pack of 5)', quantity: 200, location: 'Stationery Cabinet', expiryDate: null, status: 'In Stock', unitCost: 6.00, unitPrice: 12.99, dateAdded: getDateString(-250), lastMovementDate: getDateString(-100), supplierId: 'SUP002', purchaseDate: getDateString(-255) },
  { id: 'QR00600', name: 'Expired Product (Test)', quantity: 10, location: 'Disposal Area', expiryDate: getDateString(-5), status: 'Expired', unitCost: 10.00, unitPrice: 19.99, dateAdded: getDateString(-100), lastMovementDate: getDateString(-100), supplierId: 'SUP004', purchaseDate: getDateString(-105) },
  { id: 'QR00700', name: 'New Product Fast Mover', quantity: 50, location: 'Hot Items Shelf', expiryDate: getDateString(365), status: 'In Stock', unitCost: 20.00, unitPrice: 39.99, dateAdded: getDateString(-10), lastMovementDate: getDateString(-1), supplierId: 'SUP001', purchaseDate: getDateString(-12) },
];


export default function Home() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialInventoryItems);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [activeSection, setActiveSection] = useState('scan');
  const [processedInventoryItems, setProcessedInventoryItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    setProcessedInventoryItems(calculateAbcAnalysis(inventoryItems));
  }, [inventoryItems]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'scan':
        return (
          <div id="scan" className="h-full">
            <QrScanner inventoryItems={inventoryItems} setInventoryItems={setInventoryItems} />
          </div>
        );
      case 'dashboard':
        return (
          <div id="dashboard" className="h-full">
            <InventoryDashboard inventoryItems={processedInventoryItems} />
          </div>
        );
      case 'analytics':
        return (
          <div id="analytics" className="h-full">
            <AnalyticsDashboard inventoryItems={processedInventoryItems} />
          </div>
        );
      case 'reports':
        return (
          <div id="reports" className="h-full">
            <ReportsView inventoryItems={processedInventoryItems} suppliers={suppliers} />
          </div>
        );
      case 'notifications':
        return (
          <div id="notifications" className="h-full">
            <Notifications inventoryItems={processedInventoryItems} lowStockThreshold={20} nearExpiryDays={30} />
          </div>
        );
      case 'generate':
        return (
          <div id="generate" className="h-full">
            <QrCodeGenerator />
          </div>
        );
      case 'abc-analysis':
        return (
          <div id="abc-analysis" className="h-full">
            <AbcAnalysisView inventoryItems={processedInventoryItems} />
          </div>
        );
      case 'dead-stock':
        return (
          <div id="dead-stock" className="h-full">
            <DeadStockView inventoryItems={processedInventoryItems} />
          </div>
        );
      default:
        return (
           <div id="scan" className="h-full">
            <QrScanner inventoryItems={inventoryItems} setInventoryItems={setInventoryItems} />
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
               <Package className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-semibold">SwiftTrack</h2>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                    tooltip="Scan QR Code"
                    isActive={activeSection === 'scan'}
                    onClick={() => setActiveSection('scan')}
                 >
                  <QrCode />
                  <span>Scan QR Code</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                    tooltip="Dashboard"
                    isActive={activeSection === 'dashboard'}
                    onClick={() => setActiveSection('dashboard')}
                >
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Analytics"
                  isActive={activeSection === 'analytics'}
                  onClick={() => setActiveSection('analytics')}
                >
                  <LineChart />
                  <span>Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Reports"
                  isActive={activeSection === 'reports'}
                  onClick={() => setActiveSection('reports')}
                >
                  <FileText />
                  <span>Reports</span>
                </SidebarMenuButton>
              </SidebarMenuItem>


              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="ABC Analysis"
                  isActive={activeSection === 'abc-analysis'}
                  onClick={() => setActiveSection('abc-analysis')}
                >
                  <PieChart />
                  <span>ABC Analysis</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                    tooltip="Dead Stock"
                    isActive={activeSection === 'dead-stock'}
                    onClick={() => setActiveSection('dead-stock')}
                >
                  <Archive />
                  <span>Dead Stock</span>
                </SidebarMenuButton>
              </SidebarMenuItem>


               <SidebarMenuItem>
                <SidebarMenuButton
                    tooltip="Notifications"
                    isActive={activeSection === 'notifications'}
                    onClick={() => setActiveSection('notifications')}
                >
                  <Bell />
                  <span>Notifications</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

               <SidebarMenuItem>
                <SidebarMenuButton
                    tooltip="Generate QR (Test)"
                    isActive={activeSection === 'generate'}
                    onClick={() => setActiveSection('generate')}
                >
                  <Grid />
                  <span>Generate QR</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex flex-col grow overflow-hidden">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <SidebarTrigger className="md:hidden"/>
             <h1 className="text-xl font-semibold text-primary flex-1">SwiftTrack Inventory</h1>
             <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:px-6 sm:py-4 md:gap-8">
               {renderActiveSection()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
