import reviewsJson from "../../../public/covers/reviews.json";
import { MOCK_BOOKS } from "../../_data/curation-mock";
import { ReviewWall, type Review } from "../book/ReviewWall";

const TITLES = new Map(MOCK_BOOKS.map((b) => [b.id, b.title]));

const REVIEWS: Review[] = reviewsJson.map((r) => {
  const title = TITLES.get(r.bookId);
  return { quote: r.quote, who: r.attribution, book: title ? { title, href: `/books/${r.bookId}` } : undefined };
});

export function Reviews() {
  return <ReviewWall reviews={REVIEWS} id="home-reviews" className="relative z-10 bg-[#fffdf8] py-20 sm:py-28" />;
}
