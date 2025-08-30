# Backend Unused Code Analysis Report

## Summary
This report identifies unused files, exports, and dependencies in the SVD MilkSync backend.

## Unused Files (Safe to Delete)
Based on knip analysis, the following files are unused:

1. **createAdmin.js** - Admin creation script (not referenced in routes or main app)
2. **createTestBill.js** - Test bill creation script (not referenced in routes or main app)
3. **createTestOrder.js** - Test order creation script (not referenced in routes or main app)
4. **createTestPayment.js** - Test payment creation script (not referenced in routes or main app)
5. **migrateOrders.js** - Migration script (not referenced in routes or main app)
6. **migrateProductCosts.js** - Migration script (not referenced in routes or main app)

## Unused Exports (Safe to Remove)
Based on knip analysis, the following exports are unused:

### middlewares/upload.js
- `debugUpload` - Not used anywhere in the codebase

## All Models Are Used
All model files are properly referenced:
- Admin.js - Used in adminController, orderController, createTestPayment, createTestBill, createTestOrder, migrateOrders, createAdmin
- Bill.js - Used in billsController, orderController, createTestBill, distributorController
- ContactDetails.js - Used in adminController
- Distributor.js - Used in distributorController, orderController, createTestPayment, createTestBill, createTestOrder, paymentService, walletService
- Order.js - Used in billsController, orderController, createTestBill, createTestOrder, migrateOrders, distributorController
- Payment.js - Used in paymentController, createTestPayment, paymentService, distributorController
- Product.js - Used in billsController, orderController, productController, createTestBill, createTestOrder, migrateProductCosts
- Staff.js - Used in staffController, orderController, migrateOrders

## All Middlewares Are Used
All middleware files are properly referenced:
- adminOrStaffMiddleware.js - Used in admin, productRoutes, orderRoutes, billsRoutes, paymentRoutes, walletRoutes
- adminRoleMiddleware.js - Used in admin, productRoutes
- authMiddleware.js - Used in admin, productRoutes, orderRoutes, billsRoutes, paymentRoutes, walletRoutes, staff, distributor
- distributorRoleMiddleware.js - Used in orderRoutes, billsRoutes, paymentRoutes
- upload.js - Used in productRoutes (upload function)

## All Controllers Are Used
All controller files are properly referenced through routes:
- adminController.js - Used in admin routes
- billsController.js - Used in billsRoutes
- distributorController.js - Used in admin and distributor routes
- orderController.js - Used in orderRoutes
- paymentController.js - Used in paymentRoutes
- productController.js - Used in productRoutes
- staffController.js - Used in admin and staff routes
- walletController.js - Used in walletRoutes

## All Services Are Used
All service files are properly referenced:
- paymentService.js - Used in paymentController
- walletService.js - Used in walletController

## Unused Dependencies (Report Only)
Based on depcheck analysis:
- depcheck (dev dependency)
- eslint-plugin-unused-imports (dev dependency)
- knip (dev dependency)
- madge (dev dependency)

These are analysis tools and should be removed after cleanup.

## Route Analysis
All routes are properly mapped to controllers. No unused routes found.

## Recommendations
1. **Safe to Delete**: All 6 unused script files
2. **Safe to Remove**: debugUpload export from upload.js
3. **Keep**: All models, middlewares, controllers, and services
4. **Remove**: Analysis tool dependencies after cleanup
