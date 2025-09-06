# Product Fields Migration Guide

## Overview
This migration updates the Product model to use clearer field names that distinguish between product specifications and order quantities.

## Changes Made

### Frontend Changes
- ✅ **ProductManagement.jsx**: Updated to use `productQuantity` and `productUnit`
- ✅ **PlaceOrders.jsx**: Updated to display `productQuantity`/`productUnit` but use `orderQuantity`/`orderUnit` for user input

### Backend Changes
- ✅ **Product.js Model**: Updated schema to use `productQuantity` and `productUnit`
- ✅ **productController.js**: Updated all CRUD operations to use new field names
- ✅ **orderController.js**: Updated populate calls to use new field names
- ✅ **Migration Script**: Created to update existing data

## Field Mapping

### Before (Confusing)
```javascript
// Product Management
{
  name: "Milk",
  quantity: 500,    // Product's inherent size
  unit: "ml"        // Product's unit
}

// Place Orders
{
  name: "Milk",
  quantity: 10,     // User's order quantity (confusing!)
  unit: "tub"       // User's order unit (confusing!)
}
```

### After (Clear)
```javascript
// Product Management
{
  name: "Milk",
  productQuantity: 500,    // Product's inherent size
  productUnit: "ml"        // Product's unit
}

// Place Orders
{
  name: "Milk",
  productQuantity: 500,    // Product's inherent size (display only)
  productUnit: "ml",       // Product's unit (display only)
  orderQuantity: 10,       // User's order quantity
  orderUnit: "tub"         // User's order unit
}
```

## Migration Steps

### 1. Run the Migration Script
```bash
cd server
node scripts/migrate-product-fields.js
```

### 2. Verify Migration
The script will:
- ✅ Connect to your MongoDB database
- ✅ Find all products with old field names
- ✅ Copy `quantity` → `productQuantity`
- ✅ Copy `unit` → `productUnit`
- ✅ Remove old fields
- ✅ Verify no old fields remain

### 3. Test the Application
After migration:
1. **Product Management**: Create/edit products with new field names
2. **Place Orders**: Verify products display correctly with their inherent quantities
3. **Order Processing**: Ensure orders are created with user input quantities

## Benefits

1. **Clear Separation**: Product specs vs order quantities are now distinct
2. **No Confusion**: Users can clearly see product size vs what they're ordering
3. **Better UX**: Product cards show "Milk (500ml)" - clear and informative
4. **Maintainable**: Code is easier to understand and maintain

## Rollback Plan

If you need to rollback:
1. Restore database from backup
2. Revert frontend changes
3. Revert backend changes

## Support

If you encounter any issues during migration:
1. Check the migration script logs
2. Verify MongoDB connection
3. Ensure all products have required fields before migration
