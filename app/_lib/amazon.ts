const ASSOCIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG ?? "";

export function amazonCartUrl(books: { asin?: string; qty?: number }[], fallbackQuery: string) {
  const withAsin = books.filter((b) => b.asin);
  if (withAsin.length === 0) {
    const q = new URLSearchParams({ k: fallbackQuery, i: "stripbooks" });
    if (ASSOCIATE_TAG) q.set("tag", ASSOCIATE_TAG);
    return `https://www.amazon.in/s?${q}`;
  }
  const q = new URLSearchParams();
  withAsin.forEach((b, i) => {
    q.set(`ASIN.${i + 1}`, b.asin!);
    q.set(`Quantity.${i + 1}`, String(b.qty ?? 1));
  });
  if (ASSOCIATE_TAG) q.set("AssociateTag", ASSOCIATE_TAG);
  return `https://www.amazon.in/gp/aws/cart/add.html?${q}`;
}

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
