/**
 * Amazon.in Associates tag. Not issued yet (account not applied for) —
 * set NEXT_PUBLIC_AMAZON_TAG once the account is approved.
 */
const ASSOCIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG ?? "";

/**
 * Builds an Amazon.in "add to cart" link for several books at once.
 * Books without an ASIN are skipped. Until real ASINs exist (Payload CMS),
 * falls back to an Amazon.in search so the button still goes somewhere.
 *
 * Check Amazon.in Associates' current rules before launch (see docs/CONTEXT.md §12).
 */
export function amazonCartUrl(books: { asin?: string }[], fallbackQuery: string) {
  const withAsin = books.filter((b) => b.asin);
  if (withAsin.length === 0) {
    const q = new URLSearchParams({ k: fallbackQuery, i: "stripbooks" });
    if (ASSOCIATE_TAG) q.set("tag", ASSOCIATE_TAG);
    return `https://www.amazon.in/s?${q}`;
  }
  const q = new URLSearchParams();
  withAsin.forEach((b, i) => {
    q.set(`ASIN.${i + 1}`, b.asin!);
    q.set(`Quantity.${i + 1}`, "1");
  });
  if (ASSOCIATE_TAG) q.set("AssociateTag", ASSOCIATE_TAG);
  return `https://www.amazon.in/gp/aws/cart/add.html?${q}`;
}

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
