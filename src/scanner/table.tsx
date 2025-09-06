import { useTableModel } from "./table-model";
import type { GetScannerResultParams } from "./task-types";

interface TableProps {
  filter: GetScannerResultParams;
}
export function Table({ filter }: TableProps) {
  const { tokens, fetchNextPage } = useTableModel(filter);

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>NAME</th>
            <th>MCAP</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token, i) => (
            <tr key={`${token.id}-${i}`}>
              <td>{token.tokenName}</td>
              <td>{token.mcap}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button onClick={() => fetchNextPage()}>Load More</button>
      </div>
    </>
  );
}
