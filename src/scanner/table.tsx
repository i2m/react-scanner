import { useCallback, useEffect, useRef, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { formatDistanceToNowStrict } from "date-fns";
import { useTableModel } from "./table-model";
import type { GetScannerResultParams } from "./task-types";
import "./table.css";
import { Spinner } from "@heroui/react";

const DEFAULT_TABLE_HEIGHT = 600;
const DEFAULT_TABLE_ROW_HEIGHT = 32;

const nf = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface TableProps {
  filter: GetScannerResultParams;
}
export function ScannerTable({ filter }: TableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const { tokens, totalTokensCount, fetchNextPage, loading } =
    useTableModel(filter);

  const loadMore = useCallback(() => {
    if (loading) {
      return;
    }
    fetchNextPage();
  }, [fetchNextPage, loading]);

  const [hasMore, setHasMore] = useState(false);
  const [loaderRef, scrollerRef] = useInfiniteScroll({
    hasMore,
    onLoadMore: loadMore,
    shouldUseLoader: true,
  });

  useEffect(() => {
    setHasMore(totalTokensCount > tokens.length);
    if (containerRef.current && containerRef.current!.firstElementChild) {
      scrollerRef.current = containerRef.current
        .firstElementChild as HTMLElement;
    }
  }, [scrollerRef, tokens.length, totalTokensCount]);

  return (
    <div className="container" ref={containerRef}>
      <Table
        ref={tableRef}
        aria-label="Scanner Table"
        classNames={{
          table: "table",
        }}
        isHeaderSticky
        isVirtualized
        bottomContent={
          hasMore ? (
            <div
              className="flex w-full justify-center"
              ref={loaderRef as React.Ref<HTMLDivElement>}
            >
              <Spinner />
            </div>
          ) : null
        }
        maxTableHeight={
          containerRef.current?.clientHeight || DEFAULT_TABLE_HEIGHT
        }
        rowHeight={DEFAULT_TABLE_ROW_HEIGHT}
      >
        <TableHeader>
          <TableColumn className="name">Token</TableColumn>
          <TableColumn className="exchange">Exchange</TableColumn>
          <TableColumn className="price">Price</TableColumn>
          <TableColumn>Marketcap</TableColumn>
          <TableColumn>Volume</TableColumn>
          <TableColumn>5m</TableColumn>
          <TableColumn>1h</TableColumn>
          <TableColumn>6h</TableColumn>
          <TableColumn>24h</TableColumn>
          <TableColumn>Age</TableColumn>
          <TableColumn>Buys</TableColumn>
          <TableColumn>Sells</TableColumn>
          <TableColumn>Liquidity</TableColumn>
        </TableHeader>
        <TableBody items={tokens}>
          {(token) => (
            <TableRow key={token.id}>
              <TableCell className="name">{`${token.tokenName}/${token.chain}`}</TableCell>
              <TableCell className="exchange" title={token.exchange}>
                {token.exchange}
              </TableCell>
              <TableCell className="price">{`$${token.priceUsd}`}</TableCell>
              <TableCell>{`$${nf.format(token.mcap)}`}</TableCell>
              <TableCell>{`$${nf.format(token.volumeUsd)}`}</TableCell>
              <TableCell>{`${nf.format(token.priceChangePcs["5m"])}%`}</TableCell>
              <TableCell>{`${nf.format(token.priceChangePcs["1h"])}%`}</TableCell>
              <TableCell>{`${nf.format(token.priceChangePcs["6h"])}%`}</TableCell>
              <TableCell>{`${nf.format(token.priceChangePcs["24h"])}%`}</TableCell>
              <TableCell>
                {formatDistanceToNowStrict(token.tokenCreatedTimestamp)}
              </TableCell>
              <TableCell>{token.transactions.buys}</TableCell>
              <TableCell>{token.transactions.sells}</TableCell>
              <TableCell>{`$${nf.format(token.liquidity.current)} (${nf.format(token.liquidity.changePc)}%)`}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
