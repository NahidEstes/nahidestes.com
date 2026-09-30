import type { ContentItem, SiteSettingsData } from "@/types/content";

export const images = {
  hero: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=2400&q=90",
  food: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=85",
  architecture: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=1400&q=85",
  coast: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=1400&q=85",
  street: "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1400&q=85",
  tea: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1400&q=85",
  morocco: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1400&q=85",
  lake: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=85",
  workspace: "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1800&q=85",
  projectFood: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=1600&q=85",
  projectHome: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1600&q=85",
};

const article = (title: string) => `<p>${title} began as a quiet observation: the most memorable places reveal themselves slowly. This story follows the people, details and daily rituals that give a destination its character.</p><h2>Looking beyond the postcard</h2><p>Travel becomes richer when we leave room for conversation, local food and unplanned turns. These notes pair practical context with photographs made along the way.</p><blockquote>To notice a place is to give it time.</blockquote><p>The resulting collection is an invitation to travel with attention, curiosity and respect.</p>`;
const editorialSections = (subject: string) => [
  { number:"01", heading:"Looking beyond the postcard", blocks:[{type:"paragraph" as const,text:`<p>${subject} rewards a slower kind of attention. The details that remain are rarely the landmarks alone, but the gestures, textures and conversations found between them.</p>`}] },
  { number:"02", heading:"The rhythm of everyday life", blocks:[{type:"paragraph" as const,text:"<p>Morning light, an open doorway and the sound of a neighborhood waking up reveal how a place is truly lived. Time spent without an itinerary makes room for these quieter observations.</p>"},{type:"pullquote" as const,text:"The most lasting stories often begin with a small moment noticed well.",source:"Nahid Estes",variant:"inline" as const}] },
  { number:"03", heading:"People, place and memory", blocks:[{type:"paragraph" as const,text:"<p>Food, craft and shared rituals carry memory across generations. Listening to the people who keep them alive gives every photograph and field note a deeper context.</p>"},{type:"callout" as const,title:"Travel with care",text:"Ask before photographing people, support local makers and leave enough time for a real conversation."}] },
  { number:"04", heading:"A final reflection", blocks:[{type:"paragraph" as const,text:"<p>The journey continues long after returning home. Images become prompts, notes become stories, and ordinary details become a way back into the feeling of a place.</p>"}] },
];

export const projects: ContentItem[] = [
  { title: "Restaurant Platform", slug: "restaurant-platform", excerpt: "A digital home for an independent restaurant, built around story, seasonality and simple reservations.", content: article("Restaurant Platform"), featuredImage: images.projectFood, imageAlt: "Seasonal dish on a restaurant table", category: "Web Development", tags: ["UX/UI", "Food & Hospitality"], status: "published", publishedAt: "2026-08-12", isFeatured: true, technologies: ["Next.js", "TypeScript", "MongoDB"], year: 2026 },
  { title: "Home Inventory App", slug: "home-inventory-app", excerpt: "A calm, useful way to catalogue the things that make a home.", content: article("Home Inventory App"), featuredImage: images.projectHome, imageAlt: "Warm modern home interior", category: "Product Design", tags: ["Web Development", "Lifestyle"], status: "published", publishedAt: "2026-06-03", isFeatured: true, technologies: ["React", "Product Design"], year: 2026 },
  { title: "Field Notes Archive", slug: "field-notes-archive", excerpt: "A searchable editorial archive for photographs and travel notes.", content: article("Field Notes Archive"), featuredImage: images.workspace, imageAlt: "Creative workspace with notebook", category: "Editorial", tags: ["Design Systems", "Content"], status: "published", publishedAt: "2025-11-19", isFeatured: false, technologies: ["Next.js", "Search"], year: 2025 },
];

export const photography: ContentItem[] = [
  { title: "At the Table", slug: "at-the-table", excerpt: "Food, hands and shared tables across the Mediterranean.", content: article("At the Table"), featuredImage: images.food, imageAlt: "Colorful Mediterranean meal", category: "Food", tags: ["Food", "People"], location: "Mediterranean", status: "published", publishedAt: "2026-07-08", isFeatured: true },
  { title: "Doors and Courtyards", slug: "doors-and-courtyards", excerpt: "Light, texture and geometry in old cities.", content: article("Doors and Courtyards"), featuredImage: images.architecture, imageAlt: "Historic archway and lantern", category: "Architecture", tags: ["Architecture"], location: "Marrakech", status: "published", publishedAt: "2026-05-17", isFeatured: true },
  { title: "Coastlines", slug: "coastlines", excerpt: "Cliff paths, blue water and villages shaped by the sea.", content: article("Coastlines"), featuredImage: images.coast, imageAlt: "Mediterranean town on the Amalfi coast", category: "Landscapes", tags: ["Landscapes", "Travel"], location: "Italy", status: "published", publishedAt: "2026-04-24", isFeatured: true },
  { title: "Streets at Noon", slug: "streets-at-noon", excerpt: "Ordinary moments found between destinations.", content: article("Streets at Noon"), featuredImage: images.street, imageAlt: "Sunlit narrow street", category: "Street Scenes", tags: ["Street", "People"], location: "Southern Europe", status: "published", publishedAt: "2026-02-11", isFeatured: true },
];

export const places: ContentItem[] = [
  { title: "Timeless Towns Along the Amalfi Coast", slug: "timeless-towns-amalfi-coast", excerpt: "Colorful villages, dramatic cliffs and a way of life that feels beautifully simple.", content: article("Timeless Towns Along the Amalfi Coast"), sections:editorialSections("The Amalfi Coast"), featuredImage: images.coast, imageAlt: "Amalfi coast village above the sea", gallery:[{url:images.street,alt:"Sunlit lane lined with flowers",caption:"An unhurried street above the coast.",width:1400,height:1000},{url:images.food,alt:"A shared Mediterranean table",caption:"Local food tells its own story.",width:1400,height:1000},{url:images.lake,alt:"Mountains meeting still water",caption:"The landscape at the quiet edge of day.",width:1400,height:900}], category: "Travel", tags: ["Italy", "Coast"], country: "Italy", location: "Amalfi Coast", status: "published", publishedAt: "2026-08-20", isFeatured: true },
  { title: "The Culture of Tea in Türkiye", slug: "culture-of-tea-turkiye", excerpt: "More than a drink — it is a tradition, a conversation and a way of life.", content: article("The Culture of Tea in Türkiye"), sections:editorialSections("Tea culture in Türkiye"), featuredImage: images.tea, imageAlt: "Turkish tea served in a glass", gallery:[{url:images.food,alt:"Dishes gathered around a shared table",caption:"Hospitality is expressed through what is shared.",width:1400,height:1000},{url:images.street,alt:"A warm street scene in the old city",caption:"Conversations unfold in cafés and quiet lanes.",width:1400,height:1000},{url:images.architecture,alt:"Historic architecture at dusk",caption:"Evening settles over the city.",width:1400,height:900}], category: "Food & Culture", tags: ["Türkiye", "Tea"], country: "Türkiye", location: "Istanbul", status: "published", publishedAt: "2026-07-14", isFeatured: true },
  { title: "Colors, Craft and Everyday Beauty", slug: "colors-craft-everyday-beauty", excerpt: "A journey through vibrant streets, local crafts and timeless traditions.", content: article("Colors, Craft and Everyday Beauty"), sections:editorialSections("Marrakech"), featuredImage: images.morocco, imageAlt: "Warm Moroccan courtyard", gallery:[{url:images.architecture,alt:"Marrakech architecture in warm evening light",caption:"Geometry, color and patient craft.",width:1400,height:1000},{url:images.street,alt:"Narrow street in warm light",caption:"A quiet turn away from the market.",width:1400,height:1000},{url:images.food,alt:"Colorful dishes on a table",caption:"The colors of the table echo the city.",width:1400,height:900}], category: "Culture", tags: ["Morocco", "Craft"], country: "Morocco", location: "Marrakech", status: "published", publishedAt: "2026-06-28", isFeatured: true },
];

export const posts: ContentItem[] = [
  { title: "A Food Lover’s Guide to Istanbul", slug: "food-lovers-guide-istanbul", excerpt: "Markets, meze and memorable flavors from a city that brings people together.", content: article("A Food Lover’s Guide to Istanbul"), sections:editorialSections("Istanbul"), featuredImage: images.food, imageAlt: "Market dishes in Istanbul", gallery:[{url:images.tea,alt:"Tea served in a traditional glass",caption:"A pause for tea between market visits.",width:1400,height:1000},{url:images.street,alt:"A sunlit city street",caption:"Following the everyday rhythm of the neighborhood.",width:1400,height:1000},{url:images.architecture,alt:"Historic city architecture",caption:"Layers of history frame the table.",width:1400,height:900}], category: "Food", tags: ["Istanbul", "Guide"], status: "published", publishedAt: "2026-09-12", isFeatured: true },
  { title: "Finding Beauty in Ordinary Streets", slug: "finding-beauty-ordinary-streets", excerpt: "Small details, quiet corners and everyday scenes that tell a bigger story.", content: article("Finding Beauty in Ordinary Streets"), featuredImage: images.street, imageAlt: "Quiet sunlit street", category: "Photography", tags: ["Street", "Photography"], status: "published", publishedAt: "2026-08-28", isFeatured: false },
  { title: "Slow Travel in the Lake District", slug: "slow-travel-lake-district", excerpt: "Mountains, quiet villages and a different kind of adventure.", content: article("Slow Travel in the Lake District"), featuredImage: images.lake, imageAlt: "Mountain lake at sunset", category: "Travel", tags: ["England", "Slow Travel"], status: "published", publishedAt: "2026-08-10", isFeatured: false },
  { title: "How I Build Digital Stories", slug: "how-i-build-digital-stories", excerpt: "A practical look at the bridge between product thinking and editorial craft.", content: article("How I Build Digital Stories"), featuredImage: images.workspace, imageAlt: "Laptop and camera in a creative studio", category: "Development", tags: ["Process", "Design"], status: "published", publishedAt: "2026-07-22", isFeatured: false },
];

export const defaultSettings: SiteSettingsData = {
  siteTitle: "Nahid Estes",
  tagline: "Developer · Photographer · Visual Storyteller",
  biography: "I’m Nahid Estes — a web developer, photographer and visual storyteller with a passion for meaningful experiences. Through code, photography and writing, I explore the connections between people, places, food and culture.",
  profileImage: images.workspace,
  email: "hello@nahidestes.com",
  socialLinks: { instagram: "#", facebook: "#", youtube: "#", linkedin: "#" },
};

export const samples = { posts, projects, photography, places };
