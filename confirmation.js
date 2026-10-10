document.addEventListener("DOMContentLoaded", () => {
  const shop = window.DemoShop;
  const order = shop.getState().lastOrder;
  const container = document.getElementById("confirmation-summary");
  if (!order) {
    container.innerHTML = '<p>No recent demo order is stored. <a href="index.html">Return to the store</a>.</p>';
    return;
  }
  container.innerHTML = `<div><span>Order reference</span><strong>${order.number}</strong></div><div><span>Items</span><strong>${order.items.reduce((sum, item) => sum + item.quantity, 0)}</strong></div><div><span>Demo total</span><strong>${shop.format(order.total)}</strong></div>`;
});
