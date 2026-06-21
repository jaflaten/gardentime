// Side-effect module: install the in-memory localStorage shim at IMPORT time, before any store
// module evaluates. Import this FIRST (it's the first import of bootstrap.ts). Needed because some
// src libs statically import plants.ts -> useGardenStore, whose module-init calls loadBoxes() against
// localStorage. Node 25 also ships a built-in localStorage accessor that must be overridden.

import { installMemoryStorage } from "./localStorage";

installMemoryStorage();
