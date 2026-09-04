const base = 'http://localhost:5000/api';
const loginResponse = await fetch(`${base}/admin/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'admin@homegoodshub.com', password: 'Admin@123456' }),
});
if (!loginResponse.ok) throw new Error(`LOGIN_${loginResponse.status}`);
const { token } = await loginResponse.json();
const auth = { Authorization: `Bearer ${token}` };
const productsResponse = await fetch(`${base}/products`, { headers: auth });
const products = await productsResponse.json();
const product = products.find((item) => item.active !== false && Number(item.stock) > 0);
if (!product) throw new Error('NO_ACTIVE_PRODUCT_WITH_STOCK');
const streamResponse = await fetch(`${base}/admin/events`, { headers: auth });
if (!streamResponse.ok || !streamResponse.body) throw new Error(`SSE_${streamResponse.status}`);
const reader = streamResponse.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
const eventPromise = (async () => {
  while (true) {
    const { value, done } = await reader.read();
    if (done) throw new Error('SSE_CLOSED');
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() || '';
    for (const block of blocks) {
      if (!block.includes('event: new_order')) continue;
      const line = block.split('\n').find((entry) => entry.startsWith('data: '));
      if (line) return JSON.parse(line.slice(6));
    }
  }
})();
const orderResponse = await fetch(`${base}/orders`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    customer: { name: 'Realtime Test', phone: '01000000000', governorate: 'Cairo', city: 'Cairo', address: 'Test address', notes: 'automated test' },
    items: [{ productId: product.id, quantity: 1 }],
    paymentMethod: 'cod',
  }),
});
if (!orderResponse.ok) throw new Error(`ORDER_${orderResponse.status}: ${await orderResponse.text()}`);
const createdOrder = await orderResponse.json();
const eventOrder = await Promise.race([eventPromise, new Promise((_, reject) => setTimeout(() => reject(new Error('SSE_EVENT_TIMEOUT')), 10000))]);
console.log(JSON.stringify({ orderStatus: orderResponse.status, createdOrder: createdOrder.orderNumber, eventOrder: eventOrder.orderNumber, sameOrder: createdOrder.id === eventOrder.id }, null, 2));
reader.cancel();
await fetch(`${base}/orders/${createdOrder.id}`, { method: 'DELETE', headers: auth });
