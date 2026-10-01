import type { ContentCollection } from "@/types/content";
import type { AdminRole } from "./admin-types";
import { ContentManager } from "./content-list/content-manager";

export function ContentList({ collection, role }: { collection: ContentCollection; role: AdminRole }) {
  return <ContentManager collection={collection} role={role}/>;
}
