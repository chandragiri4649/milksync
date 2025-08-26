// Manual route analysis based on route files
const routes = [
  // Admin routes
  { path: '/admin/login', methods: ['POST'], controller: 'adminController.login' },
  { path: '/admin/staff', methods: ['GET', 'POST'], controller: 'staffController.getAllStaff, staffController.addStaff' },
  { path: '/admin/staff/:id', methods: ['PUT', 'DELETE'], controller: 'staffController.updateStaff, staffController.deleteStaff' },
  { path: '/admin/test', methods: ['PUT'], controller: 'anonymous' },
  { path: '/admin/distributors', methods: ['GET', 'POST'], controller: 'distributorController.getAllDistributors, distributorController.addDistributor' },
  { path: '/admin/distributors/:id/full-data', methods: ['GET'], controller: 'distributorController.getDistributorFullData' },
  { path: '/admin/distributors/:id', methods: ['PUT', 'DELETE'], controller: 'distributorController.updateDistributor, distributorController.deleteDistributor' },
  { path: '/admin/contact-details', methods: ['GET', 'POST'], controller: 'adminController.getContactDetails, adminController.addContactDetails' },
  { path: '/admin/contact-details/:id', methods: ['PUT', 'DELETE'], controller: 'adminController.updateContactDetails, adminController.deleteContactDetails' },

  // Bills routes
  { path: '/bills', methods: ['GET'], controller: 'billsController.getBillsByDistributor' },
  { path: '/bills/distributor', methods: ['GET'], controller: 'billsController.getDistributorBills' },
  { path: '/bills/create', methods: ['POST'], controller: 'billsController.upsertBillFromOrder' },
  { path: '/bills', methods: ['POST'], controller: 'billsController.createBill' },

  // Distributor routes
  { path: '/distributor/login', methods: ['POST'], controller: 'distributorController.distributorLogin' },
  { path: '/distributor/profile', methods: ['GET'], controller: 'distributorController.getDistributorProfile' },
  { path: '/distributor/products/:id', methods: ['GET'], controller: 'distributorController.getProductsByDistributor' },

  // Order routes
  { path: '/orders', methods: ['POST'], controller: 'orderController.createOrder' },
  { path: '/orders', methods: ['GET'], controller: 'orderController.getMyOrders' },
  { path: '/orders/all', methods: ['GET'], controller: 'orderController.getAllOrders' },
  { path: '/orders/:id', methods: ['DELETE', 'PUT'], controller: 'orderController.deleteOrder, orderController.updateOrder' },
  { path: '/orders/:id/deliver', methods: ['POST'], controller: 'orderController.markOrderDelivered' },
  { path: '/orders/tomorrow/pending', methods: ['GET'], controller: 'orderController.getTomorrowPendingOrders' },
  { path: '/orders/distributor/:id', methods: ['GET'], controller: 'orderController.getDistributorOrders' },
  { path: '/orders/:id/confirm-delivery', methods: ['POST'], controller: 'orderController.confirmDistributorDelivery' },

  // Payment routes
  { path: '/payments', methods: ['GET'], controller: 'paymentController.getPayments' },
  { path: '/payments/distributor', methods: ['GET'], controller: 'paymentController.getDistributorPayments' },
  { path: '/payments', methods: ['POST'], controller: 'paymentController.createPayment' },

  // Product routes
  { path: '/products', methods: ['POST'], controller: 'productController.createProductWithImage' },
  { path: '/products', methods: ['GET'], controller: 'productController.getProducts' },
  { path: '/products/:id', methods: ['PUT'], controller: 'productController.updateProductWithImage' },
  { path: '/products/company/:companyName', methods: ['GET'], controller: 'productController.getProductsByCompany' },
  { path: '/products/:id', methods: ['DELETE'], controller: 'productController.deleteProduct' },
  { path: '/products/calculate-total', methods: ['POST'], controller: 'productController.calculateTotalCost' },

  // Staff routes
  { path: '/staff/login', methods: ['POST'], controller: 'staffController.staffLogin' },

  // Wallet routes
  { path: '/wallet', methods: ['GET'], controller: 'walletController.getWallet' },
  { path: '/wallet/credit', methods: ['POST'], controller: 'walletController.creditWallet' },
  { path: '/wallet/debit', methods: ['POST'], controller: 'walletController.debitWallet' }
];

console.log(JSON.stringify(routes, null, 2));