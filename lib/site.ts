/** Brand, navigation and placeholder routes for the Larkspur prototype. */

export const brand = {
  name: "Larkspur",
  planner: "Larkspur Planner",
} as const;

export type RoomCategory = "living" | "bedroom" | "office" | "dining" | "kitchen";

export const roomCategories: { id: RoomCategory; label: string }[] = [
  { id: "living", label: "Living room" },
  { id: "bedroom", label: "Bedroom" },
  { id: "office", label: "Home office" },
  { id: "dining", label: "Dining room" },
  { id: "kitchen", label: "Kitchen" },
];

export type NavItem = { label: string; href: string; current?: boolean };

export const mainNav: NavItem[] = [
  { label: "Products", href: "/products" },
  { label: "Rooms", href: "/#furnished-rooms" },
  { label: "Offers", href: "/offers" },
  { label: "Inspiration", href: "/inspiration" },
  { label: "Design & planning", href: "/", current: true },
];

/**
 * Routes the header, footer and promos link to that sit outside this POC.
 * Each renders a short holding page (app/[...slug]) so every link resolves.
 */
export const placeholderPages: Record<string, { title: string; blurb: string }> = {
  products: { title: "Products", blurb: "The full product range lives in the main shop." },
  offers: { title: "Offers", blurb: "Seasonal offers and member prices." },
  inspiration: { title: "Inspiration", blurb: "Room stories, style guides and small-space ideas." },
  planners: { title: "Specialist planners", blurb: "Kitchen, wardrobe and storage planners built for those spaces." },
  planner: { title: "3D planner", blurb: "The interactive 3D planner opens here." },
  account: { title: "Your account", blurb: "Sign in to see saved designs and orders." },
  favourites: { title: "Favourites", blurb: "Products and rooms you have saved." },
  bag: { title: "Shopping bag", blurb: "Your bag is empty." },
  stores: { title: "Find a store", blurb: "Showrooms and pick-up points near you." },
  delivery: { title: "Delivery", blurb: "Check delivery options for your PIN code." },
  club: { title: "Larkspur Club", blurb: "Free membership with member prices and design perks." },
  "design-advice": { title: "Design advice", blurb: "Book a session with one of our interior stylists." },
  help: { title: "Customer help", blurb: "Orders, returns, assembly and care." },
  about: { title: "About Larkspur", blurb: "Who we are and how we make things." },
  app: { title: "Larkspur app", blurb: "Plan rooms and shop from your phone." },
  privacy: { title: "Privacy policy", blurb: "How we handle your data." },
  terms: { title: "Terms of use", blurb: "The terms that apply to this site." },
  cookies: { title: "Cookie policy", blurb: "Which cookies we use and why." },
};

export const footerColumns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Larkspur Club",
    links: [
      { label: "Join the club", href: "/club" },
      { label: "Member prices", href: "/club" },
      { label: "Your account", href: "/account" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Design advice", href: "/design-advice" },
      { label: "Room planner", href: "/" },
      { label: "Specialist planners", href: "/planners" },
      { label: "Delivery", href: "/delivery" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Customer help", href: "/help" },
      { label: "Find a store", href: "/stores" },
      { label: "Shopping bag", href: "/bag" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About Larkspur", href: "/about" },
      { label: "Inspiration", href: "/inspiration" },
      { label: "Get the app", href: "/app" },
    ],
  },
];
