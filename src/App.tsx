import "./App.css";
import { Table } from "./scanner/table";
import { TokensCacheProvider } from "./scanner/api/cache/tokens";
import { PagedTokensCacheProvider } from "./scanner/api/cache/paged-tokens";
import {
  NEW_TOKENS_FILTERS,
  TRENDING_TOKENS_FILTERS,
} from "./scanner/task-types";

function App() {
  return (
    <TokensCacheProvider>
      <div className="container">
        <div className="card">
          <PagedTokensCacheProvider>
            <Table filter={TRENDING_TOKENS_FILTERS} />
          </PagedTokensCacheProvider>
        </div>
        <div className="card">
          <PagedTokensCacheProvider>
            <Table filter={NEW_TOKENS_FILTERS} />
          </PagedTokensCacheProvider>
        </div>
      </div>
    </TokensCacheProvider>
  );
}
export default App;
