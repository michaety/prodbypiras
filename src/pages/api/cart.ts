// API endpoint for managing cart items in KV storage
export const prerender = false;

export async function POST({ request, locals }) {
  try {
    const { NAMESPACE } = locals.runtime.env;
    const { id, action } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing listing id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get current cart from KV
    const cartJson = await NAMESPACE.get("cart");
    const cart = cartJson ? JSON.parse(cartJson) : [];

    if (action === "add") {
      // Add item to cart if not already there
      if (!cart.includes(id)) {
        cart.push(id);
        await NAMESPACE.put("cart", JSON.stringify(cart));
      }
      return new Response(
        JSON.stringify({ success: true, cart, message: "Added to cart" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else if (action === "remove") {
      // Remove item from cart
      const index = cart.indexOf(id);
      if (index > -1) {
        cart.splice(index, 1);
        await NAMESPACE.put("cart", JSON.stringify(cart));
      }
      return new Response(
        JSON.stringify({ success: true, cart, message: "Removed from cart" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error managing cart:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET({ locals }) {
  try {
    const { NAMESPACE } = locals.runtime.env;
    const cartJson = await NAMESPACE.get("cart");
    const cart = cartJson ? JSON.parse(cartJson) : [];

    return new Response(JSON.stringify({ cart }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting cart:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE({ locals }) {
  try {
    const { NAMESPACE } = locals.runtime.env;
    await NAMESPACE.put("cart", JSON.stringify([]));

    return new Response(JSON.stringify({ success: true, message: "Cart cleared" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
