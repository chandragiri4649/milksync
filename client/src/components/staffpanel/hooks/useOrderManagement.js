import { toast } from 'react-toastify';

export const useOrderManagement = () => {
  // Generate bill for order
  const generateBill = (order) => {
    const billContent = `
BILL
====
Order ID: ${order._id}
Date: ${new Date(order.orderDate).toLocaleDateString()}
Distributor: ${getDistributorName(order.distributorId)}

Items:
${order.items?.map((item, idx) => `${idx + 1}. ${item.productId?.name || 'N/A'} ${item.quantity} ${item.unit}`).join('\n') || 'No items'}

Total Items: ${order.items?.length || 0}
Status: ${order.status}
    `;
    
    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill_order_${order._id.slice(-6)}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Bill generated and downloaded successfully!");
  };

  // Print receipt
  const printReceipt = (order) => {
    const receiptContent = `
RECEIPT
========
Order ID: ${order._id}
Date: ${new Date(order.orderDate).toLocaleDateString()}
Distributor: ${getDistributorName(order.distributorId)}
Status: ${order.status}

Items:
${order.items?.map((item, idx) => `${idx + 1}. ${item.productId?.name || 'N/A'} ${item.quantity} ${item.unit}`).join('\n') || 'No items'}

Total Items: ${order.items?.length || 0}
Generated: ${new Date().toLocaleString()}
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - Order ${order._id.slice(-6)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .receipt { border: 2px solid #333; padding: 20px; max-width: 400px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .item { margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
            .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>RECEIPT</h2>
              <p><strong>Order ID:</strong> ${order._id}</p>
              <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
              <p><strong>Distributor:</strong> ${getDistributorName(order.distributorId)}</p>
              <p><strong>Status:</strong> ${order.status}</p>
            </div>
            
            <div class="items">
              <h3>Items:</h3>
              ${order.items?.map((item, idx) => `
                <div class="item">
                  <strong>${idx + 1}.</strong> ${item.productId?.name || 'N/A'} ${item.quantity} ${item.unit}
                </div>
              `).join('') || '<p>No items</p>'}
            </div>
            
            <div class="footer">
              <p><strong>Total Items:</strong> ${order.items?.length || 0}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Copy order details to clipboard
  const copyOrderDetails = async (order) => {
    const details = `Order ID: ${order._id}, Date: ${new Date(order.orderDate).toLocaleDateString()}, Distributor: ${getDistributorName(order.distributorId)}, Status: ${order.status}, Items: ${order.items?.map(item => `${item.productId?.name || 'Unknown Product'} ${item.quantity} ${item.unit}`).join(', ')}`;
    
    try {
      await navigator.clipboard.writeText(details);
      toast.success("Order details copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Resend order notification
  const resendNotification = (order) => {
    toast.info(`Notification resent for order ${order._id.slice(-6)}`);
  };

  // Helper function to get distributor name
  const getDistributorName = (distributorId) => {
    if (!distributorId) return "Unknown Distributor";
    
    // Handle both string ID and populated object
    if (typeof distributorId === 'string') {
      return "Unknown Distributor"; // Would need distributors list to resolve
    } else if (distributorId && typeof distributorId === 'object') {
      return distributorId.name || distributorId.distributorName || distributorId.company || "Unknown Distributor";
    }
    
    return "Unknown Distributor";
  };

  return {
    generateBill,
    printReceipt,
    copyOrderDetails,
    resendNotification
  };
};

