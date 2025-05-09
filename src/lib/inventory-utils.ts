
import type { InventoryItem } from '@/app/page'; // Adjust path as needed

// Define the structure for items specifically for ABC calculation
interface AbcCalcItem extends InventoryItem {
  consumptionValue: number;
  originalIndex: number; // To restore original order or map back easily
}

const DEFAULT_UNIT_COST = 1; // Default cost if not provided for an item
const CATEGORY_A_THRESHOLD = 0.8; // Top 80% of consumption value
const CATEGORY_B_THRESHOLD = 0.95; // Next 15% of consumption value (80% + 15% = 95%)
// Category C is the remaining 5%

export function calculateAbcAnalysis(items: InventoryItem[]): InventoryItem[] {
  if (!items || items.length === 0) {
    return [];
  }

  const itemsWithConsumptionValue: AbcCalcItem[] = items.map((item, index) => ({
    ...item,
    unitCost: item.unitCost ?? DEFAULT_UNIT_COST,
    consumptionValue: (item.quantity || 0) * (item.unitCost ?? DEFAULT_UNIT_COST),
    originalIndex: index,
  }));

  // Filter out items that won't contribute (e.g., 0 quantity and 0 cost)
  // For ABC, we consider items with potential value, even if current quantity is 0 but cost is known
  // However, standard ABC is based on actual consumption/usage value.
  // For this, we sort by current consumptionValue.
  const sortedItems = [...itemsWithConsumptionValue].sort(
    (a, b) => b.consumptionValue - a.consumptionValue
  );

  const totalConsumptionValue = sortedItems.reduce(
    (sum, item) => sum + item.consumptionValue,
    0
  );

  const resultItems: InventoryItem[] = new Array(items.length);
  let cumulativeValue = 0;

  if (totalConsumptionValue === 0) {
    // If no consumption value, all items are effectively 'C'
    sortedItems.forEach(item => {
      resultItems[item.originalIndex] = {
        ...items[item.originalIndex], // Get original item
        unitCost: item.unitCost,
        abcCategory: 'C',
      };
    });
    return resultItems;
  }

  sortedItems.forEach(item => {
    cumulativeValue += item.consumptionValue;
    const cumulativePercentage = cumulativeValue / totalConsumptionValue;
    let abcCategory: 'A' | 'B' | 'C';

    if (item.consumptionValue === 0) {
        abcCategory = 'C'; // Items with no consumption value are C
    } else if (cumulativePercentage <= CATEGORY_A_THRESHOLD) {
      abcCategory = 'A';
    } else if (cumulativePercentage <= CATEGORY_B_THRESHOLD) {
      abcCategory = 'B';
    } else {
      abcCategory = 'C';
    }
    
    // Place the processed item back into its original position in a new array
    // This ensures the final array matches the input order, but with ABC categories
    resultItems[item.originalIndex] = { 
        ...items[item.originalIndex], // Get original item data
        unitCost: item.unitCost, // Ensure unitCost (possibly defaulted) is part of the item
        abcCategory 
    };
  });

  // Fill any potentially missed items (though logic should cover all)
  for (let i = 0; i < items.length; i++) {
    if (!resultItems[i]) {
      resultItems[i] = {
        ...items[i],
        unitCost: items[i].unitCost ?? DEFAULT_UNIT_COST,
        abcCategory: 'C', // Default to C if somehow missed
      };
    }
  }

  return resultItems;
}
