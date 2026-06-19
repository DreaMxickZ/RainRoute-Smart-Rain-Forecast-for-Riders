import type { Route } from "@/types";
import data from "@/data/routes.json";

interface RoutesFile {
  routes: Route[];
}

const FILE = data as RoutesFile;

export const routeService = {
  list(): Route[] {
    return FILE.routes;
  },
  get(id: string): Route | undefined {
    return FILE.routes.find((r) => r.id === id);
  },
};
