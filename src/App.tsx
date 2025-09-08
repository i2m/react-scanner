import { HeroUIProvider } from "@heroui/react";
import { ScannerTable } from "./scanner/table";
import { TokensCacheProvider } from "./scanner/api/cache/tokens";
import { PagedTokensCacheProvider } from "./scanner/api/cache/paged-tokens";
import {
  NEW_TOKENS_FILTERS,
  TRENDING_TOKENS_FILTERS,
} from "./scanner/task-types";
import "./App.css";

function App() {
  return (
    <HeroUIProvider>
      <TokensCacheProvider>
        <div className="tables">
          <div className="trending-tokens">
            <PagedTokensCacheProvider>
              <ScannerTable filter={TRENDING_TOKENS_FILTERS} />
            </PagedTokensCacheProvider>
          </div>
          <div className="new-tokens">
            <PagedTokensCacheProvider>
              <ScannerTable filter={NEW_TOKENS_FILTERS} />
            </PagedTokensCacheProvider>
          </div>
        </div>
      </TokensCacheProvider>
    </HeroUIProvider>
  );
}
export default App;
